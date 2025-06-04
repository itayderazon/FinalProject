# src/data/providers.py - Data provider services

from .loaders import JsonDataLoader, FoodDataProcessor, CategoryDataLoader

class FoodProvider:
    """Interface for providing foods"""
    
    def get_all_foods(self):
        """Get all available foods. Override in subclasses."""
        raise NotImplementedError
    
    def get_food_by_code(self, item_code):
        """Get specific food by item code"""
        foods = self.get_all_foods()
        for food in foods:
            if food.item_code == item_code:
                return food
        return None
    
    def search_foods(self, query):
        """Search foods by name or category"""
        foods = self.get_all_foods()
        query_lower = query.lower()
        
        return [food for food in foods if 
                query_lower in food.name.lower() or
                query_lower in food.category.lower() or
                query_lower in food.subcategory.lower()]
    
    def get_foods_by_category(self, category):
        """Get foods by specific category"""
        foods = self.get_all_foods()
        return [food for food in foods if food.category == category]
    
    def get_foods_by_subcategory(self, subcategory):
        """Get foods by specific subcategory"""
        foods = self.get_all_foods()
        return [food for food in foods if food.subcategory == subcategory]
    
    def get_provider_stats(self):
        """Get statistics about the food provider"""
        foods = self.get_all_foods()
        categories = set(food.category for food in foods)
        subcategories = set(food.subcategory for food in foods)
        
        return {
            'total_foods': len(foods),
            'total_categories': len(categories),
            'total_subcategories': len(subcategories),
            'categories': list(categories),
            'subcategories': list(subcategories)
        }

class JsonFoodProvider(FoodProvider):
    """Food provider that loads from JSON file"""
    
    def __init__(self, json_file_path):
        self.json_file_path = json_file_path
        self.json_loader = JsonDataLoader(json_file_path)
        self.data_processor = FoodDataProcessor()
        self._foods = None  # Cache the loaded foods
        self._categories = None  # Cache category data
    
    def get_all_foods(self):
        """Load foods from JSON file (cached)"""
        if self._foods is None:
            print(f"Loading foods from JSON file: {self.json_file_path}")
            json_data = self.json_loader.load()
            self._foods = self.data_processor.process_food_data(json_data)
            
            stats = self.data_processor.get_processing_stats()
            print(f"Successfully loaded {stats['processed']} foods ({stats['success_rate']:.1f}% success rate)")
        
        return self._foods
    
    def reload_foods(self):
        """Force reload foods from file"""
        self._foods = None
        return self.get_all_foods()
    
    def get_categories_info(self):
        """Get category information if available"""
        if self._categories is None:
            # Try to load categories from companion file
            categories_file = self.json_file_path.replace('.json', '_categories.json')
            category_loader = CategoryDataLoader(categories_file)
            self._categories = category_loader.load_categories()
        
        return self._categories

class InMemoryFoodProvider(FoodProvider):
    """Food provider that uses in-memory food list"""
    
    def __init__(self, foods):
        self._foods = foods
    
    def get_all_foods(self):
        """Get the in-memory food list"""
        return self._foods
    
    def add_food(self, food):
        """Add a food to the provider"""
        self._foods.append(food)
    
    def remove_food(self, item_code):
        """Remove a food by item code"""
        self._foods = [food for food in self._foods if food.item_code != item_code]

class FilteredFoodProvider(FoodProvider):
    """Food provider that applies filters to another provider"""
    
    def __init__(self, base_provider, filters):
        self.base_provider = base_provider
        self.filters = filters if isinstance(filters, list) else [filters]
    
    def get_all_foods(self):
        """Get filtered foods from base provider"""
        foods = self.base_provider.get_all_foods()
        
        # Apply all filters
        for filter_instance in self.filters:
            foods = filter_instance.filter(foods)
        
        return foods

class PriceProvider:
    """Interface for providing price information"""
    
    def get_price(self, item_code, store=None):
        """Get price for an item. Override in subclasses."""
        raise NotImplementedError
    
    def get_cheapest_price(self, item_code):
        """Get cheapest price across all stores"""
        raise NotImplementedError
    
    def get_all_prices(self, item_code):
        """Get prices from all stores"""
        raise NotImplementedError

class MockPriceProvider(PriceProvider):
    """Mock price provider for testing"""
    
    def __init__(self):
        self.prices = {}
    
    def set_price(self, item_code, store, price):
        """Set price for testing"""
        if item_code not in self.prices:
            self.prices[item_code] = {}
        self.prices[item_code][store] = price
    
    def get_price(self, item_code, store='default'):
        """Get price for item and store"""
        if item_code in self.prices and store in self.prices[item_code]:
            return self.prices[item_code][store]
        return None
    
    def get_cheapest_price(self, item_code):
        """Get cheapest price across all stores"""
        if item_code not in self.prices:
            return None
        
        prices = list(self.prices[item_code].values())
        return min(prices) if prices else None
    
    def get_all_prices(self, item_code):
        """Get all prices for an item"""
        return self.prices.get(item_code, {})

class CachedFoodProvider(FoodProvider):
    """Food provider with caching capabilities"""
    
    def __init__(self, base_provider, cache_timeout=3600):
        self.base_provider = base_provider
        self.cache_timeout = cache_timeout
        self._cached_foods = None
        self._cache_timestamp = 0
    
    def get_all_foods(self):
        """Get foods with caching"""
        import time
        
        current_time = time.time()
        if (self._cached_foods is None or 
            current_time - self._cache_timestamp > self.cache_timeout):
            
            print("Refreshing food cache...")
            self._cached_foods = self.base_provider.get_all_foods()
            self._cache_timestamp = current_time
        
        return self._cached_foods
    
    def clear_cache(self):
        """Clear the cache"""
        self._cached_foods = None
        self._cache_timestamp = 0