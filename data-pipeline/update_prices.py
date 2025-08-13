#!/usr/bin/env python3
"""
Incremental price updater: Loads ONLY new supermarket prices from Final_Data.

Logic:
- Read data/Final_Data/clean_combined_prices.json
- Detect price fields (keys ending with " price")
- Compare with DB supermarkets by price_field_name to find new markets
- Upsert new supermarkets
- Insert today's prices for those new markets into price_history (non-null only)
- Create minimal product rows if missing
- Refresh products.supermarket_count

This script is imported and invoked by run.py when --update-prices is passed.
It can also be run directly.
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Set

import psycopg2
import psycopg2.extras

logger = logging.getLogger(__name__)


def _find_final_data_dir() -> Path:
    candidates = [
        os.getenv('DATA_DIRECTORY'),
        '/mnt/c/Users/itayd/Year3EX/FinalProject/FinalProject/data/Final_Data',
        '../data/Final_Data',
        './data/Final_Data',
        Path(__file__).parent.parent / 'data' / 'Final_Data',
    ]
    for c in candidates:
        if not c:
            continue
        p = Path(c).resolve()
        if p.exists():
            return p
    raise FileNotFoundError("Could not locate Final_Data directory. Set DATA_DIRECTORY or place data under ../data/Final_Data")


def _read_clean_prices(final_dir: Path) -> List[Dict]:
    path = final_dir / 'clean_combined_prices.json'
    if not path.exists():
        raise FileNotFoundError(f"Missing {path}")
    with path.open('r', encoding='utf-8') as f:
        return json.load(f)


def _discover_price_fields(rows: List[Dict]) -> Set[str]:
    fields: Set[str] = set()
    for row in rows:
        for k in row.keys():
            if isinstance(k, str) and k.endswith(' price'):
                fields.add(k)
    return fields


def _connect(db_config: Dict[str, str]):
    conn = psycopg2.connect(**db_config)
    conn.autocommit = False
    return conn


def _fetch_existing_supermarket_fields(conn) -> Set[str]:
    with conn.cursor() as cur:
        cur.execute("SELECT price_field_name FROM supermarkets")
        return {r[0] for r in cur.fetchall() if r and r[0]}


def _upsert_supermarkets(conn, new_fields: Set[str]) -> None:
    if not new_fields:
        return
    with conn.cursor() as cur:
        for field in sorted(new_fields):
            market = field[:-6].strip()  # drop ' price'
            proper_name = ' '.join(w.capitalize() for w in market.split())
            api_identifier = market.replace(' ', '_').lower()
            cur.execute(
                """
                INSERT INTO supermarkets (name, price_field_name, api_identifier, is_active)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (name) DO UPDATE SET
                  price_field_name = EXCLUDED.price_field_name,
                  api_identifier = EXCLUDED.api_identifier,
                  is_active = true
                """,
                (proper_name, field, api_identifier, True),
            )


def _build_field_to_supermarket_id(conn, fields: Set[str]) -> Dict[str, int]:
    mapping: Dict[str, int] = {}
    if not fields:
        return mapping
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, price_field_name FROM supermarkets WHERE price_field_name = ANY(%s)",
            (list(fields),),
        )
        for row in cur.fetchall():
            mapping[row[1]] = row[0]
    return mapping


def _ensure_product(conn, item_code: str, name: Optional[str]) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM products WHERE item_code = %s", (item_code,))
        row = cur.fetchone()
        if row:
            return row[0]
        cur.execute(
            """
            INSERT INTO products (item_code, name, is_active)
            VALUES (%s, %s, %s)
            ON CONFLICT (item_code) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
            """,
            (item_code, name or f"Product {item_code}", True),
        )
        return cur.fetchone()[0]


def _insert_price(conn, item_code: str, product_id: int, supermarket_id: int, price: float, source: str):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO price_history (item_code, product_id, supermarket_id, price, source_file, record_date)
            VALUES (%s, %s, %s, %s, %s, CURRENT_DATE)
            ON CONFLICT (item_code, supermarket_id, record_date)
            DO UPDATE SET price = EXCLUDED.price, source_file = EXCLUDED.source_file, product_id = EXCLUDED.product_id
            """,
            (item_code, product_id, supermarket_id, price, source),
        )


def _refresh_supermarket_counts(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE products p
            SET supermarket_count = sub.count
            FROM (
              SELECT ph.product_id, COUNT(DISTINCT ph.supermarket_id) AS count
              FROM price_history ph
              GROUP BY ph.product_id
            ) sub
            WHERE p.id = sub.product_id
            """
        )


def update_prices(db_config: Dict[str, str], final_dir: Optional[str] = None):
    final_path = Path(final_dir).resolve() if final_dir else _find_final_data_dir()
    rows = _read_clean_prices(final_path)
    json_fields = _discover_price_fields(rows)

    conn = _connect(db_config)
    try:
        existing_fields = _fetch_existing_supermarket_fields(conn)
        new_fields = {f for f in json_fields if f not in existing_fields}
        if not new_fields:
            logger.info("No new supermarkets to update. Exiting.")
            return

        logger.info(f"New supermarkets: {sorted(new_fields)}")
        _upsert_supermarkets(conn, new_fields)

        field_to_id = _build_field_to_supermarket_id(conn, new_fields)
        updated_prices = 0
        created_products = 0

        # Process rows: insert only non-null prices for new fields
        for row in rows:
            item_code = str(row.get('ItemCode') or row.get('item_code') or '').strip()
            if not item_code:
                continue
            name = row.get('name')

            # Check if any new field has a non-null price
            for field, supermarket_id in field_to_id.items():
                value = row.get(field)
                if value is None:
                    continue
                try:
                    price = float(value)
                    if price <= 0:
                        continue
                except (ValueError, TypeError):
                    continue

                product_id = _ensure_product(conn, item_code, name)
                _insert_price(conn, item_code, product_id, supermarket_id, price, source='clean_combined_prices.json')
                updated_prices += 1

        _refresh_supermarket_counts(conn)
        conn.commit()
        logger.info(f"✅ Updated {updated_prices} price entries. New supermarkets: {len(new_fields)}")

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def main():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

    db_config = {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': int(os.getenv('POSTGRES_PORT', '5432')),
        'database': os.getenv('POSTGRES_DB', 'nutrition_app'),
        'user': os.getenv('POSTGRES_USER', 'nutrition_user'),
        'password': os.getenv('POSTGRES_PASSWORD', 'nutrition_password')
    }

    data_dir = os.getenv('DATA_DIRECTORY')
    update_prices(db_config, data_dir)


if __name__ == '__main__':
    main()


