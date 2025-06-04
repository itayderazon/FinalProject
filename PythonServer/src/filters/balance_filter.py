# src/filters/balance_filter.py - Balance constraint filtering

from .base_filter import FoodFilter
from config import Config

class BalanceFilter(FoodFilter):
    """Filter foods to maintain nutritional balance"""
    
    def __init__(self, food_classifier, current_menu, target_nutrition, config=None):
        self.food_classifier = food_classifier
        self.current_menu = current_menu
        self.target_nutrition = target_nutrition
        
        if config is None:
            config = Config()
        self.max_sugar_percentage = config.MAX_SUGAR_PERCENTAGE
        self.max_processed_percentage = config.MAX_PROCESSED_PERCENTAGE
    
    def filter(self, foods):
        """Filter foods that would violate balance constraints"""
        return [food for food in foods if self.is_suitable_for_menu(food)]
    
    def is_suitable_for_menu(self, food):
        """Check if adding this food would violate balance constraints"""
        
        # Check sugar constraint
        if self.food_classifier.is_high_sugar(food):
            if not self._check_sugar_constraint(food):
                return False
        
        # Check processed food constraint
        if self.food_classifier.is_processed(food):
            if not self._check_processed_constraint(food):
                return False
        
        return True
    
    def _check_sugar_constraint(self, food):
        """Check if adding this food violates sugar constraint"""
        current_nutrition = self.current_menu.get_total_nutrition()
        
        # Calculate current sugar calories
        sugar_calories = sum(
            item.get_nutrition().calories for item in self.current_menu.items
            if self.food_classifier.is_high_sugar(item.food)
        )
        
        # Add potential sugar calories from this food
        potential_sugar_calories = sugar_calories + food.nutrition_per_100g.calories
        potential_total_calories = current_nutrition.calories + food.nutrition_per_100g.calories
        
        if potential_total_calories > 0:
            sugar_percentage = potential_sugar_calories / potential_total_calories
            return sugar_percentage <= self.max_sugar_percentage
        
        return True
    
    def _check_processed_constraint(self, food):
        """Check if adding this food violates processed food constraint"""
        # Count processed foods in current menu
        processed_count = sum(
            1 for item in self.current_menu.items
            if self.food_classifier.is_processed(item.food)
        )
        
        # Calculate percentage if we add this processed food
        total_items = len(self.current_menu.items) + 1
        processed_percentage = (processed_count + 1) / total_items
        
        return processed_percentage <= self.max_processed_percentage

class DiversityFilter(FoodFilter):
    """Filter to promote food diversity"""
    
    def __init__(self, current_menu, max_same_category=2, max_same_subcategory=1):
        self.current_menu = current_menu
        self.max_same_category = max_same_category
        self.max_same_subcategory = max_same_subcategory
    
    def filter(self, foods):
        """Filter foods to promote diversity"""
        return [food for food in foods if self.promotes_diversity(food)]
    
    def promotes_diversity(self, food):
        """Check if food promotes menu diversity"""
        
        # Count current categories and subcategories
        current_categories = {}
        current_subcategories = {}
        
        for item in self.current_menu.items:
            category = item.food.category
            subcategory = item.food.subcategory
            
            current_categories[category] = current_categories.get(category, 0) + 1
            current_subcategories[subcategory] = current_subcategories.get(subcategory, 0) + 1
        
        # Check category limit
        if current_categories.get(food.category, 0) >= self.max_same_category:
            return False
        
        # Check subcategory limit
        if current_subcategories.get(food.subcategory, 0) >= self.max_same_subcategory:
            return False
        
        return True

class AllergenFilter(FoodFilter):
    """Filter foods based on allergens"""
    
    def __init__(self, excluded_allergens=None):
        self.excluded_allergens = excluded_allergens or []
    
    def filter(self, foods):
        """Filter out foods with excluded allergens"""
        if not self.excluded_allergens:
            return foods
        
        return [food for food in foods if not self.has_excluded_allergens(food)]
    
    def has_excluded_allergens(self, food):
        """Check if food contains any excluded allergens"""
        # This would need to be implemented based on how allergen data is stored
        # For now, we'll assume allergens are stored in a food.allergens list
        if hasattr(food, 'allergens') and food.allergens:
            return any(allergen in self.excluded_allergens for allergen in food.allergens)
        return False

class HealthScoreFilter(FoodFilter):
    """Filter foods based on health score"""
    
    def __init__(self, food_classifier, min_health_score=30):
        self.food_classifier = food_classifier
        self.min_health_score = min_health_score
    
    def filter(self, foods):
        """Filter foods by minimum health score"""
        return [food for food in foods 
                if self.food_classifier.get_food_score(food) >= self.min_health_score]