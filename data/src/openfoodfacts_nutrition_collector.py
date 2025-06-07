# openfoodfacts_nutrition_collector.py - Pure nutrition data collector

import requests
import json
import time
from datetime import datetime
from pathlib import Path

class OpenFoodFactsNutritionCollector:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'NutritionApp/1.0'
        })
        
        self.results = {
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'total_processed': 0,
            'nutrition_found': 0,
            'nutrition_missing': 0,
            'errors': []
        }
    
    def get_nutrition_from_openfoodfacts(self, item_code):
        """Get nutrition data for a single item code from OpenFoodFacts"""
        try:
            url = f"https://world.openfoodfacts.org/api/v0/product/{item_code}.json"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Check if product found
            if data.get('status') != 1:
                return None
            
            product = data.get('product', {})
            nutriments = product.get('nutriments', {})
            
            if not nutriments:
                return None
            
            # Extract nutrition data (per 100g)
            nutrition = {}
            
            # Get basic macros
            if 'energy-kcal_100g' in nutriments:
                nutrition['calories'] = nutriments['energy-kcal_100g']
            if 'proteins_100g' in nutriments:
                nutrition['protein'] = nutriments['proteins_100g']
            if 'carbohydrates_100g' in nutriments:
                nutrition['carbs'] = nutriments['carbohydrates_100g']
            if 'fat_100g' in nutriments:
                nutrition['fat'] = nutriments['fat_100g']
            
            # Get additional nutrients
            if 'sodium_100g' in nutriments:
                nutrition['sodium'] = nutriments['sodium_100g'] * 1000  # Convert g to mg
            if 'fiber_100g' in nutriments:
                nutrition['fiber'] = nutriments['fiber_100g']
            if 'sugars_100g' in nutriments:
                nutrition['sugar'] = nutriments['sugars_100g']
            if 'saturated-fat_100g' in nutriments:
                nutrition['saturated_fat'] = nutriments['saturated-fat_100g']
            
            # Only return if we have basic nutrition data
            if any(key in nutrition for key in ['calories', 'protein', 'carbs', 'fat']):
                return nutrition
            
            return None
            
        except Exception as e:
            self.results['errors'].append(f"Error for {item_code}: {str(e)}")
            return None
    
    def create_nutrition_data(self, input_file, output_file="nutrition_data.json"):
        """Create pure nutrition data JSON from combined_prices.json"""
        
        # Load the price data
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                price_data = json.load(f)
        except Exception as e:
            print(f"❌ Error loading {input_file}: {e}")
            return None
        
        print(f"📥 Loaded {len(price_data)} items from {input_file}")
        
        # Filter for items starting with 729 (Israeli barcodes) to save API calls
        israeli_items = []
        other_items = []
        
        for item in price_data:
            item_code = item.get('ItemCode', '')
            if str(item_code).startswith('729'):
                israeli_items.append(item)
            else:
                other_items.append(item)
        
        print(f"🇮🇱 Found {len(israeli_items)} Israeli products (729xxx)")
        print(f"🌍 Found {len(other_items)} international products")
        print(f"💡 Processing only Israeli products to save API calls")
        print("🔍 Starting nutrition lookup with OpenFoodFacts...")
        
        nutrition_data = []
        
        for i, item in enumerate(israeli_items, 1):
            item_code = item.get('ItemCode')
            if not item_code:
                continue
            
            print(f"Processing {i}/{len(israeli_items)}: {item_code}")
            
            # Get nutrition data
            nutrition = self.get_nutrition_from_openfoodfacts(item_code)
            
            if nutrition:
                # Create nutrition record - ONLY nutrition data
                nutrition_record = {
                    'item_code': str(item_code),
                    'name': item.get('name', ''),
                    **nutrition  # Spread all nutrition fields
                }
                
                nutrition_data.append(nutrition_record)
                self.results['nutrition_found'] += 1
                print(f"  ✅ Found nutrition data")
                
                # Show sample of allergens/serving if found
                if 'allergens' in nutrition:
                    print(f"    🚨 Allergens: {', '.join(nutrition['allergens'])}")
                if 'serving_size' in nutrition:
                    print(f"    🥄 Serving: {nutrition['serving_size']}g")
            else:
                self.results['nutrition_missing'] += 1
                print(f"  ❌ No nutrition found")
            
            self.results['total_processed'] += 1
            
            # Be respectful to the API
            time.sleep(0.2)
            
            # Save progress every 100 items
            if i % 100 == 0:
                temp_file = f"nutrition_progress_{i}.json"
                with open(temp_file, 'w', encoding='utf-8') as f:
                    json.dump(nutrition_data, f, ensure_ascii=False, indent=2)
                print(f"  💾 Progress saved to {temp_file}")
        
        # Save final nutrition data
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(nutrition_data, f, ensure_ascii=False, indent=2)
            
            print(f"\n🎉 Nutrition collection complete!")
            print(f"📊 Results:")
            print(f"  Israeli products processed: {len(israeli_items)}")
            print(f"  Nutrition found: {self.results['nutrition_found']}")
            print(f"  No nutrition: {self.results['nutrition_missing']}")
            print(f"  Coverage: {self.results['nutrition_found']/len(israeli_items)*100:.1f}%")
            print(f"  International products skipped: {len(other_items)}")
            print(f"📁 Pure nutrition data saved to: {output_file}")
            
            return output_file
            
        except Exception as e:
            print(f"❌ Error saving results: {e}")
            return None
    
    def get_sample_nutrition_data(self, item_codes_list, limit=10):
        """Test the API with a small sample of item codes"""
        print(f"🧪 Testing OpenFoodFacts API with {min(limit, len(item_codes_list))} sample items...")
        
        sample_items = item_codes_list[:limit]
        results = []
        
        for i, item_code in enumerate(sample_items, 1):
            print(f"Testing {i}/{len(sample_items)}: {item_code}")
            
            nutrition = self.get_nutrition_from_openfoodfacts(item_code)
            
            result = {
                'item_code': item_code,
                'found': nutrition is not None
            }
            
            if nutrition:
                result['nutrition'] = nutrition
                print(f"  ✅ Found: {nutrition}")
            else:
                print(f"  ❌ Not found")
            
            results.append(result)
            time.sleep(0.2)
        
        # Print summary
        found_count = sum(1 for r in results if r['found'])
        print(f"\n📊 Sample test results:")
        print(f"  Found: {found_count}/{len(sample_items)} ({found_count/len(sample_items)*100:.1f}%)")
        
        return results

# Example usage
if __name__ == "__main__":
    collector = OpenFoodFactsNutritionCollector()
    
    # Create pure nutrition data from combined_prices.json
    output_file = collector.create_nutrition_data('combined_prices.json', 'nutrition_data.json')
    
    if output_file:
        print(f"✅ Success! Pure nutrition data saved to: {output_file}")
        print("\n📋 Sample output format:")
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                sample_data = json.load(f)
                if sample_data:
                    print(json.dumps(sample_data[0], ensure_ascii=False, indent=2))
        except:
            pass
    else:
        print("❌ Processing failed")

# Usage instructions:
# 1. Place this script in the same directory as your combined_prices.json
# 2. Run: python openfoodfacts_nutrition_collector.py
# 3. Output: nutrition_data.json with ONLY nutrition data