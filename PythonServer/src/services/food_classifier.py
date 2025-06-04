# src/services/food_classifier.py - Food classification service

from config import Config

class FoodClassifier:
    """Responsible ONLY for classifying foods"""
    
    def __init__(self, config=None):
        if config is None:
            config = Config()
        
        self.classifications = config.FOOD_CLASSIFICATIONS
        self.min_protein_density = config.MIN_PROTEIN_DENSITY
    
    def is_high_sugar(self, food):
        """Check if food is high in sugar"""
        return food.subcategory in self.classifications['high_sugar']
    
    def is_protein_source(self, food):
        """Check if food is a protein source"""
        return (food.subcategory in self.classifications['protein'] or 
                food.nutrition_per_100g.protein >= self.min_protein_density)
    
    def is_fiber_source(self, food):
        """Check if food is a fiber source"""
        return food.subcategory in self.classifications['fiber']
    
    def is_processed(self, food):
        """Check if food is processed"""
        return food.subcategory in self.classifications['processed']
    
    def is_wholesome(self, food):
        """Check if food is wholesome/healthy"""
        return food.subcategory in self.classifications['wholesome']
    
    def get_food_type(self, food):
        """Get the primary type of the food"""
        if self.is_protein_source(food):
            return 'protein'
        elif self.is_fiber_source(food):
            return 'fiber'
        elif self.is_high_sugar(food):
            return 'sugar'
        elif self.is_processed(food):
            return 'processed'
        else:
            return 'other'
    
    def is_food_of_type(self, food, food_type):
        """Check if food matches a specific type"""
        type_checkers = {
            'protein': self.is_protein_source,
            'fiber': self.is_fiber_source,
            'sugar': self.is_high_sugar,
            'processed': self.is_processed,
            'wholesome': self.is_wholesome
        }
        
        checker = type_checkers.get(food_type)
        if checker:
            return checker(food)
        return False
    
    def get_food_score(self, food):
        """Get a health score for the food (0-100)"""
        score = 50  # Base score
        
        # Bonuses
        if self.is_wholesome(food):
            score += 30
        if self.is_protein_source(food):
            score += 20
        if self.is_fiber_source(food):
            score += 15
        
        # Penalties
        if self.is_high_sugar(food):
            score -= 25
        if self.is_processed(food):
            score -= 20
        
        # Sodium penalty
        if food.sodium > 800:
            score -= 15
        elif food.sodium > 400:
            score -= 10
        
        # Calorie density consideration
        if food.nutrition_per_100g.calories > 400:
            score -= 10
        
        return max(0, min(100, score))
    
    def classify_menu(self, menu):
        """Classify all foods in a menu"""
        classification = {
            'wholesome': 0,
            'protein': 0,
            'fiber': 0,
            'processed': 0,
            'high_sugar': 0,
            'total_items': len(menu.items)
        }
        
        for item in menu.items:
            if self.is_wholesome(item.food):
                classification['wholesome'] += 1
            if self.is_protein_source(item.food):
                classification['protein'] += 1
            if self.is_fiber_source(item.food):
                classification['fiber'] += 1
            if self.is_processed(item.food):
                classification['processed'] += 1
            if self.is_high_sugar(item.food):
                classification['high_sugar'] += 1
        
        return classification