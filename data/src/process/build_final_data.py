#!/usr/bin/env python3
"""
Build Final Data from XMLs

This script orchestrates the full pipeline to generate the four JSONs in
`data/Final_Data` starting from retailer XML files:

1) Parse XMLs and merge prices → combined prices
2) Clean NaN values → clean_combined_prices.json
3) Fetch nutrition (and image URLs) by ItemCode → nutrition_data.json
4) Extract categories → categories_extracted.json
5) Extract distinct allergens → distinct_allergens.json

Assumptions:
- Retailer XMLs are located under `data/src/data/<retailer>/*.xml`
- Existing helper modules are used without modifying their code
"""

import json
import os
import re
import runpy
import sys
from pathlib import Path


def run_groupup_and_get_combined(process_dir: Path) -> Path:
    """Execute groupup.py to produce combined price JSON in process_dir.

    Returns path to the generated combined_prices.json.
    """
    groupup_path = process_dir / "groupup.py"
    if not groupup_path.exists():
        raise FileNotFoundError(f"groupup.py not found at {groupup_path}")

    prev_cwd = Path.cwd()
    try:
        os.chdir(process_dir)
        # Execute as script to trigger its top-level generation
        runpy.run_path(str(groupup_path), run_name="__main__")
        combined_path = process_dir / "combined_prices.json"
        if not combined_path.exists():
            # Fallback to unfiltered if needed
            alt = process_dir / "combined_prices_all.json"
            if alt.exists():
                return alt
            raise FileNotFoundError("combined_prices.json was not produced by groupup.py")
        return combined_path
    finally:
        os.chdir(prev_cwd)


def clean_prices_to_final(combined_path: Path, final_dir: Path) -> Path:
    """Replace NaN with null and write clean_combined_prices.json to final_dir."""
    final_dir.mkdir(parents=True, exist_ok=True)

    raw = combined_path.read_text(encoding="utf-8")
    # Replace bare NaN tokens with null to be strict-JSON compliant
    cleaned = re.sub(r":\s*NaN\s*([,}])", r": null\1", raw)
    data = json.loads(cleaned)

    out_path = final_dir / "clean_combined_prices.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return out_path


def build_nutrition(final_prices_path: Path, final_dir: Path) -> Path:
    """Generate nutrition_data.json using NutData over clean prices."""
    # Make scrapers importable
    process_dir = Path(__file__).parent
    scrapers_dir = process_dir.parent / "scrapers"
    sys.path.insert(0, str(scrapers_dir))

    try:
        import NutData  # type: ignore
    except Exception as e:
        raise RuntimeError(f"Failed to import NutData from {scrapers_dir}: {e}")

    with final_prices_path.open("r", encoding="utf-8") as f:
        price_items = json.load(f)

    # Use a checkpoint within Final_Data for resumability
    checkpoint_path = str(final_dir / "nutrition_checkpoint.json")
    nutrition_items = NutData.get_nutrition_for_rami_levi_items(price_items, checkpoint_path)

    out_path = final_dir / "nutrition_data.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(nutrition_items, f, ensure_ascii=False, indent=2)
    return out_path


def build_categories(nutrition_path: Path, final_dir: Path) -> Path:
    """Generate categories_extracted.json from nutrition data."""
    # Import helpers from category_explorer
    process_dir = Path(__file__).parent
    sys.path.insert(0, str(process_dir))
    try:
        import category_explorer  # type: ignore
    except Exception as e:
        raise RuntimeError(f"Failed to import category_explorer: {e}")

    categories, subcategories, category_to_subcategories, category_counts, subcategory_counts = (
        category_explorer.extract_categories_from_data(str(nutrition_path))
    )

    export_data = {
        "summary": {
            "total_categories": len(categories),
            "total_subcategories": len(subcategories),
            "total_products": sum(category_counts.values()),
        },
        "categories": [{"name": cat, "count": category_counts[cat]} for cat in sorted(categories) if cat],
        "subcategories": [
            {"name": subcat, "count": subcategory_counts[subcat]} for subcat in sorted(subcategories) if subcat
        ],
        "category_mapping": {
            category: [
                {"name": subcat, "count": subcategory_counts[subcat]}
                for subcat in sorted(category_to_subcategories[category])
                if subcat
            ]
            for category in sorted(category_to_subcategories.keys())
            if category
        },
    }

    out_path = final_dir / "categories_extracted.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)
    return out_path


def build_distinct_allergens(final_dir: Path) -> Path:
    """Scan Final_Data JSONs and write distinct_allergens.json."""
    # Import extractor
    process_dir = Path(__file__).parent
    sys.path.insert(0, str(process_dir))
    try:
        import simple_allergen_extractor  # type: ignore
    except Exception as e:
        raise RuntimeError(f"Failed to import simple_allergen_extractor: {e}")

    allergens = simple_allergen_extractor.extract_allergens_from_json_files(str(final_dir))
    payload = {"total_count": len(allergens), "allergens": allergens}

    out_path = final_dir / "distinct_allergens.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return out_path


def main():
    process_dir = Path(__file__).parent
    final_dir = process_dir.parent.parent / "Final_Data"

    print(f"➡️  Process dir: {process_dir}")
    print(f"➡️  Final dir:   {final_dir}")

    # 1) XMLs → Combined prices
    combined_path = run_groupup_and_get_combined(process_dir)
    print(f"✅ Combined prices created: {combined_path}")

    # 2) Clean NaN → clean_combined_prices.json (Final_Data)
    clean_prices_path = clean_prices_to_final(combined_path, final_dir)
    print(f"✅ Clean prices written:   {clean_prices_path}")

    # 3) Nutrition (take time due to API calls)
    nutrition_path = build_nutrition(clean_prices_path, final_dir)
    print(f"✅ Nutrition written:      {nutrition_path}")

    # 4) Categories
    categories_path = build_categories(nutrition_path, final_dir)
    print(f"✅ Categories written:     {categories_path}")

    # 5) Distinct allergens
    allergens_path = build_distinct_allergens(final_dir)
    print(f"✅ Allergens written:      {allergens_path}")

    print("\n🎉 Final data build complete.")


if __name__ == "__main__":
    main()


