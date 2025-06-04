import os
import xml.etree.ElementTree as ET
import pandas as pd
import json

# Directory containing the uploaded XML files
data_dir = '/mnt/data'

# Mapping of store codes to friendly names
store_map = {
    '7290027600007': 'shufersal',
    '7290058140886': 'rami levi'
}

# Parse XML files into a combined list of records
records = []
for filename in os.listdir(data_dir):
    if filename.endswith('.xml'):
        store_code = filename[len('PriceFull'):].split('-', 1)[0]
        store = store_map.get(store_code, store_code)
        tree = ET.parse(os.path.join(data_dir, filename))
        root = tree.getroot()
        for item in root.findall('.//Item'):
            code = item.findtext('ItemCode')
            if code:
                records.append({
                    'ItemCode': code,
                    'name': item.findtext('ItemName'),
                    'price': float(item.findtext('ItemPrice')),
                    'store': store
                })

# Create DataFrame
df = pd.DataFrame(records)

# Separate and merge
df_shu = df[df['store'] == 'shufersal'][['ItemCode', 'name', 'price']].rename(columns={'price': 'shufersal price'})
df_rami = df[df['store'] == 'rami levi'][['ItemCode', 'price']].rename(columns={'price': 'rami levi price'})
merged = pd.merge(df_shu, df_rami, on='ItemCode', how='inner')

# Convert to JSON records
json_data = merged.to_dict(orient='records')

# Save to file
output_path = '/mnt/data/prices.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(json_data, f, ensure_ascii=False, indent=2)

# Print confirmation
output_path