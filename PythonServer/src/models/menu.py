# src/models/menu.py - Menu model

from .nutrition import NutritionInfo

class Menu:
    """Responsible ONLY for menu data and basic operations"""
    
    def __init__(self):
        self.items = []
    
    def add_item(self, item):
        """Add an item to the menu"""
        self.items.append(item)
    
    def remove_item(self, index):
        """Remove an item by index"""
        if 0 <= index < len(self.items):
            self.items.pop(index)
    
    def get_total_nutrition(self):
        """Calculate total nutrition for the menu"""
        if not self.items:
            return NutritionInfo(0, 0, 0, 0)
        
        total = self.items[0].get_nutrition()
        for item in self.items[1:]:
            total = total.add(item.get_nutrition())
        return total
    
    def get_categories(self, sql_food_provider):
        """Get category distribution using SQL provider"""
        if not sql_food_provider:
            return {}
        
        # Get item codes from the menu
        item_codes = [item.food.item_code for item in self.items]
        if not item_codes:
            return {}
        
        try:
            # Use SQL provider to get category distribution for these specific items
            stats = sql_food_provider.get_provider_stats()
            return stats.get('categories', [])
        except Exception as e:
            print(f"Error getting categories from SQL provider: {e}")
            return {}
    
    def get_subcategories(self, sql_food_provider):
        """Get subcategory distribution using SQL provider"""
        print(f"Getting subcategories from SQL provider: {sql_food_provider}")
        if not sql_food_provider:
            return {}
        
        # Get item codes from the menu
        item_codes = [item.food.item_code for item in self.items]
        if not item_codes:
            return {}
        
        try:
            # Use SQL provider to get subcategory distribution for these specific items
            stats = sql_food_provider.get_provider_stats()
            return stats.get('subcategories', [])
        except Exception as e:
            print(f"Error getting subcategories from SQL provider: {e}")
            return {}
    
    def get_total_cost(self, price_provider=None):
        """Calculate total cost if price provider is available"""
        if not price_provider:
            return None
        
        total_cost = 0
        for item in self.items:
            price_per_100g = price_provider.get_price(item.food.item_code)
            if price_per_100g:
                item_cost = (item.portion_grams / 100.0) * price_per_100g
                total_cost += item_cost
        return total_cost
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'items': [item.to_dict() for item in self.items],
            'total_nutrition': self.get_total_nutrition().to_dict(),
            'categories': self.get_categories(),
            'subcategories': self.get_subcategories(),
            'item_count': len(self.items)
        }
    
    def __len__(self):
        return len(self.items)
    
    def __iter__(self):
        return iter(self.items)
    
    def __getitem__(self, index):
        return self.items[index]
    
    def __str__(self):
        total = self.get_total_nutrition()
        categories = list(self.get_categories().keys())
        return f"Menu: {len(self.items)} items, {total.calories:.1f}cal, Categories: {', '.join(categories[:3])}"
    
    def __repr__(self):
        return f"Menu(items={len(self.items)})"