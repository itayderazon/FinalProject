# src/data/sql_providers.py - Simple SQL providers with basic error handling

import time
from src.models.food import Food
from src.models.nutrition import NutritionInfo

class SqlFoodProvider:
    """Simple PostgreSQL food provider with caching"""
    
    def __init__(self, db_manager):
        self.db = db_manager
        self.cache_ttl = 3600  # 1 hour cache
        self.foods_cache = None
        self.cache_timestamp = 0
        print("🗃️ SQL Food Provider initialized")
    
    def should_refresh_cache(self):
        """Check if cache needs refresh"""
        current_time = time.time()
        return (self.foods_cache is None or 
                current_time - self.cache_timestamp > self.cache_ttl)
    
    def refresh_cache(self):
        """Refresh the foods cache"""
        print("📊 Refreshing foods cache from PostgreSQL...")
        
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
        
        try:
            rows = self.db.execute_query(query)
            foods = []
            
            for row in rows:
                try:
                    food = self.create_food_from_row(row)
                    if food:
                        foods.append(food)
                except Exception as e:
                    print(f"Error processing food {row.get('item_code', 'unknown')}: {e}")
                    continue
            
            self.foods_cache = foods
            self.cache_timestamp = time.time()
            print(f"✅ Cached {len(foods)} foods from PostgreSQL")
            
        except Exception as e:
            print(f"Failed to refresh foods cache: {e}")
            if self.foods_cache is None:
                self.foods_cache = []
    
    def create_food_from_row(self, row):
        """Create Food object from database row"""
        nutrition_data = row['nutrition']
        if not nutrition_data:
            return None
        
        # Get nutrition values
        calories = float(nutrition_data.get('calories', 0))
        protein = float(nutrition_data.get('protein', 0))
        carbs = float(nutrition_data.get('total_carbs', 0))
        fat = float(nutrition_data.get('total_fat', 0))
        
        # Basic validation
        if calories <= 0:
            return None
        
        if protein < 0 or carbs < 0 or fat < 0:
            print(f"Warning: Negative macros in food {row['item_code']}")
            return None
        
        nutrition = NutritionInfo(calories, protein, carbs, fat)
        
        # Check if nutrition makes sense
        if not nutrition.is_valid():
            print(f"Warning: Invalid nutrition data for {row['item_code']}")
            return None
        
        return Food(
            item_code=row['item_code'],
            name=row['name'],
            category=row['category'] or '',
            subcategory=row['subcategory'] or '',
            nutrition_per_100g=nutrition,
            sodium=float(row['sodium'])
        )
    
    def get_all_foods(self):
        """Get all foods with caching"""
        if self.should_refresh_cache():
            self.refresh_cache()
        
        return self.foods_cache or []
    
    def get_food_by_code(self, item_code):
        """Get specific food by item code"""
        if not item_code:
            return None
        
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
        
        try:
            row = self.db.execute_single(query, (str(item_code),))
            if not row:
                return None
            
            return self.create_food_from_row(row)
            
        except Exception as e:
            print(f"Error getting food by code {item_code}: {e}")
            return None
    
    def search_foods(self, query_text, limit=100):
        """Search foods by name"""
        if not query_text or len(query_text.strip()) < 2:
            return []
        
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
        LIMIT %s
        """
        
        try:
            search_term = f"%{query_text.strip()}%"
            rows = self.db.execute_query(query, (search_term, search_term, search_term, limit))
            
            foods = []
            for row in rows:
                food = self.create_food_from_row(row)
                if food:
                    foods.append(food)
            
            return foods
            
        except Exception as e:
            print(f"Error searching foods with query '{query_text}': {e}")
            return []
    
    def reload_foods(self):
        """Force reload foods cache"""
        self.foods_cache = None
        self.cache_timestamp = 0
        return self.get_all_foods()
    
    def get_provider_stats(self):
        """Get statistics about the food provider"""
        try:
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
            
        except Exception as e:
            print(f"Error getting provider stats: {e}")
            return {
                'total_foods': 0,
                'total_categories': 0,
                'total_subcategories': 0,
                'categories': [],
                'subcategories': [],
                'error': str(e)
            }

class SqlPriceComparison:
    """Simple PostgreSQL-based price comparison service"""
    
    def __init__(self, db_manager):
        self.db = db_manager
        self.supermarkets = self.get_available_supermarkets()
        print("💰 SQL Price Comparison initialized")
    
    def get_available_supermarkets(self):
        """Get list of active supermarkets"""
        try:
            query = """
            SELECT name 
            FROM supermarkets 
            WHERE is_active = true 
            ORDER BY name
            """
            
            rows = self.db.execute_query(query)
            return [row['name'] for row in rows]
            
        except Exception as e:
            print(f"Error getting supermarkets: {e}")
            return []
    
    def compare_menu_prices(self, menu_items):
        """Compare total price of menu items across supermarkets"""
        if not menu_items:
            return {'error': 'No menu items provided'}
        
        try:
            # Get item codes
            item_codes = []
            for item in menu_items:
                if item.get('item_code'):
                    item_codes.append(str(item['item_code']))
            
            if not item_codes:
                return {'error': 'No valid item codes provided'}
            
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
            
            # Calculate totals
            supermarket_totals = {}
            for sm in self.supermarkets:
                supermarket_totals[sm] = 0.0
            
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
                    else:
                        item_costs[supermarket] = None
                
                item_breakdown.append({
                    'item_code': item_code,
                    'name': item_name,
                    'portion_grams': portion_grams,
                    'prices_per_supermarket': item_costs
                })
            
            # Round totals
            for sm in self.supermarkets:
                supermarket_totals[sm] = round(supermarket_totals[sm], 2)
            
            return {
                'supermarket_totals': supermarket_totals,
                'item_breakdown': item_breakdown,
                'available_supermarkets': self.supermarkets
            }
            
        except Exception as e:
            print(f"Error comparing menu prices: {e}")
            return {'error': f'Price comparison failed: {str(e)}'}
    
    def get_cheapest_combination(self, menu_items):
        """Find the cheapest combination across all supermarkets"""
        if not menu_items:
            return {'error': 'No menu items provided'}
        
        try:
            item_codes = [str(item.get('item_code', '')) for item in menu_items if item.get('item_code')]
            
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
            
            for item in menu_items:
                item_code = str(item.get('item_code', ''))
                portion_grams = float(item.get('portion_grams', 0))
                item_name = item.get('name', f'Item {item_code}')
                
                if item_code not in price_lookup:
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
                'supermarkets_needed': list(shopping_list.keys())
            }
            
        except Exception as e:
            print(f"Error finding cheapest combination: {e}")
            return {'error': f'Cheapest combination calculation failed: {str(e)}'}