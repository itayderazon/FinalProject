import requests
import json
import time
import math
import signal
import sys
import os

# Global variables for checkpoint handling
checkpoint_file = None
processed_results = []
should_exit = False

def signal_handler(signum, frame):
    """Handle Ctrl+C gracefully by saving progress"""
    global should_exit, processed_results, checkpoint_file
    print(f"\n\nReceived interrupt signal. Saving progress...")
    
    if processed_results and checkpoint_file:
        save_checkpoint(processed_results, checkpoint_file)
        print(f"Progress saved to: {checkpoint_file}")
        print(f"Processed {len(processed_results)} items so far.")
        print("Run the script again to resume from this point.")
    
    should_exit = True
    sys.exit(0)

def load_checkpoint(checkpoint_path):
    """Load previously saved checkpoint data"""
    if os.path.exists(checkpoint_path):
        try:
            with open(checkpoint_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(f"Checkpoint found! Resuming from {len(data)} previously processed items.")
                return data
        except Exception as e:
            print(f"Error loading checkpoint: {e}")
            return []
    return []

def save_checkpoint(results, checkpoint_path):
    """Save current progress to checkpoint file"""
    try:
        with open(checkpoint_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving checkpoint: {e}")

def get_processed_item_codes(checkpoint_data):
    """Get list of already processed item codes from checkpoint"""
    return {item.get('item_code') for item in checkpoint_data if item.get('item_code')}

def clean_numeric_value(value):
    """Convert API value to clean number, handling 'L' prefix and other formats"""
    if not value:
        return None
    
    value_str = str(value).strip()
    
    # Handle "L" prefix (less than)
    if value_str.startswith('L '):
        try:
            return float(value_str[2:]) / 2  # Use half the value for "less than"
        except:
            return None
    
    # Handle "פחות מ-" prefix
    if 'פחות מ-' in value_str:
        try:
            num_part = value_str.replace('פחות מ-', '').strip()
            # Remove units
            for unit in ['גרם', 'מג', 'קלוריות']:
                num_part = num_part.replace(unit, '').strip()
            return float(num_part) / 2
        except:
            return None
    
    # Try direct conversion
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
    """
    Get nutrition data from Rami Levy API - Fixed version
    
    Args:
        item_code: The product item code (barcode)
    
    Returns:
        Dictionary with complete nutrition data or None if not found
    """
    url = "https://www.rami-levy.co.il/api/items"
    
    payload = {
        "ids": item_code,
        "type": "barcode"
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': f'https://www.rami-levy.co.il/he?item={item_code}'
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if not data or data.get('total', 0) == 0 or not data.get('data'):
            print(f"  ⚠️  NO DATA for item {item_code}: API returned empty or no results")
            return None
        
        # Get the first item from response
        item_data = data['data'][0]
        gs = item_data.get('gs', {})
        
        # Initialize result with basic info
        result = {
            'item_code': str(item_code),
            'name': gs.get('name', '').strip(),
            'category': item_data.get('department', {}).get('name', ''),
            'subcategory': item_data.get('group', {}).get('name', ''),
            'calories': None,
            'protein': None,
            'carbs': None,
            'fat': None,
            'sodium': None,
            'allergens': []
        }
        
        # Extract nutrition values from the corrected structure
        nutritional_values = gs.get('Nutritional_Values', [])
        
        if not nutritional_values:
            print(f"  ⚠️  NO NUTRITION DATA for item {item_code}: Item found but no nutritional values available")
            return result
        
        # Extract nutrition values with proper field access
        for nutrition_item in nutritional_values:
            label = nutrition_item.get('label', '')
            fields = nutrition_item.get('fields', [])
            
            if not fields:
                continue
                
            # Get the value from the first field (per 100g)
            field = fields[0]
            value = clean_numeric_value(field.get('value'))
            
            if value is None:
                continue
            
            # Map nutrition values using exact Hebrew labels from API
            if 'אנרגיה' in label or 'קלוריות' in label:
                result['calories'] = value
            elif label == 'שומנים (גרם)':
                result['fat'] = value
            elif label == 'סך הפחמימות (גרם)':
                result['carbs'] = value
            elif label == 'חלבונים (גרם)':
                result['protein'] = value
            elif 'נתרן' in label:
                result['sodium'] = value
        
        # Extract allergens from the correct field
        allergen_codes = gs.get('Allergen_Type_Code_and_Containment', [])
        allergen_map = {
            6807: 'gluten',
            6810: 'soy', 
            6821: 'milk',
            6824: 'eggs',
            6833: 'nuts',
            6835: 'sesame'
        }
        result['allergens'] = [allergen_map[code] for code in allergen_codes if code in allergen_map]
        
        # Log successful extraction
        nutrition_count = sum(1 for v in [result['calories'], result['fat'], result['carbs'], result['protein']] if v is not None)
        if nutrition_count > 0:
            print(f"  ✅ SUCCESS for item {item_code}: {result['name'][:40]} - Found {nutrition_count}/4 nutrition values")
        else:
            print(f"  ⚠️  PARTIAL SUCCESS for item {item_code}: Product info found but no nutrition values extracted")
        
        return result
        
    except requests.exceptions.Timeout:
        print(f"  ❌ TIMEOUT ERROR for item {item_code}: Request timed out after 10 seconds")
        return None
    except requests.exceptions.ConnectionError:
        print(f"  ❌ CONNECTION ERROR for item {item_code}: Failed to connect to API")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"  ❌ HTTP ERROR for item {item_code}: {e.response.status_code} - {e.response.reason}")
        return None
    except json.JSONDecodeError:
        print(f"  ❌ JSON DECODE ERROR for item {item_code}: Invalid JSON response from API")
        return None
    except KeyError as e:
        print(f"  ❌ DATA STRUCTURE ERROR for item {item_code}: Missing expected key {e} in API response")
        return None
    except Exception as e:
        print(f"  ❌ UNEXPECTED ERROR for item {item_code}: {type(e).__name__}: {e}")
        return None

def get_rami_levi_item_codes(json_data):
    """Helper function to get item codes for items with Rami Levi prices"""
    item_codes = []
    
    for item in json_data:
        rami_price = item.get("rami levi price")
        
        if rami_price is not None and not math.isnan(rami_price):
            item_codes.append(item.get("ItemCode"))
    
    return item_codes

def get_nutrition_for_rami_levi_items(json_data, checkpoint_path="nutrition_checkpoint.json"):
    """
    Get nutrition data for all items that have Rami Levi prices with checkpoint support
    
    Args:
        json_data: List of product dictionaries
        checkpoint_path: Path to save/load checkpoint data
    
    Returns:
        List of dictionaries with item codes and nutrition data
    """
    global checkpoint_file, processed_results, should_exit
    
    # Set up signal handler for graceful exit
    signal.signal(signal.SIGINT, signal_handler)
    checkpoint_file = checkpoint_path
    
    # Load existing checkpoint if available
    processed_results = load_checkpoint(checkpoint_path)
    processed_item_codes = get_processed_item_codes(processed_results)
    
    # Get item codes that have Rami Levi prices
    item_codes = get_rami_levi_item_codes(json_data)
    
    # Filter out already processed items
    remaining_item_codes = [code for code in item_codes if code not in processed_item_codes]
    
    print(f"Total items to process: {len(item_codes)}")
    print(f"Already processed: {len(processed_item_codes)}")
    print(f"Remaining: {len(remaining_item_codes)}")
    print("Press Ctrl+C at any time to save progress and exit safely.\n")
    
    for i, item_code in enumerate(remaining_item_codes, 1):
        current_progress = len(processed_item_codes) + i
        if current_progress % 1000 ==0:
            print(f"Going to sleep current progress: {current_progress}")
            time.sleep(3600)
            print(f"Woke up")
        if should_exit:
            break
        print(f"Processing {current_progress}/{len(item_codes)}: {item_code}")
        
        nutrition_data = get_nutrition_from_api(item_code)
        
        if nutrition_data:
            processed_results.append(nutrition_data)
            
            # Save checkpoint every 10 items
            if len(processed_results) % 10 == 0:
                save_checkpoint(processed_results, checkpoint_path)
                print(f"  → Checkpoint saved ({len(processed_results)} items processed)")
        
        # Add delay to be respectful to the API
        time.sleep(0.5)  # Reduced delay since your original had 0.05
    
    # Final save
    if processed_results:
        save_checkpoint(processed_results, checkpoint_path)
        print(f"\nFinal checkpoint saved with {len(processed_results)} items.")
    
    return processed_results

def finalize_results(checkpoint_path, final_output_path):
    """Convert checkpoint to final results file and clean up"""
    try:
        if os.path.exists(checkpoint_path):
            # Copy checkpoint to final output
            with open(checkpoint_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            save_results_to_file(data, final_output_path)
            
            # Remove checkpoint file
            os.remove(checkpoint_path)
            print(f"Results finalized in: {final_output_path}")
            print(f"Checkpoint file removed.")
            
            return True
    except Exception as e:
        print(f"Error finalizing results: {e}")
        return False

def save_results_to_file(results, filename="rami_levy_nutrition.json"):
    """Save the nutrition results to a JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

def print_sample_output(results, count=3):
    """Print sample results to verify data format"""
    print(f"\n📊 SAMPLE OUTPUT (first {count} items):")
    print("=" * 60)
    
    for i, item in enumerate(results[:count]):
        print(f"\nItem {i+1}:")
        print(f"  Code: {item.get('item_code')}")
        print(f"  Name: {item.get('name', '')[:50]}...")
        print(f"  Category: {item.get('category')}")
        print(f"  Subcategory: {item.get('subcategory')}")
        print(f"  Calories: {item.get('calories')}")
        print(f"  Protein: {item.get('protein')}g")
        print(f"  Carbs: {item.get('carbs')}g") 
        print(f"  Fat: {item.get('fat')}g")
        print(f"  Sodium: {item.get('sodium')}mg")
        print(f"  Allergens: {item.get('allergens')}")

# Example usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # If JSON file path is provided as argument
        json_file_path = sys.argv[1]
        
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                products_data = json.load(f)
            
            # Set up file paths
            base_name = json_file_path.replace('.json', '')
            checkpoint_path = f"{base_name}_nutrition_checkpoint.json"
            final_output_path = f"{base_name}_rami_nutrition.json"
            
            # Get nutrition data for all Rami Levi items with checkpoint support
            nutrition_results = get_nutrition_for_rami_levi_items(products_data, checkpoint_path)
            
            # If we completed successfully, finalize the results
            if nutrition_results:
                finalize_results(checkpoint_path, final_output_path)
                print_sample_output(nutrition_results)
                print(f"\n🎉 COMPLETED! Processed {len(nutrition_results)} items total.")
                print(f"📁 Results saved to: {final_output_path}")
            
        except KeyboardInterrupt:
            print("\nProcess interrupted by user.")
        except Exception as e:
            print(f"Error: {e}")
    
   
