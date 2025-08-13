#!/usr/bin/env python3
"""
Auto-detect and update ONLY new supermarkets.

- Scans `data/src/data/*/` for supermarket folders.
- Determines which markets are NEW by checking if `<foldername> price` exists
  in `data/Final_Data/clean_combined_prices.json`.
- For each NEW market, parses its XMLs and adds `<foldername> price` for ALL
  existing products: sets the price when found, or null when not. It never
  overwrites existing values.
- No arguments. Just run the script.
"""

import json
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, Optional, Tuple, Set


def _safe_float(value_text: Optional[str]) -> Optional[float]:
    if value_text is None:
        return None
    try:
        return float(str(value_text).strip())
    except Exception:
        return None


def parse_xml_item_to_record(item: ET.Element) -> Optional[Dict[str, object]]:
    """Extract ItemCode and price from a generic supermarket XML <Item> node."""
    # ItemCode
    code_value: Optional[str] = None
    for code_tag in ["ItemCode", "Code", "ProductCode", "Barcode"]:
        direct = item.findtext(code_tag)
        if direct:
            code_value = direct.strip()
            break
        deep = item.find(f".//{code_tag}")
        if deep is not None and deep.text:
            code_value = deep.text.strip()
            break
    if not code_value:
        return None

    # Price
    price_value: Optional[float] = None
    for price_tag in ["ItemPrice", "Price", "PriceValue", "RetailPrice"]:
        direct_price = item.findtext(price_tag)
        if direct_price is not None:
            price_value = _safe_float(direct_price)
            if price_value is not None:
                break
        deep_price_elem = item.find(f".//{price_tag}")
        if deep_price_elem is not None and deep_price_elem.text:
            price_value = _safe_float(deep_price_elem.text)
            if price_value is not None:
                break
    if price_value is None:
        return None

    return {"ItemCode": code_value, "price": price_value}


def extract_prices_from_xml_dir(xml_dir: Path) -> Dict[str, float]:
    """Collect ItemCode -> price from all *.xml in a folder."""
    prices_by_code: Dict[str, float] = {}
    if not xml_dir.exists() or not xml_dir.is_dir():
        return prices_by_code

    for file_path in xml_dir.glob("*.xml"):
        try:
            tree = ET.parse(file_path)
            root = tree.getroot()

            items = root.findall('.//Item')
            if not items:
                for path in ['.//Products/Product', './/Products/Item', './Item', './/Items/Item']:
                    items = root.findall(path)
                    if items:
                        break

            for item in items:
                record = parse_xml_item_to_record(item)
                if record and record.get("ItemCode") and record.get("price") is not None:
                    code = str(record["ItemCode"]).strip()
                    price = float(record["price"])  # safe by construction
                    prices_by_code[code] = price
        except Exception:
            # Skip problematic file, continue best-effort
            continue

    return prices_by_code


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_existing_market_names(prices_rows: list) -> Set[str]:
    names: Set[str] = set()
    for row in prices_rows:
        for key in row.keys():
            if key.endswith(" price"):
                names.add(key[:-6])
    return names


def main():
    process_dir = Path(__file__).parent
    xml_root = (process_dir.parent / "data").resolve()          # data/src/data
    final_dir = (process_dir.parent.parent / "Final_Data").resolve()
    clean_prices_path = final_dir / "clean_combined_prices.json"

    if not clean_prices_path.exists():
        raise FileNotFoundError(f"Missing {clean_prices_path}. Run the full build first.")
    if not xml_root.exists() or not xml_root.is_dir():
        raise FileNotFoundError(f"XML root not found: {xml_root}")

    # Load current prices and detect existing markets
    prices_rows = load_json(clean_prices_path)
    existing_markets = get_existing_market_names(prices_rows)

    # Detect new markets from folder names
    market_dirs = [d for d in xml_root.iterdir() if d.is_dir()]
    new_market_dirs = [d for d in market_dirs if d.name not in existing_markets]

    if not new_market_dirs:
        print("No new supermarkets detected. Nothing to update.")
        return

    print("Detected new supermarkets:")
    for d in new_market_dirs:
        print(f"  - {d.name}")

    # Build ItemCode -> row index map once
    code_to_row_index: Dict[str, int] = {}
    for idx, row in enumerate(prices_rows):
        code = str(row.get("ItemCode") or row.get("item_code") or "").strip()
        if code:
            code_to_row_index[code] = idx

    # Update for each new market
    for market_dir in new_market_dirs:
        field_name = f"{market_dir.name} price"
        xml_prices = extract_prices_from_xml_dir(market_dir)
        updated_count = 0
        null_count = 0

        # Ensure column exists across all products; fill with null by default
        for row in prices_rows:
            if field_name not in row or row[field_name] is None:
                row[field_name] = None

        # Now fill prices where available
        for code, row_index in code_to_row_index.items():
            row = prices_rows[row_index]
            if row[field_name] is None:
                if code in xml_prices:
                    row[field_name] = xml_prices[code]
                    updated_count += 1
                else:
                    # explicitly keep as null
                    null_count += 1

        print(f"{market_dir.name}: set prices for {updated_count} items, left null for {null_count}")

    save_json(clean_prices_path, prices_rows)
    print("\n🎉 Update complete. Saved clean_combined_prices.json")


if __name__ == "__main__":
    main()


