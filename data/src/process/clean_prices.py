#!/usr/bin/env python3
"""
Clean price data by replacing NaN values with null to make valid JSON
"""

import json
import re
import os

def clean_price_data():
    """
    Read the combined prices JSON file, replace NaN with null, and save a clean version
    """
    
    # File paths
    input_file = 'scrapers/combined_prices.json'
    output_file = 'clean_combined_prices.json'
    
    print(f"🧹 Cleaning price data from {input_file}...")
    
    try:
        # Check if input file exists
        if not os.path.exists(input_file):
            print(f"❌ Input file not found: {input_file}")
            return False
            
        # Read the file as text
        with open(input_file, 'r', encoding='utf-8') as f:
            raw_data = f.read()
        
        print(f"📖 Read {len(raw_data)} characters from input file")
        
        # Replace NaN with null using regex
        # This handles cases like: "price": NaN, 
        cleaned_data = re.sub(r':\s*NaN\s*([,}])', r': null\1', raw_data)
        
        # Count replacements made
        nan_count = raw_data.count('NaN')
        print(f"🔄 Replaced {nan_count} NaN values with null")
        
        # Validate that it's now valid JSON by parsing it
        try:
            price_data = json.loads(cleaned_data)
            print(f"✅ Successfully parsed {len(price_data)} price records")
        except json.JSONDecodeError as e:
            print(f"❌ Still invalid JSON after cleaning: {e}")
            return False
        
        # Write the cleaned data to output file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(price_data, f, ensure_ascii=False, indent=2)
        
        print(f"💾 Saved clean data to {output_file}")
        
        # Print some statistics
        valid_prices = 0
        total_price_fields = 0
        
        for item in price_data:
            for field in ['shufersal price', 'rami levi price', 'victory price', 
                         'tivtaam price', 'carrefour price', 'yeinotbitan price']:
                if field in item:
                    total_price_fields += 1
                    if item[field] is not None:
                        try:
                            price_val = float(item[field])
                            if price_val > 0:
                                valid_prices += 1
                        except (ValueError, TypeError):
                            pass
        
        print(f"📊 Statistics:")
        print(f"   Total price fields: {total_price_fields}")
        print(f"   Valid prices: {valid_prices}")
        print(f"   Coverage: {(valid_prices/total_price_fields*100):.1f}%")
        
        return True
        
    except Exception as e:
        print(f"❌ Error cleaning price data: {e}")
        return False

if __name__ == "__main__":
    success = clean_price_data()
    if success:
        print("\n🎉 Price data cleaning completed successfully!")
        print("You can now use the 'clean_combined_prices.json' file in your seeder.")
    else:
        print("\n💥 Price data cleaning failed!") 