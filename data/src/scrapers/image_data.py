import requests
import json
import time
import os
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

def build_correct_image_url(original_url, size_type='small'):
    """Build the correct Rami Levy image URL by converting www to img domain"""
    if not original_url:
        return None
    
    # Convert www.rami-levy.co.il to img.rami-levy.co.il for proper image serving
    if 'www.rami-levy.co.il/product/' in original_url:
        # Replace www with img and change the size if needed
        img_url = original_url.replace('www.rami-levy.co.il', 'img.rami-levy.co.il')
        
        # Change the size in the URL (e.g., large.jpg -> small.jpg)
        if size_type != 'large':
            img_url = img_url.replace('/large.jpg', f'/{size_type}.jpg')
            
        return img_url
    
    return original_url

def download_single_image(url, filepath):
    """Download a single image from URL to filepath"""
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        
        with open(filepath, 'wb') as f:
            f.write(response.content)
        
        return filepath
        
    except Exception as e:
        return None

def download_product_images(item, images_folder="images"):
    """Download image for a single product using the new JSON structure"""
    item_code = item.get('item_code')
    image_url = item.get('image_url')
    
    if not item_code or not image_url:
        return item
    
    # Create images folder if it doesn't exist
    if not os.path.exists(images_folder):
        os.makedirs(images_folder)
    
    # Download different sizes of the image
    local_files = {}
    
    # Download multiple optimized versions
    sizes_to_download = {
        'large': 'large'
    }
    
    for size_key, size_type in sizes_to_download.items():
        # Build correct URL
        correct_url = build_correct_image_url(image_url, size_type)
        
        if correct_url:
            # Create filename
            filename = f"{item_code}_{size_key}.jpg"  # jpg format from direct URLs
            filepath = os.path.join(images_folder, filename)
            
            # Download image
            result = download_single_image(optimized_url, filepath)
            if result:
                local_files[size_key] = filepath
                print(f"    ✓ Downloaded {size_key}: {filename}")
            else:
                local_files[size_key] = None
                print(f"    ✗ Failed {size_key}: {filename}")
        else:
            local_files[size_key] = None
    
    # Add local files to item
    item['local_image_files'] = local_files
    return item

def download_images_parallel(nutrition_data, images_folder="images", max_workers=5):
    """Download images for all products in parallel"""
    print(f"Starting image download for {len(nutrition_data)} products...")
    
    downloaded_count = 0
    failed_count = 0
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all download tasks
        future_to_item = {
            executor.submit(download_product_images, item, images_folder): item 
            for item in nutrition_data
        }
        
        # Process completed downloads
        for future in as_completed(future_to_item):
            item = future_to_item[future]
            try:
                updated_item = future.result()
                
                # Count successful downloads
                local_files = updated_item.get('local_image_files', {})
                if any(local_files.values()):
                    downloaded_count += 1
                    print(f"✓ {updated_item.get('name', 'Unknown')[:40]}")
                else:
                    failed_count += 1
                    print(f"✗ {updated_item.get('name', 'Unknown')[:40]}")
                    
            except Exception as e:
                failed_count += 1
                print(f"✗ Error processing {item.get('name', 'Unknown')[:40]}: {e}")
    
    print(f"\nImage download complete:")
    print(f"  ✓ Success: {downloaded_count} products")
    print(f"  ✗ Failed: {failed_count} products")
    
    return nutrition_data

def download_images_sequential(nutrition_data, images_folder="images"):
    """Download images for all products sequentially (slower but more reliable)"""
    print(f"Starting sequential image download for {len(nutrition_data)} products...")
    
    for i, item in enumerate(nutrition_data, 1):
        print(f"Processing {i}/{len(nutrition_data)}: {item.get('item_code')}")
        
        updated_item = download_product_images(item, images_folder)
        
        # Small delay to be nice to server
        time.sleep(0.2)
    
    print("Sequential image download complete!")
    return nutrition_data

def process_nutrition_file_with_images(json_file_path, parallel=True, max_workers=5):
    """Main function to process nutrition file and download images"""
    
    # Load nutrition data
    with open(json_file_path, 'r', encoding='utf-8') as f:
        nutrition_data = json.load(f)
    
    print(f"Loaded {len(nutrition_data)} products from {json_file_path}")
    
    # Filter items that have image URLs
    items_with_images = [item for item in nutrition_data if item.get('image_url')]
    items_without_images = len(nutrition_data) - len(items_with_images)
    
    print(f"Found {len(items_with_images)} items with images, {items_without_images} without images")
    
    # Download images
    if parallel:
        updated_data = download_images_parallel(nutrition_data, max_workers=max_workers)
    else:
        updated_data = download_images_sequential(nutrition_data)
    
    # Save updated data with local file paths
    output_file = json_file_path.replace('.json', '_with_images.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(updated_data, f, ensure_ascii=False, indent=2)
    
    print(f"Saved updated data to {output_file}")
    return output_file

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        json_file = sys.argv[1]
        
        # Check for parallel flag
        parallel = True
        if len(sys.argv) > 2 and sys.argv[2] == '--sequential':
            parallel = False
        
        try:
            process_nutrition_file_with_images(json_file, parallel=parallel)
        except Exception as e:
            print(f"Error: {e}")
    else:
        print("Usage: python image_data.py nutrition_file.json [--sequential]")
        print("  nutrition_file.json - JSON file with nutrition data containing image_url field")
        print("  --sequential - Download images one by one (slower but more reliable)")
        print("")
        print("Example:")
        print("  python image_data.py combined_prices_rami_nutrition.json")
        print("  python image_data.py combined_prices_rami_nutrition.json --sequential")