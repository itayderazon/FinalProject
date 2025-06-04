import requests
import json
import time
import math

def clean_numeric_value(value):
    """Convert API value to clean number"""
    if not value:
        return None
    
    value_str = str(value)
    
    if value_str.startswith('L '):
        try:
            return float(value_str[2:]) / 2
        except:
            return None
    
    try:
        return float(value_str)
    except:
        pass
    
    # Extract first number from text
    current_num = ""
    for char in value_str:
        if char.isdigit() or char in '.,':
            current_num += char
        else:
            if current_num:
                break
    
    if current_num:
        try:
            return float(current_num.replace(',', '.'))
        except:
            return None
    
    return None

def get_nutrition_from_api(item_code):
    """Get essential nutrition data only"""
    url = "https://www.rami-levy.co.il/api/items"
    
    payload = {"ids": item_code, "type": "barcode"}
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if not data or data.get('total', 0) == 0:
            return None
        
        item = data['data'][0]
        gs = item.get('gs', {})
        
        result = {
            'item_code': str(item_code),
            'name': gs.get('name', '').strip(),
            'category': item.get('department', {}).get('name', ''),
            'subcategory': item.get('group', {}).get('name', ''),
            'calories': None,
            'protein': None,
            'total_carbs': None,
            'total_fat': None,
            'sodium': None,
            'allergens': []
        }
        
        # Extract nutrition values
        for nutrition_item in gs.get('Nutritional_Values', []):
            label = nutrition_item.get('label', '')
            fields = nutrition_item.get('fields', [])
            
            if not fields:
                continue
                
            value = clean_numeric_value(fields[0].get('value'))
            if value is None:
                continue
            
            if 'אנרגיה' in label or 'קלוריות' in label:
                result['calories'] = value
            elif label == 'שומנים (גרם)':
                result['total_fat'] = value
            elif label == 'סך הפחמימות (גרם)':
                result['total_carbs'] = value
            elif label == 'חלבונים (גרם)':
                result['protein'] = value
            elif 'נתרן' in label:
                result['sodium'] = value
        
        # Extract allergens
        allergen_codes = gs.get('Allergen_Type_Code_and_Containment', [])
        allergen_map = {6807: 'gluten', 6810: 'soy', 6821: 'milk', 6824: 'eggs', 6833: 'nuts', 6835: 'sesame'}
        result['allergens'] = [allergen_map[code] for code in allergen_codes if code in allergen_map]
        
        return result
        
    except Exception as e:
        return None

def has_complete_nutrition(item):
    """Check if item already has complete nutrition data"""
    required_fields = ['calories', 'protein', 'total_carbs', 'total_fat']
    
    for field in required_fields:
        value = item.get(field)
        if value is None:
            return False
    
    return True

def process_products(json_file_path):
    """Process only items that already have complete nutrition data"""
    with open(json_file_path, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"Loaded {len(products)} total items")
    
    # Find items that already have complete nutrition data
    items_with_nutrition = []
    items_missing_nutrition = 0
    
    for item in products:
        if has_complete_nutrition(item):
            item_code = item.get("item_code")
            if item_code:
                items_with_nutrition.append(item_code)
        else:
            items_missing_nutrition += 1
    
    print(f"Found {len(items_with_nutrition)} items with complete nutrition data")
    print(f"Skipping {items_missing_nutrition} items with missing nutrition data")
    
    results = []
    
    # Process only items that have complete nutrition data
    for i, item_code in enumerate(items_with_nutrition, 1):
        print(f"Processing {i}/{len(items_with_nutrition)}: {item_code}")
        
        nutrition_data = get_nutrition_from_api(item_code)
        if nutrition_data:
            results.append(nutrition_data)
            print(f"  ✓ Enhanced: {nutrition_data['name'][:40]}")
        else:
            print(f"  ✗ API failed")
        
        time.sleep(0.05)
    
    # Save results
    output_file = json_file_path.replace('.json', '_enhanced_nutrition.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\nSaved {len(results)} enhanced items to {output_file}")
    
    return results

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        process_products(sys.argv[1])
    else:
        print("Usage: python nutrition_scraper.py your_products.json")