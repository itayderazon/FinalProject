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
    
    def get_categories(self):
        """Get category distribution"""
        categories = {}
        for item in self.items:
            category = item.food.category
            categories[category] = categories.get(category, 0) + 1
        return categories
    
    def get_subcategories(self):
        """Get subcategory distribution"""
        subcategories = {}
        for item in self.items:
            subcategory = item.food.subcategory
            subcategories[subcategory] = subcategories.get(subcategory, 0) + 1
        return subcategories
    
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