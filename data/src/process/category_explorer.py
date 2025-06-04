import json
from collections import defaultdict, Counter

def extract_categories_from_data(json_file_path):
    """Extract all categories and subcategories directly from the data"""
    
    with open(json_file_path, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"Extracting categories from {len(products)} products")
    print("=" * 60)
    
    # Collect categories and subcategories
    categories = set()
    subcategories = set()
    category_to_subcategories = defaultdict(set)
    category_counts = Counter()
    subcategory_counts = Counter()
    
    for product in products:
        category = product.get('category', '').strip()
        subcategory = product.get('subcategory', '').strip()
        
        if category:
            categories.add(category)
            category_counts[category] += 1
            
        if subcategory:
            subcategories.add(subcategory)
            subcategory_counts[subcategory] += 1
            
        if category and subcategory:
            category_to_subcategories[category].add(subcategory)
    
    return categories, subcategories, category_to_subcategories, category_counts, subcategory_counts

def print_simple_categories(categories, subcategories, category_to_subcategories, category_counts, subcategory_counts):
    """Print simple category lists"""
    
    print(f"\n📁 CATEGORIES ({len(categories)}):")
    print("-" * 40)
    for category in sorted(categories):
        if category:
            count = category_counts[category]
            print(f"{category} ({count} items)")
    
    print(f"\n🏷️  SUBCATEGORIES ({len(subcategories)}):")
    print("-" * 40)
    for subcategory in sorted(subcategories):
        if subcategory:
            count = subcategory_counts[subcategory]
            print(f"{subcategory} ({count} items)")
    
    print(f"\n🌳 CATEGORY → SUBCATEGORY MAPPING:")
    print("-" * 40)
    for category in sorted(category_to_subcategories.keys()):
        if category:
            print(f"\n{category}:")
            for subcategory in sorted(category_to_subcategories[category]):
                if subcategory:
                    count = subcategory_counts[subcategory]
                    print(f"  • {subcategory} ({count} items)")

def export_simple_categories(categories, subcategories, category_to_subcategories, category_counts, subcategory_counts):
    """Export categories to simple JSON structure"""
    
    # Create lists
    categories_list = [{"name": cat, "count": category_counts[cat]} for cat in sorted(categories) if cat]
    subcategories_list = [{"name": subcat, "count": subcategory_counts[subcat]} for subcat in sorted(subcategories) if subcat]
    
    # Create mapping
    mapping = {}
    for category in sorted(category_to_subcategories.keys()):
        if category:
            mapping[category] = [{"name": subcat, "count": subcategory_counts[subcat]} 
                               for subcat in sorted(category_to_subcategories[category]) if subcat]
    
    export_data = {
        "summary": {
            "total_categories": len(categories),
            "total_subcategories": len(subcategories),
            "total_products": sum(category_counts.values())
        },
        "categories": categories_list,
        "subcategories": subcategories_list,
        "category_mapping": mapping
    }
    
    # Save to file
    with open("categories_extracted.json", 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Exported to: categories_extracted.json")

def main(json_file_path):
    """Extract categories from data file"""
    
    print("📁 CATEGORY EXTRACTOR")
    print("=" * 60)
    
    try:
        # Extract categories
        categories, subcategories, category_to_subcategories, category_counts, subcategory_counts = extract_categories_from_data(json_file_path)
        
        if not categories:
            print("❌ No category data found in file")
            return
        
        # Print results
        print_simple_categories(categories, subcategories, category_to_subcategories, category_counts, subcategory_counts)
        
        # Export to JSON
        export_simple_categories(categories, subcategories, category_to_subcategories, category_counts, subcategory_counts)
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        json_file = sys.argv[1]
        main(json_file)
    else:
        print("Usage: python category_explorer.py nutrition_file.json")
        print("")
        print("Extracts all categories and subcategories directly from your data.")