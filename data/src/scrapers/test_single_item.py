import sys
import os
sys.path.append('data/src/scrapers')

from NutData import get_nutrition_from_api

# Test with the yogurt item code
item_code = "11210618503"
print(f"Testing nutrition extraction for item: {item_code}")

result = get_nutrition_from_api(item_code)

if result:
    print("\n" + "="*60)
    print("EXTRACTION RESULTS:")
    print("="*60)
    print(f"Item Code: {result.get('item_code')}")
    print(f"Name: {result.get('name')}")
    print(f"Category: {result.get('category')}")
    print(f"Subcategory: {result.get('subcategory')}")
    print(f"Calories: {result.get('calories')}")
    print(f"Protein: {result.get('protein')}g")
    print(f"Carbs: {result.get('carbs')}g")
    print(f"Fat: {result.get('fat')}g")
    print(f"Sodium: {result.get('sodium')}mg")
    print(f"Allergens: {result.get('allergens')}")
    print(f"Image URL: {result.get('image_url')}")
    serving_text = f"{result.get('serving_size')} {result.get('serving_size_unit')}" if result.get('serving_size') else "Not found"
    print(f"Serving Size: {serving_text}")
    net_weight_text = f"{result.get('net_weight')} {result.get('net_weight_unit')}" if result.get('net_weight') else "Not found"
    print(f"Net Weight: {net_weight_text}")
    
    print("\n✅ Test completed successfully!")
else:
    print("❌ Failed to extract nutrition data") 