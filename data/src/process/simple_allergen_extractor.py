#!/usr/bin/env python3
"""
Simple Allergen Extractor

Goes through nutrition JSON files and extracts a distinct list of allergens.
"""

import json
import os
import argparse
from pathlib import Path
import psycopg2
import psycopg2.extras
from datetime import datetime

def extract_allergens_from_json_files(data_dir=None):
    """Extract all unique allergens from JSON files in the specified directory"""
    
    if data_dir is None:
        # Get the script's directory and navigate to Final_Data
        script_dir = Path(__file__).parent
        data_dir = script_dir / "../../Final_Data"
    
    data_path = Path(data_dir).resolve()
    all_allergens = set()
    
    print(f"🔍 Looking for JSON files in: {data_path}")
    
    if not data_path.exists():
        print(f"❌ Directory not found: {data_path}")
        return []
    
    # Find all JSON files
    json_files = list(data_path.glob("*.json"))
    print(f"📁 Found {len(json_files)} JSON files")
    
    for json_file in json_files:
        print(f"📖 Processing: {json_file.name}")
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Process the data based on its structure
            if isinstance(data, list):
                # Array of items
                for item in data:
                    extract_allergens_from_item(item, all_allergens)
            elif isinstance(data, dict):
                # Single object
                extract_allergens_from_item(data, all_allergens)
                
        except json.JSONDecodeError as e:
            print(f"⚠️  Could not parse {json_file.name}: {e}")
        except Exception as e:
            print(f"⚠️  Error reading {json_file.name}: {e}")
    
    return sorted(list(all_allergens))

def extract_allergens_from_item(item, allergens_set):
    """Extract allergens from a single data item"""
    
    if not isinstance(item, dict):
        return
    
    # Look for allergens field directly
    if 'allergens' in item and isinstance(item['allergens'], list):
        for allergen in item['allergens']:
            if allergen and isinstance(allergen, str):
                clean_allergen = allergen.strip().lower()
                if clean_allergen:
                    allergens_set.add(clean_allergen)
    
    # Also check for nested objects
    for key, value in item.items():
        if isinstance(value, dict):
            extract_allergens_from_item(value, allergens_set)
        elif isinstance(value, list):
            for sub_item in value:
                if isinstance(sub_item, dict):
                    extract_allergens_from_item(sub_item, allergens_set)

def main():
    print("🚀 Simple Allergen Extractor")
    print("=" * 40)
    
    # Extract allergens
    allergens = extract_allergens_from_json_files()
    
    print("\n" + "=" * 40)
    print("📋 DISTINCT ALLERGENS FOUND:")
    print("=" * 40)
    
    if allergens:
        print(f"Total unique allergens: {len(allergens)}\n")
        
        for i, allergen in enumerate(allergens, 1):
            print(f"{i:2d}. {allergen}")
        
        # Save to JSON file in Final_Data directory
        script_dir = Path(__file__).parent
        final_data_dir = script_dir / "../../Final_Data"
        output_file = final_data_dir.resolve() / "distinct_allergens.json"
        
        allergen_data = {
            "total_count": len(allergens),
            "allergens": allergens
        }
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(allergen_data, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Allergens saved to: {output_file}")
        except Exception as e:
            print(f"\n❌ Error saving to file: {e}")
    else:
        print("❌ No allergens found in the data files")
    
    print("\n✅ Done!")

if __name__ == "__main__":
    main() 