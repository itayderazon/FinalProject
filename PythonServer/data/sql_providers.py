# src/data/sql_providers.py - PostgreSQL-based data providers

import psycopg2
import psycopg2.extras
from psycopg2 import pool
import json
import os
from typing import List, Dict, Optional, Any
from src.models.food import Food
from src.models.nutrition import NutritionInfo

class DatabaseConnection:
    """Manage PostgreSQL connection pool"""
    
    def __init__(self):
        self.connection_pool = None
        self.connect()
    
    def connect(self):
        """Create connection pool"""
        try:
            self.connection_pool = psycopg2.pool.SimpleConnectionPool(
                1, 20,  # min and max connections
                host=os.getenv('POSTGRES_HOST', 'localhost'),
                database=os.getenv('POSTGRES_DB', 'nutrition_app'),
                user=os.getenv('POSTGRES_USER', 'nutrition_user'),
                password=os.getenv('POSTGRES_PASSWORD', 'nutrition_password'),
                port=os.getenv('POSTGRES_PORT', '5432')
            )
            print("✅ PostgreSQL connection pool created")
        except Exception as e:
            print(f"❌ Failed to create connection pool: {e}")
            raise
    
    def get_connection(self):
        """Get connection from pool"""
        return self.connection_pool.getconn()
    
    def return_connection(self, conn):
        """Return connection to pool"""
        self.connection_pool.putconn(conn)
    
    def execute_query(self, query, params=None):
        """Execute query and return results"""
        conn = None
        try:
            conn = self.get_connection()
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
        except Exception as e:
            print(f"Query error: {e}")
            return []
        finally:
            if conn:
                self.return_connection(conn)
    
    def execute_single(self, query, params=None):
        """Execute query and return single result"""
        results = self.execute_query(query, params)
        return results[0] if results else None

# Global database connection instance
db = DatabaseConnection()

class SqlFoodProvider:
    """PostgreSQL-based food provider"""
    
    def __init__(self):
        self.db = db
        self._foods_cache = None
        print("🗃️ SQL Food Provider initialized")
    
    def get_all_foods(self):
        """Get all foods from database with caching"""
        if self._foods_cache is None:
            print("📊 Loading foods from PostgreSQL...")
            
            query = """
            SELECT 
                p.item_code,
                p.name,
                c.name_he as category,
                sc.name_he as subcategory,
                p.nutrition,
                COALESCE((p.nutrition->>'sodium')::numeric, 0) as sodium
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
            WHERE p.can_include_in_menu = true
            AND p.is_active = true
            AND (p.nutrition->>'calories')::numeric > 0
            ORDER BY p.name
            """
            
            rows = self.db.execute_query(query)
            foods = []
            
            for row in rows:
                try:
                    nutrition_data = row['nutrition']
                    nutrition = NutritionInfo(
                        float(nutrition_data.get('calories', 0)),
                        float(nutrition_data.get('protein', 0)),
                        float(nutrition_data.get('total_carbs', 0)),
                        float(nutrition_data.get('total_fat', 0))
                    )
                    
                    food = Food(
                        item_code=row['item_code'],
                        name=row['name'],
                        category=row['category'] or '',
                        subcategory=row['subcategory'] or '',
                        nutrition_per_100g=nutrition,
                        sodium=float(row['sodium'])
                    )
                    foods.append(food)
                    
                except Exception as e:
                    print(f"Error processing food {row.get('item_code', 'unknown')}: {e}")
                    continue
            
            self._foods_cache = foods
            print(f"✅ Loaded {len(foods)} foods from PostgreSQL")
        
        return self._foods_cache
    
    def get_food_by_code(self, item_code):
        """Get specific food by item code"""
        query = """
        SELECT 
            p.item_code,
            p.name,
            c.name_he as category,
            sc.name_he as subcategory,
            p.nutrition,
            COALESCE((p.nutrition->>'sodium')::numeric, 0) as sodium
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        WHERE p.item_code = %s
        AND p.is_active = true
        """
        
        row = self.db.execute_single(query, (str(item_code),))
        if not row:
            return None
        
        try:
            nutrition_data = row['nutrition']
            nutrition = NutritionInfo(
                float(nutrition_data.get('calories', 0)),
                float(nutrition_data.get('protein', 0)),
                float(nutrition_data.get('total_carbs', 0)),
                float(nutrition_data.get('total_fat', 0))
            )
            
            return Food(
                item_code=row['item_code'],
                name=row['name'],
                category=row['category'] or '',
                subcategory=row['subcategory'] or '',
                nutrition_per_100g=nutrition,
                sodium=float(row['sodium'])
            )
        except Exception as e:
            print(f"Error processing food {item_code}: {e}")
            return None
    
    def search_foods(self, query_text):
        """Search foods by name"""
        query = """
        SELECT 
            p.item_code,
            p.name,
            c.name_he as category,
            sc.name_he as subcategory,
            p.nutrition,
            COALESCE((p.nutrition->>'sodium')::numeric, 0) as sodium
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        WHERE p.can_include_in_menu = true
        AND p.is_active = true
        AND (p.name ILIKE %s OR c.name_he ILIKE %s OR sc.name_he ILIKE %s)
        ORDER BY p.name
        LIMIT 100
        """
        
        search_term = f"%{query_text}%"
        rows = self.db.execute_query(query, (search_term, search_term, search_term))
        
        foods = []
        for row in rows:
            try:
                nutrition_data = row['nutrition']
                nutrition = NutritionInfo(
                    float(nutrition_data.get('calories', 0)),
                    float(nutrition_data.get('protein', 0)),
                    float(nutrition_data.get('total_carbs', 0)),
                    float(nutrition_data.get('total_fat', 0))
                )
                
                food = Food(
                    item_code=row['item_code'],
                    name=row['name'],
                    category=row['category'] or '',
                    subcategory=row['subcategory'] or '',
                    nutrition_per_100g=nutrition,
                    sodium=float(row['sodium'])
                )
                foods.append(food)
            except Exception as e:
                print(f"Error processing search result: {e}")
                continue
        
        return foods
    
    def get_foods_by_category(self, category):
        """Get foods by category"""
        query = """
        SELECT 
            p.item_code,
            p.name,
            c.name_he as category,
            sc.name_he as subcategory,
            p.nutrition,
            COALESCE((p.nutrition->>'sodium')::numeric, 0) as sodium
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        WHERE c.name_he = %s
        AND p.can_include_in_menu = true
        AND p.is_active = true
        ORDER BY p.name
        """
        
        rows = self.db.execute_query(query, (category,))
        foods = []
        
        for row in rows:
            try:
                nutrition_data = row['nutrition']
                nutrition = NutritionInfo(
                    float(nutrition_data.get('calories', 0)),
                    float(nutrition_data.get('protein', 0)),
                    float(nutrition_data.get('total_carbs', 0)),
                    float(nutrition_data.get('total_fat', 0))
                )
                
                food = Food(
                    item_code=row['item_code'],
                    name=row['name'],
                    category=row['category'] or '',
                    subcategory=row['subcategory'] or '',
                    nutrition_per_100g=nutrition,
                    sodium=float(row['sodium'])
                )
                foods.append(food)
            except Exception as e:
                continue
        
        return foods
    
    def reload_foods(self):
        """Clear cache and reload foods"""
        self._foods_cache = None
        return self.get_all_foods()
    
    def get_provider_stats(self):
        """Get statistics about the food provider"""
        stats_query = """
        SELECT 
            COUNT(*) as total_foods,
            COUNT(DISTINCT c.name_he) as total_categories,
            COUNT(DISTINCT sc.name_he) as total_subcategories
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        WHERE p.can_include_in_menu = true
        AND p.is_active = true
        """
        
        stats = self.db.execute_single(stats_query)
        
        categories_query = """
        SELECT DISTINCT c.name_he 
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.can_include_in_menu = true
        AND p.is_active = true
        ORDER BY c.name_he
        """
        
        subcategories_query = """
        SELECT DISTINCT sc.name_he 
        FROM products p
        JOIN subcategories sc ON p.subcategory_id = sc.id
        WHERE p.can_include_in_menu = true
        AND p.is_active = true
        ORDER BY sc.name_he
        """
        
        categories = [row['name_he'] for row in self.db.execute_query(categories_query)]
        subcategories = [row['name_he'] for row in self.db.execute_query(subcategories_query)]
        
        return {
            'total_foods': stats['total_foods'] if stats else 0,
            'total_categories': stats['total_categories'] if stats else 0,
            'total_subcategories': stats['total_subcategories'] if stats else 0,
            'categories': categories,
            'subcategories': subcategories
        }

class SqlPriceComparison:
    """PostgreSQL-based price comparison service"""
    
    def __init__(self):
        self.db = db
        self.supermarkets = self.get_available_supermarkets()
        print("💰 SQL Price Comparison initialized")
    
    def get_available_supermarkets(self):
        """Get list of active supermarkets"""
        query = """
        SELECT name 
        FROM supermarkets 
        WHERE is_active = true 
        ORDER BY name
        """
        
        rows = self.db.execute_query(query)
        return [row['name'] for row in rows]
    
    def get_item_prices(self, item_code):
        """Get current prices for an item across all supermarkets"""
        query = """
        SELECT DISTINCT ON (s.name)
            s.name as supermarket,
            ph.price,
            ph.is_on_sale,
            ph.sale_percentage,
            ph.recorded_at
        FROM price_history ph
        JOIN products p ON ph.product_id = p.id
        JOIN supermarkets s ON ph.supermarket_id = s.id
        WHERE p.item_code = %s
        AND s.is_active = true
        AND ph.recorded_at > NOW() - INTERVAL '30 days'
        ORDER BY s.name, ph.recorded_at DESC
        """
        
        rows = self.db.execute_query(query, (str(item_code),))
        
        # Initialize all supermarkets with None
        prices = {sm: None for sm in self.supermarkets}
        
        # Fill in available prices
        for row in rows:
            supermarket = row['supermarket']
            if supermarket in prices:
                prices[supermarket] = {
                    'price': float(row['price']),
                    'is_on_sale': row['is_on_sale'],
                    'sale_percentage': row['sale_percentage'],
                    'last_updated': row['recorded_at'].isoformat() if row['recorded_at'] else None
                }
        
        return prices
    
    def compare_menu_prices(self, menu_items):
        """Compare total price of menu items across supermarkets"""
        if not menu_items:
            return {'error': 'No menu items provided'}
        
        # Build item codes list for query
        item_codes = [str(item.get('item_code', '')) for item in menu_items]
        
        # Get all current prices for these items
        query = """
        SELECT DISTINCT ON (p.item_code, s.name)
            p.item_code,
            p.name as product_name,
            s.name as supermarket,
            ph.price,
            ph.is_on_sale,
            ph.sale_percentage
        FROM price_history ph
        JOIN products p ON ph.product_id = p.id
        JOIN supermarkets s ON ph.supermarket_id = s.id
        WHERE p.item_code = ANY(%s)
        AND s.is_active = true
        AND ph.recorded_at > NOW() - INTERVAL '30 days'
        ORDER BY p.item_code, s.name, ph.recorded_at DESC
        """
        
        price_rows = self.db.execute_query(query, (item_codes,))
        
        # Create price lookup
        price_lookup = {}
        for row in price_rows:
            item_code = row['item_code']
            supermarket = row['supermarket']
            
            if item_code not in price_lookup:
                price_lookup[item_code] = {}
            
            price_lookup[item_code][supermarket] = {
                'price': float(row['price']),
                'is_on_sale': row['is_on_sale'],
                'sale_percentage': row['sale_percentage']
            }
        
        # Calculate totals and breakdown
        supermarket_totals = {sm: 0.0 for sm in self.supermarkets}
        supermarket_item_counts = {sm: 0 for sm in self.supermarkets}
        item_breakdown = []
        
        for item in menu_items:
            item_code = str(item.get('item_code', ''))
            portion_grams = float(item.get('portion_grams', 0))
            item_name = item.get('name', f'Item {item_code}')
            
            item_costs = {}
            item_prices = price_lookup.get(item_code, {})
            
            for supermarket in self.supermarkets:
                if supermarket in item_prices:
                    price_per_100g = item_prices[supermarket]['price']
                    item_cost = (portion_grams / 100.0) * price_per_100g
                    item_costs[supermarket] = round(item_cost, 2)
                    supermarket_totals[supermarket] += item_cost
                    supermarket_item_counts[supermarket] += 1
                else:
                    item_costs[supermarket] = None
            
            # Find min/max prices for this item
            available_costs = [cost for cost in item_costs.values() if cost is not None]
            cheapest_price = min(available_costs) if available_costs else None
            most_expensive_price = max(available_costs) if available_costs else None
            
            item_breakdown.append({
                'item_code': item_code,
                'name': item_name,
                'portion_grams': portion_grams,
                'prices_per_supermarket': item_costs,
                'cheapest_price': cheapest_price,
                'most_expensive_price': most_expensive_price
            })
        
        # Round totals
        for sm in self.supermarkets:
            supermarket_totals[sm] = round(supermarket_totals[sm], 2)
        
        # Find best and worst supermarkets
        available_totals = {sm: total for sm, total in supermarket_totals.items() 
                           if supermarket_item_counts[sm] > 0}
        
        cheapest_supermarket = None
        most_expensive_supermarket = None
        cheapest_total = None
        most_expensive_total = None
        
        if available_totals:
            cheapest_supermarket = min(available_totals.keys(), key=lambda x: available_totals[x])
            most_expensive_supermarket = max(available_totals.keys(), key=lambda x: available_totals[x])
            cheapest_total = available_totals[cheapest_supermarket]
            most_expensive_total = available_totals[most_expensive_supermarket]
        
        # Calculate coverage
        total_items = len(menu_items)
        coverage = {}
        for sm in self.supermarkets:
            if total_items > 0:
                coverage[sm] = round((supermarket_item_counts[sm] / total_items) * 100, 1)
            else:
                coverage[sm] = 0.0
        
        return {
            'summary': {
                'total_items': total_items,
                'cheapest_supermarket': cheapest_supermarket,
                'cheapest_total': cheapest_total,
                'most_expensive_supermarket': most_expensive_supermarket,
                'most_expensive_total': most_expensive_total,
                'savings_potential': round(most_expensive_total - cheapest_total, 2) if most_expensive_total and cheapest_total else 0
            },
            'supermarket_totals': supermarket_totals,
            'supermarket_coverage': coverage,
            'item_breakdown': item_breakdown,
            'available_supermarkets': self.supermarkets
        }
    
    def get_cheapest_combination(self, menu_items):
        """Find the cheapest combination across all supermarkets"""
        if not menu_items:
            return {'error': 'No menu items provided'}
        
        item_codes = [str(item.get('item_code', '')) for item in menu_items]
        
        # Get all prices for these items
        query = """
        SELECT DISTINCT ON (p.item_code, s.name)
            p.item_code,
            p.name as product_name,
            s.name as supermarket,
            ph.price
        FROM price_history ph
        JOIN products p ON ph.product_id = p.id
        JOIN supermarkets s ON ph.supermarket_id = s.id
        WHERE p.item_code = ANY(%s)
        AND s.is_active = true
        AND ph.recorded_at > NOW() - INTERVAL '30 days'
        ORDER BY p.item_code, s.name, ph.recorded_at DESC
        """
        
        price_rows = self.db.execute_query(query, (item_codes,))
        
        # Build price lookup
        price_lookup = {}
        for row in price_rows:
            item_code = row['item_code']
            if item_code not in price_lookup:
                price_lookup[item_code] = {}
            price_lookup[item_code][row['supermarket']] = float(row['price'])
        
        # Find cheapest option for each item
        total_cost = 0.0
        shopping_list = {}
        unavailable_items = []
        
        for item in menu_items:
            item_code = str(item.get('item_code', ''))
            portion_grams = float(item.get('portion_grams', 0))
            item_name = item.get('name', f'Item {item_code}')
            
            if item_code not in price_lookup:
                unavailable_items.append({
                    'item_code': item_code,
                    'name': item_name,
                    'portion_grams': portion_grams
                })
                continue
            
            # Find cheapest supermarket for this item
            best_price = None
            best_supermarket = None
            
            for supermarket, price_per_100g in price_lookup[item_code].items():
                item_cost = (portion_grams / 100.0) * price_per_100g
                if best_price is None or item_cost < best_price:
                    best_price = item_cost
                    best_supermarket = supermarket
            
            if best_price is not None:
                total_cost += best_price
                
                if best_supermarket not in shopping_list:
                    shopping_list[best_supermarket] = []
                
                shopping_list[best_supermarket].append({
                    'item_code': item_code,
                    'name': item_name,
                    'portion_grams': portion_grams,
                    'price': round(best_price, 2)
                })
        
        return {
            'total_cost': round(total_cost, 2),
            'shopping_list': shopping_list,
            'unavailable_items': unavailable_items,
            'supermarkets_needed': list(shopping_list.keys()),
            'items_found': len(menu_items) - len(unavailable_items),
            'items_missing': len(unavailable_items)
        }