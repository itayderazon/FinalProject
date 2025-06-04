# src/models/food.py - Food model

from .nutrition import NutritionInfo

class Food:
    """Responsible ONLY for food data"""
    
    def __init__(self, item_code, name, category, subcategory, nutrition_per_100g, sodium=0):
        self.item_code = str(item_code)
        self.name = str(name)
        self.category = str(category)
        self.subcategory = str(subcategory)
        self.nutrition_per_100g = nutrition_per_100g
        self.sodium = float(sodium)
    
    def get_nutrition_for_portion(self, grams):
        """Get nutrition for a specific portion size"""
        factor = grams / 100.0
        return self.nutrition_per_100g.multiply(factor)
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'item_code': self.item_code,
            'name': self.name,
            'category': self.category,
            'subcategory': self.subcategory,
            'nutrition_per_100g': self.nutrition_per_100g.to_dict(),
            'sodium': self.sodium
        }
    
    def __str__(self):
        return f"{self.name} ({self.item_code}) - {self.category} → {self.subcategory}"
    
    def __repr__(self):
        return f"Food(item_code='{self.item_code}', name='{self.name}', category='{self.category}')"

class MenuItem:
    """Responsible ONLY for menu item data"""
    
    def __init__(self, food, portion_grams):
        self.food = food
        self.portion_grams = float(portion_grams)
    
    def get_nutrition(self):
        """Get nutrition for this menu item"""
        return self.food.get_nutrition_for_portion(self.portion_grams)
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'food': self.food.to_dict(),
            'portion_grams': self.portion_grams,
            'nutrition': self.get_nutrition().to_dict()
        }
    
    def __str__(self):
        nutrition = self.get_nutrition()
        return f"{self.food.name} - {self.portion_grams}g ({nutrition.calories:.1f}cal)"
    
    def __repr__(self):
        return f"MenuItem(food={self.food.item_code}, portion_grams={self.portion_grams})"