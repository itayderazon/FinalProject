import os
import sys
import xml.etree.ElementTree as ET
import pandas as pd
import json
from pathlib import Path
from abc import ABC, abstractmethod

class Retailer(ABC):
    def __init__(self, name, directory):
        self.name = name
        self.directory = directory
        self.records = []
        self.count = 0
        
    @abstractmethod
    def process_item(self, item):
        """Process a single item from XML and return a record if valid"""
        pass
    
    def process_files(self):
        """Process all XML files for this retailer"""
        store_path = Path(self.directory)
        if not store_path.exists() or not store_path.is_dir():
            print(f"Warning: Directory {self.directory} not found or not accessible")
            return False
            
        store_xml_files = list(store_path.glob('*.xml'))
        if not store_xml_files:
            print(f"No XML files found for {self.name}")
            return False
            
        print(f"Found {len(store_xml_files)} XML files in {self.directory}")
        
        for filepath in store_xml_files:
            try:
                print(f"Processing {filepath}...")
                tree = ET.parse(filepath)
                root = tree.getroot()
                
                # Check the XML structure
                items = root.findall('.//Item')
                if not items:
                    # Try alternative paths that might be used in different XML formats
                    possible_paths = ['.//Products/Product', './/Products/Item', './Item', './/Items/Item']
                    for path in possible_paths:
                        items = root.findall(path)
                        if items:
                            print(f"Found items using alternate path: {path}")
                            break
                            
                print(f"Found {len(items)} items in {filepath.name}")
                
                for i, item in enumerate(items):
                    # Debug the first few items
                    if i < 5:
                        print(f"Item {i} tags: {[elem.tag for elem in item]}")
                    
                    record = self.process_item(item)
                    if record:
                        self.records.append(record)
                        self.count += 1
                    
                    # For debugging items specifically
                    if i < 10:
                        code = record.get('ItemCode') if record else None
                        name = record.get('name') if record else None
                        price = record.get('price') if record else None
                        print(f"{self.name} item {i}: code={code}, name={name}, price={price}")
                        # Print raw XML for the first few items
                        if i < 3:
                            ET.dump(item)
                    
            except ET.ParseError as e:
                print(f"Error: Could not parse XML file {filepath}: {str(e)}")
            except Exception as e:
                print(f"Error processing file {filepath}: {str(e)}")
                
        return True

class StandardRetailer(Retailer):
    """Base retailer class that handles the common XML format"""
    def process_item(self, item):
        # Try to extract the item code
        code = None
        for code_tag in ['ItemCode', 'Code', 'ProductCode', 'Barcode']:
            code_value = item.findtext(code_tag)  # Direct child
            if code_value:
                code = code_value
                break
                
            # Try deeper with namespace handling
            code_elem = item.find(f'.//{code_tag}')
            if code_elem is not None and code_elem.text:
                code = code_elem.text
                break
        
        # Try to extract the price
        price = None
        for price_tag in ['ItemPrice', 'Price', 'PriceValue', 'RetailPrice']:
            price_text = item.findtext(price_tag)  # Direct child
            if price_text:
                try:
                    price = float(price_text)
                    break
                except ValueError:
                    continue
                    
            # Try deeper
            price_elem = item.find(f'.//{price_tag}')
            if price_elem is not None and price_elem.text:
                try:
                    price = float(price_elem.text)
                    break
                except ValueError:
                    continue
        
        # Try to extract the name
        name = None
        for name_tag in ['ItemName', 'Name', 'ProductName', 'Description']:
            name_text = item.findtext(name_tag)  # Direct child
            if name_text:
                name = name_text
                break
                
            # Try deeper
            name_elem = item.find(f'.//{name_tag}')
            if name_elem is not None and name_elem.text:
                name = name_elem.text
                break
        
        if code and price is not None:
            return {
                'ItemCode': code,
                'name': name,
                'price': price,
                'store': self.name
            }
        
        return None


# Register all retailers
retailers = [
    StandardRetailer('shufersal', 'shufersal_data'),
    StandardRetailer('rami levi', 'rami_levy_data'),
    StandardRetailer('victory', 'victory_data'),
    StandardRetailer('tivtaam', 'TivTaam'),
    StandardRetailer('carrefour', 'carrefour_data'),
    StandardRetailer('yeinotbitan', 'yeinot_bitan_data')
]

# Process all retailers
records = []
xml_files_found = False
store_counts = {retailer.name: 0 for retailer in retailers}

for retailer in retailers:
    if retailer.process_files():
        xml_files_found = True
        records.extend(retailer.records)
        store_counts[retailer.name] = retailer.count

if not xml_files_found:
    print("No XML files found in any of the retailer directories")
    sys.exit(1)

if not records:
    print("No valid records found in the XML files")
    sys.exit(1)

print(f"Processed {len(records)} records from all stores")
print(f"Items per store: {store_counts}")

df = pd.DataFrame(records)

# Create a dictionary to store DataFrames for each retailer
retailer_dfs = {}

# Process each retailer's data
for retailer in retailers:
    retailer_df = df[df['store'] == retailer.name][['ItemCode', 'name', 'price']]
    retailer_df = retailer_df.rename(columns={'price': f'{retailer.name} price'})
    retailer_dfs[retailer.name] = retailer_df
    print(f"{retailer.name}: {len(retailer_df)} items")
    
    # Print sample data
    print(f"\nSample {retailer.name} items:")
    print(retailer_df.head(3))

# Start with the first retailer's data
merged = None
for i, (name, df_store) in enumerate(retailer_dfs.items()):
    if i == 0:
        merged = df_store
    else:
        # When merging with subsequent retailers, prefer existing name if available
        merged = pd.merge(merged, df_store, on='ItemCode', how='outer')
        
        # Handle name columns - prefer existing name
        if 'name_x' in merged.columns and 'name_y' in merged.columns:
            merged['name'] = merged['name_x'].combine_first(merged['name_y'])
            merged.drop(['name_x', 'name_y'], axis=1, inplace=True, errors='ignore')

# Filter to include only items available in at least 2 supermarkets
price_columns = [f'{retailer.name} price' for retailer in retailers]
merged['available_stores'] = merged[price_columns].notna().sum(axis=1)
merged_filtered = merged[merged['available_stores'] >= 2].drop('available_stores', axis=1)

# Convert to JSON
json_data = merged_filtered.to_dict(orient='records')
with open('combined_prices.json', 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=2)

# Also save the full dataset for reference
json_data_full = merged.to_dict(orient='records')
with open('combined_prices_all.json', 'w', encoding='utf-8') as f:
    json.dump(json_data_full, f, ensure_ascii=False, indent=2)


# Statistics
for retailer in retailers:
    store_items = sum(1 for item in json_data if item.get(f'{retailer.name} price') is not None)
    print(f"Items with {retailer.name} prices: {store_items}")

