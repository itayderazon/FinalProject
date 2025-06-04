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

def build_full_image_urls(images_data):
    """Convert relative image paths to full URLs"""
    if not images_data:
        return {}
    
    base_url = "https://img.rami-levy.co.il"
    full_urls = {}
    
    # Convert each image path to full URL
    for image_type, relative_path in images_data.items():
        if relative_path and isinstance(relative_path, str):
            if relative_path.startswith('/'):
                full_urls[image_type] = base_url + relative_path
            else:
                full_urls[image_type] = relative_path
        elif image_type == 'gallery' and isinstance(relative_path, list):
            # Handle gallery array
            full_urls[image_type] = [
                base_url + path if path.startswith('/') else path 
                for path in relative_path if path
            ]
        else:
            full_urls[image_type] = relative_path
    
    return full_urls

def get_images_from_api(item_code):
    """
    Get image URLs from Rami Levy API
    
    Args:
        item_code: The product item code (barcode)
    
    Returns:
        Dictionary with item code and image URLs or None if not found
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
        
        # Initialize result with minimal info
        result = {
            'item_code': str(item_code),
            'images': {}
        }
        
        # Extract image URLs
        images_data = item_data.get('images', {})
        
        if not images_data:
            print(f"  ⚠️  NO IMAGE DATA for item {item_code}: Item found but no images available")
            return result
        
        # Convert relative paths to full URLs
        result['images'] = build_full_image_urls(images_data)
        
        # Count available images
        image_count = sum(1 for v in result['images'].values() if v and v != [])
        if image_count > 0:
            print(f"  ✅ SUCCESS for item {item_code}: Found {image_count} image types")
        else:
            print(f"  ⚠️  PARTIAL SUCCESS for item {item_code}: Product found but no image URLs extracted")
        
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

def get_images_for_rami_levi_items(json_data, checkpoint_path="images_checkpoint.json"):
    """
    Get image URLs for all items that have Rami Levi prices with checkpoint support
    
    Args:
        json_data: List of product dictionaries
        checkpoint_path: Path to save/load checkpoint data
    
    Returns:
        List of dictionaries with item codes and image URLs
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
        if current_progress % 500 == 0:
            print(f"Taking a break after {current_progress} items...")
            time.sleep(300)  # Sleep for 5 minutes (300 seconds)
            print(f"Resuming...")
        if should_exit:
            break
        print(f"Processing {current_progress}/{len(item_codes)}: {item_code}")
        
        image_data = get_images_from_api(item_code)
        
        if image_data:
            processed_results.append(image_data)
            
            # Save checkpoint every 10 items
            if len(processed_results) % 10 == 0:
                save_checkpoint(processed_results, checkpoint_path)
                print(f"  → Checkpoint saved ({len(processed_results)} items processed)")
        
        # Add delay to be respectful to the API
        time.sleep(0.2)  # Reduced to 0.2 seconds (5 requests per second)
    
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

def save_results_to_file(results, filename="rami_levy_images.json"):
    """Save the image results to a JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

def print_sample_output(results, count=3):
    """Print sample results to verify data format"""
    print(f"\n📊 SAMPLE OUTPUT (first {count} items):")
    print("=" * 60)
    
    for i, item in enumerate(results[:count]):
        print(f"\nItem {i+1}:")
        print(f"  Code: {item.get('item_code')}")
        images = item.get('images', {})
        print(f"  Images:")
        for img_type, url in images.items():
            if url:
                if isinstance(url, list):
                    print(f"    {img_type}: {len(url)} images")
                else:
                    print(f"    {img_type}: {str(url)[:80]}...")

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
            checkpoint_path = f"{base_name}_images_checkpoint.json"
            final_output_path = f"{base_name}_rami_images.json"
            
            # Get image data for all Rami Levi items with checkpoint support
            image_results = get_images_for_rami_levi_items(products_data, checkpoint_path)
            
            # If we completed successfully, finalize the results
            if image_results:
                finalize_results(checkpoint_path, final_output_path)
                print_sample_output(image_results)
                print(f"\n🎉 COMPLETED! Processed {len(image_results)} items total.")
                print(f"📁 Results saved to: {final_output_path}")
            
        except KeyboardInterrupt:
            print("\nProcess interrupted by user.")
        except Exception as e:
            print(f"Error: {e}")
    else:
        print("Usage: python ImageUrlExtractor.py products_file.json")
        print("  products_file.json - JSON file with product data containing item codes and Rami Levi prices")
        print("")
        print("Example:")
        print("  python ImageUrlExtractor.py data/products.json")
        print("")
        print("The script will:")
        print("  1. Extract item codes for products that have Rami Levi prices")
        print("  2. Query the Rami Levy API for image URLs for each item")
        print("  3. Save results with checkpoint support for resuming if interrupted")
        print("  4. Output final results to: products_rami_images.json") 