#!/usr/bin/env python3
"""
==========================================
FILE LOCATION: data-pipeline/loader.py
ACTION: CREATE NEW FILE in NEW FOLDER

Dynamic Data Loader - Discovers everything from JSON files
Auto-detects and creates:
- Supermarkets from price field names ("shufersal price" -> "Shufersal")
- Categories from nutrition data "category" field
- Subcategories from nutrition data "subcategory" field  
- Allergens from nutrition data "allergens" arrays
- Products and prices
==========================================
"""

import json
import os
import re
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Set
from pathlib import Path
import psycopg2
import psycopg2.extras

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DynamicDataLoader:
    """
    Completely dynamic loader that discovers all structure from JSON files
    """
    
    def __init__(self, db_config: Dict[str, str]):
        self.db_config = db_config
        self.conn = None
        
        # Will be discovered from data
        self.discovered_supermarkets = {}
        self.discovered_categories = {}
        self.discovered_subcategories = {}
        self.discovered_allergens = set()
        
    def connect(self):
        """Connect to PostgreSQL"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            self.conn.autocommit = False
            logger.info("✅ Connected to PostgreSQL")
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            raise
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
    
    def load_all_data(self, data_directory: str):
        """
        Main entry point - discovers and loads all data
        """
        logger.info(f"🚀 Starting dynamic data loading from {data_directory}")
        
        data_path = Path(data_directory)
        if not data_path.exists():
            raise FileNotFoundError(f"Data directory not found: {data_directory}")
        
        self.connect()
        
        try:
            # Step 1: Discover structure from all JSON files
            self._discover_data_structure(data_path)
            
            # Step 2: Create discovered entities in database
            self._create_discovered_entities()
            
            # Step 3: Load actual data (nutrition FIRST, then prices)
            self._load_nutrition_data(data_path)
            self._load_price_data(data_path)
            
            # Step 4: Final summary
            self._print_summary()
            
        except Exception as e:
            logger.error(f"❌ Data loading failed: {e}")
            if self.conn:
                self.conn.rollback()
            raise
        finally:
            self.close()
    
    def _discover_data_structure(self, data_path: Path):
        """
        Phase 1: Scan all JSON files to discover the data structure
        """
        logger.info("🔍 Phase 1: Discovering data structure...")
        
        # Find all JSON files
        json_files = list(data_path.rglob("*.json"))
        logger.info(f"Found {len(json_files)} JSON files")
        
        for json_file in json_files:
            logger.info(f"Analyzing: {json_file}")
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self._analyze_json_structure(data, json_file.name)
            except Exception as e:
                logger.warning(f"Could not analyze {json_file}: {e}")
    
    def _analyze_json_structure(self, data: Any, filename: str):
        """
        Analyze a JSON structure to discover entities
        """
        if isinstance(data, list):
            # Array of items - likely product data
            for item in data[:5]:  # Sample first 5 items
                self._discover_from_item(item, filename)
        
        elif isinstance(data, dict):
            # Check if it's the categories structure from your paste
            if 'categories' in data and 'subcategories' in data:
                self._discover_from_categories_json(data)
            
            # Check for price field patterns
            elif any(key.endswith(' price') for key in data.keys()):
                self._discover_supermarkets_from_price_fields(data)
            
            # Single item
            else:
                self._discover_from_item(data, filename)
    
    def _discover_from_categories_json(self, data: Dict):
        """
        Discover categories from the categories_extracted.json format
        """
        logger.info("📂 Discovered categories JSON structure")
        
        # Discover categories
        if 'categories' in data:
            for category in data['categories']:
                if 'name' in category:
                    self.discovered_categories[category['name']] = {
                        'name_he': category['name'],
                        'count': category.get('count', 0)
                    }
        
        # Discover category -> subcategory mapping
        if 'category_mapping' in data:
            for category_name, subcategories in data['category_mapping'].items():
                for subcat in subcategories:
                    if 'name' in subcat:
                        self.discovered_subcategories[subcat['name']] = {
                            'name_he': subcat['name'],
                            'category': category_name,
                            'count': subcat.get('count', 0)
                        }
    
    def _discover_from_item(self, item: Dict, filename: str):
        """
        Discover structure from a single data item
        """
        if not isinstance(item, dict):
            return
        
        # Discover categories and subcategories from nutrition data
        if 'category' in item:
            category = item['category']
            if category and category not in self.discovered_categories:
                self.discovered_categories[category] = {
                    'name_he': category,
                    'count': 0
                }
        
        if 'subcategory' in item and 'category' in item:
            subcategory = item['subcategory']
            category = item['category']
            if subcategory and subcategory not in self.discovered_subcategories:
                self.discovered_subcategories[subcategory] = {
                    'name_he': subcategory,
                    'category': category,
                    'count': 0
                }
        
        # Discover allergens
        if 'allergens' in item and isinstance(item['allergens'], list):
            for allergen in item['allergens']:
                if allergen:
                    self.discovered_allergens.add(allergen)
        
        # Discover supermarkets from price fields
        self._discover_supermarkets_from_price_fields(item)
    
    def _discover_supermarkets_from_price_fields(self, item: Dict):
        """
        Auto-discover supermarkets from price field names
        Examples: "shufersal price" -> "Shufersal"
        """
        for key in item.keys():
            if key.endswith(' price'):
                # Extract supermarket name from field name
                market_name = key.replace(' price', '').strip()
                
                # Convert to proper name (capitalize)
                if market_name == 'shufersal':
                    proper_name = 'Shufersal'
                elif market_name == 'rami levi':
                    proper_name = 'Rami Levy'
                elif market_name == 'tivtaam':
                    proper_name = 'Tiv Taam'
                elif market_name == 'yeinotbitan':
                    proper_name = 'Yeinot Bitan'
                else:
                    # Capitalize each word
                    proper_name = ' '.join(word.capitalize() for word in market_name.split())
                
                if proper_name not in self.discovered_supermarkets:
                    self.discovered_supermarkets[proper_name] = {
                        'name': proper_name,
                        'price_field_name': key,
                        'api_identifier': market_name.replace(' ', '_').lower()
                    }
    
    def _create_discovered_entities(self):
        """
        Phase 2: Create all discovered entities in the database
        """
        logger.info("🏗️ Phase 2: Creating discovered entities...")
        
        cursor = self.conn.cursor()
        
        try:
            # Create supermarkets
            logger.info(f"Creating {len(self.discovered_supermarkets)} supermarkets...")
            for supermarket in self.discovered_supermarkets.values():
                cursor.execute("""
                    INSERT INTO supermarkets (name, price_field_name, api_identifier)
                    VALUES (%(name)s, %(price_field_name)s, %(api_identifier)s)
                    ON CONFLICT (name) DO UPDATE SET
                        price_field_name = EXCLUDED.price_field_name,
                        api_identifier = EXCLUDED.api_identifier
                """, supermarket)
            
            # Create categories
            logger.info(f"Creating {len(self.discovered_categories)} categories...")
            for category in self.discovered_categories.values():
                name_en = category['name_he'].replace(' ', '_').lower()
                cursor.execute("""
                    INSERT INTO categories (name_he, name_en)
                    VALUES (%(name_he)s, %(name_en)s)
                    ON CONFLICT (name_he) DO NOTHING
                """, {'name_he': category['name_he'], 'name_en': name_en})
            
            # Create subcategories
            logger.info(f"Creating {len(self.discovered_subcategories)} subcategories...")
            for subcat in self.discovered_subcategories.values():
                cursor.execute("""
                    INSERT INTO subcategories (category_id, name_he, name_en)
                    VALUES (
                        (SELECT id FROM categories WHERE name_he = %(category)s),
                        %(name_he)s,
                        %(name_en)s
                    )
                    ON CONFLICT (category_id, name_he) DO NOTHING
                """, {
                    'category': subcat['category'],
                    'name_he': subcat['name_he'],
                    'name_en': subcat['name_he'].replace(' ', '_').lower()
                })
            
            # Create allergens
            logger.info(f"Creating {len(self.discovered_allergens)} allergens...")
            for allergen in self.discovered_allergens:
                cursor.execute("""
                    INSERT INTO allergens (name, name_he)
                    VALUES (%(name)s, %(name_he)s)
                    ON CONFLICT (name) DO NOTHING
                """, {'name': allergen, 'name_he': allergen})
            
            self.conn.commit()
            logger.info("✅ All entities created successfully")
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"❌ Failed to create entities: {e}")
            raise
        finally:
            cursor.close()
    
    def _load_nutrition_data(self, data_path: Path):
        """
        Phase 3: Load nutrition data
        """
        logger.info("📊 Phase 3: Loading nutrition data...")
        
        # Find nutrition data file
        nutrition_files = list(data_path.rglob("*nutrition*.json"))
        
        for nutrition_file in nutrition_files:
            logger.info(f"Loading nutrition data from: {nutrition_file}")
            
            with open(nutrition_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if isinstance(data, list):
                self._process_nutrition_items(data, str(nutrition_file))
    
    def _process_nutrition_items(self, items: List[Dict], source_file: str):
        """
        Process nutrition items and insert into database
        """
        cursor = self.conn.cursor()
        processed = 0
        failed = 0
        
        try:
            for item in items:
                try:
                    # Prepare nutrition data
                    nutrition = {}
                    if 'calories' in item:
                        nutrition['calories'] = float(item['calories'])
                    if 'protein' in item:
                        nutrition['protein'] = float(item['protein'])
                    if 'carbs' in item:
                        nutrition['carbs'] = float(item['carbs'])
                    if 'fat' in item:
                        nutrition['fat'] = float(item['fat'])
                    if 'sodium' in item:
                        nutrition['sodium'] = float(item['sodium'])
                    
                    # Get category and subcategory IDs
                    category_id = None
                    subcategory_id = None
                    
                    if 'category' in item:
                        cursor.execute("SELECT id FROM categories WHERE name_he = %s", (item['category'],))
                        result = cursor.fetchone()
                        if result:
                            category_id = result[0]
                    
                    if 'subcategory' in item and category_id:
                        cursor.execute(
                            "SELECT id FROM subcategories WHERE name_he = %s AND category_id = %s", 
                            (item['subcategory'], category_id)
                        )
                        result = cursor.fetchone()
                        if result:
                            subcategory_id = result[0]
                    
                    # Insert product
                    cursor.execute("""
                        INSERT INTO products (item_code, name, category_id, subcategory_id, nutrition)
                        VALUES (%(item_code)s, %(name)s, %(category_id)s, %(subcategory_id)s, %(nutrition)s)
                        ON CONFLICT (item_code) DO UPDATE SET
                            name = EXCLUDED.name,
                            category_id = EXCLUDED.category_id,
                            subcategory_id = EXCLUDED.subcategory_id,
                            nutrition = EXCLUDED.nutrition,
                            updated_at = NOW()
                    """, {
                        'item_code': item.get('item_code'),
                        'name': item.get('name'),
                        'category_id': category_id,
                        'subcategory_id': subcategory_id,
                        'nutrition': json.dumps(nutrition)
                    })
                    
                    processed += 1
                    
                    if processed % 100 == 0:
                        logger.info(f"Processed {processed} nutrition items...")
                        
                except Exception as e:
                    logger.warning(f"Failed to process item {item.get('item_code', 'unknown')}: {e}")
                    failed += 1
            
            self.conn.commit()
            logger.info(f"✅ Nutrition data loaded: {processed} processed, {failed} failed")
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"❌ Failed to load nutrition data: {e}")
            raise
        finally:
            cursor.close()
    
    def _load_price_data(self, data_path: Path):
        """
        Phase 4: Load price data
        """
        logger.info("💰 Phase 4: Loading price data...")
        
        # Find price data files
        price_files = []
        for pattern in ["*price*.json", "*combined*.json"]:
            price_files.extend(data_path.rglob(pattern))
        
        for price_file in price_files:
            if 'nutrition' not in price_file.name.lower():  # Skip nutrition files
                logger.info(f"Loading price data from: {price_file}")
                
                with open(price_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if isinstance(data, list):
                    self._process_price_items(data, str(price_file))
    
    def _process_price_items(self, items: List[Dict], source_file: str):
        """
        Process price items and insert into database
        """
        cursor = self.conn.cursor()
        processed = 0
        failed = 0
        debug_info = {
            'no_item_code': 0,
            'product_not_found': 0, 
            'no_valid_prices': 0,
            'db_errors': 0
        }
        
        try:
            for i, item in enumerate(items):
                try:
                    item_code = item.get('ItemCode') or item.get('item_code')
                    if not item_code:
                        debug_info['no_item_code'] += 1
                        failed += 1
                        continue
                    
                    # Check if this item_code exists in our products
                    cursor.execute("SELECT id, name FROM products WHERE item_code = %s", (str(item_code),))
                    result = cursor.fetchone()
                    
                    if result:
                        # Product exists in nutrition data - link prices to it
                        product_id = result[0]
                        use_existing_product = True
                    else:
                        # Product doesn't exist - create a price-only product record
                        product_name = item.get('name', f'Product {item_code}')
                        try:
                            cursor.execute("""
                                INSERT INTO products (item_code, name, is_active) 
                                VALUES (%s, %s, %s)
                                ON CONFLICT (item_code) DO UPDATE SET 
                                    name = EXCLUDED.name
                                RETURNING id
                            """, (str(item_code), product_name, True))
                            product_id = cursor.fetchone()[0]
                            use_existing_product = False
                        except Exception as e:
                            debug_info['db_errors'] += 1
                            failed += 1
                            logger.debug(f"Failed to create product for {item_code}: {e}")
                            continue
                    item_processed = False
                    
                    # Process prices for each supermarket
                    for field_name, price_value in item.items():
                        if field_name.endswith(' price') and price_value is not None:
                            try:
                                price = float(price_value)
                                if price > 0:
                                    # Get supermarket ID
                                    cursor.execute(
                                        "SELECT id FROM supermarkets WHERE price_field_name = %s", 
                                        (field_name,)
                                    )
                                    market_result = cursor.fetchone()
                                    if market_result:
                                        supermarket_id = market_result[0]
                                        
                                        # Insert price with ItemCode as primary reference
                                        try:
                                            cursor.execute("""
                                                INSERT INTO price_history (item_code, product_id, supermarket_id, price, source_file, record_date)
                                                VALUES (%s, %s, %s, %s, %s, CURRENT_DATE)
                                                ON CONFLICT (item_code, supermarket_id, record_date) 
                                                DO UPDATE SET 
                                                    price = EXCLUDED.price, 
                                                    source_file = EXCLUDED.source_file,
                                                    product_id = EXCLUDED.product_id
                                            """, (str(item_code), product_id, supermarket_id, price, source_file))
                                            
                                            item_processed = True
                                            
                                        except Exception as db_error:
                                            debug_info['db_errors'] += 1
                                            # Log first few errors to see the pattern
                                            if debug_info['db_errors'] <= 5:
                                                logger.error(f"DB error #{debug_info['db_errors']} for item {item_code}, {field_name}, price {price}: {db_error}")
                                            elif debug_info['db_errors'] == 6:
                                                logger.error("Additional database errors suppressed...")
                                            logger.debug(f"DB error inserting price for {item_code}, {field_name}: {db_error}")
                                            
                                        except Exception as db_error:
                                            debug_info['db_errors'] += 1
                                            # Log first few errors to see the pattern
                                            if debug_info['db_errors'] <= 5:
                                                logger.error(f"DB error #{debug_info['db_errors']} for item {item_code}, {field_name}, price {price}: {db_error}")
                                            elif debug_info['db_errors'] == 6:
                                                logger.error("Additional database errors suppressed...")
                                            logger.debug(f"DB error inserting price for {item_code}, {field_name}: {db_error}")
                            
                            except (ValueError, TypeError) as e:
                                logger.debug(f"Invalid price value {price_value} for {field_name}: {e}")
                                continue
                    
                    if item_processed:
                        processed += 1
                    else:
                        debug_info['no_valid_prices'] += 1
                        failed += 1
                    
                    # Progress logging with debug info every 1000 items
                    if (i + 1) % 1000 == 0:
                        logger.info(f"Processed {i + 1}/{len(items)} items. Success: {processed}, Failed: {failed}")
                        
                except Exception as e:
                    debug_info['db_errors'] += 1
                    logger.debug(f"Failed to process price item {item.get('ItemCode', 'unknown')}: {e}")
                    failed += 1
            
            # Commit all changes
            self.conn.commit()
            
            # Detailed summary
            logger.info(f"✅ Price data loaded: {processed} processed, {failed} failed")
            logger.info(f"📊 Failure breakdown:")
            logger.info(f"  - No ItemCode: {debug_info['no_item_code']}")
            logger.info(f"  - Product not found: {debug_info['product_not_found']}")
            logger.info(f"  - No valid prices: {debug_info['no_valid_prices']}")
            logger.info(f"  - Database errors: {debug_info['db_errors']}")
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"❌ Failed to load price data: {e}")
            raise
        finally:
            cursor.close()
    
    def _print_summary(self):
        """
        Print final summary of loaded data
        """
        logger.info("📋 Final Summary:")
        
        cursor = self.conn.cursor()
        
        try:
            # Get counts
            queries = {
                'Products': "SELECT COUNT(*) FROM products WHERE is_active = true",
                'Categories': "SELECT COUNT(*) FROM categories",
                'Subcategories': "SELECT COUNT(*) FROM subcategories", 
                'Supermarkets': "SELECT COUNT(*) FROM supermarkets WHERE is_active = true",
                'Allergens': "SELECT COUNT(*) FROM allergens",
            }
            
            # Try to get price history count, but handle if table doesn't exist
            try:
                cursor.execute("SELECT COUNT(*) FROM price_history")
                price_count = cursor.fetchone()[0]
                queries['Price Records'] = f"(already counted: {price_count})"
            except Exception:
                logger.warning("price_history table not accessible for summary")
            
            # Try to get menu eligible count
            try:
                cursor.execute("SELECT COUNT(*) FROM products WHERE can_include_in_menu = true")
                menu_count = cursor.fetchone()[0]
                queries['Menu Eligible'] = f"(already counted: {menu_count})"
            except Exception:
                logger.warning("Could not count menu eligible products")
            
            for label, query in queries.items():
                if query.startswith("(already counted:"):
                    logger.info(f"  {label}: {query}")
                else:
                    cursor.execute(query)
                    count = cursor.fetchone()[0]
                    logger.info(f"  {label}: {count}")
            
            # Data quality
            try:
                cursor.execute("SELECT AVG(data_quality_score) FROM products WHERE is_active = true")
                avg_quality = cursor.fetchone()[0]
                if avg_quality:
                    logger.info(f"  Average Data Quality: {avg_quality:.2f}/1.00")
            except Exception:
                logger.warning("Could not calculate data quality score")
            
            logger.info("🎉 Data loading completed successfully!")
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
        finally:
            cursor.close()


def main():
    """
    Main entry point
    """
    # Database configuration
    db_config = {
        'host': os.getenv('POSTGRES_HOST', 'localhost'),
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'database': os.getenv('POSTGRES_DB', 'nutrition_app'),
        'user': os.getenv('POSTGRES_USER', 'nutrition_user'),
        'password': os.getenv('POSTGRES_PASSWORD', 'nutrition_password')
    }
    
    # Data directory
    data_directory = os.getenv('DATA_DIRECTORY', '../data')
    
    # Create and run loader
    loader = DynamicDataLoader(db_config)
    
    try:
        loader.load_all_data(data_directory)
    except Exception as e:
        logger.error(f"Data loading failed: {e}")
        exit(1)


if __name__ == "__main__":
    main()