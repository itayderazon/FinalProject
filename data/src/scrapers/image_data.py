import requests
import json
import time
import os
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

def build_optimized_image_url(relative_path, size_type='small'):
    """Build the correct Rami Levy image URL with IPX optimization"""
    if not relative_path:
        return None
    
    # Base URLs for different image sizes
    base_img_url = "https://img.rami-levy.co.il"
    
    # IPX optimization parameters for different sizes
    ipx_params = {
        'small': 'w_245,f_webp',
        'large': 'w_400,f_webp', 
        'trim': 'w_300,f_webp'
    }
    
    # Build the full URL: https://www.rami-levy.co.il/_ipx/w_245,f_webp/https://img.rami-levy.co.il/product/xxx/small.jpg
    full_img_url = base_img_url + relative_path
    ipx_param = ipx_params.get(size_type, 'w_245,f_webp')
    
    optimized_url = f"https://www.rami-levy.co.il/_ipx/{ipx_param}/{full_img_url}"
    
    return optimized_url

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
    """Download all images for a single product using correct URLs"""
    item_code = item.get('item_code')
    images = item.get('images', {})
    
    if not item_code or not images:
        return item
    
    # Create images folder if it doesn't exist
    if not os.path.exists(images_folder):
        os.makedirs(images_folder)
    
    # Download each image type
    local_files = {}
    
    # Map of our JSON keys to URL construction
    image_mapping = {
        'small': ('small', 'small'),
        'large': ('original', 'large'), 
        'trim': ('trim', 'trim')
    }
    
    for our_key, (api_key, size_type) in image_mapping.items():
        # Get the original relative path from our stored URL
        stored_url = images.get(our_key)
        if stored_url:
            # Extract relative path from stored URL
            # stored_url might be: "https://www.rami-levy.co.il/product/7290005992575/small.jpg"
            if '/product/' in stored_url:
                relative_path = '/product/' + stored_url.split('/product/')[1]
                
                # Build optimized URL
                optimized_url = build_optimized_image_url(relative_path, size_type)
                
                if optimized_url:
                    # Create filename
                    filename = f"{item_code}_{our_key}.webp"  # webp format from IPX
                    filepath = os.path.join(images_folder, filename)
                    
                    # Download image
                    result = download_single_image(optimized_url, filepath)
                    if result:
                        local_files[our_key] = filepath
                        print(f"    ✓ Downloaded {our_key}: {filename}")
                    else:
                        local_files[our_key] = None
                        print(f"    ✗ Failed {our_key}: {filename}")
                else:
                    local_files[our_key] = None
            else:
                local_files[our_key] = None
    
    # Add local files to item
    if 'images' not in item:
        item['images'] = {}
    item['images']['local_files'] = local_files
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
                local_files = updated_item.get('images', {}).get('local_files', {})
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
        print("Usage: python image_downloader.py nutrition_file.json [--sequential]")
        print("  nutrition_file.json - JSON file with nutrition data containing image URLs")
        print("  --sequential - Download images one by one (slower but more reliable)")
        print("")
        print("Example:")
        print("  python image_downloader.py products_enhanced_nutrition.json")
        print("  python image_downloader.py products_enhanced_nutrition.json --sequential")