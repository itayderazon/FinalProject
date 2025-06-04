# src/filters/meal_filter.py - Meal-specific filtering

from .base_filter import FoodFilter

class MealAppropriatenessFilter(FoodFilter):
    """Filter foods based on meal appropriateness"""
    
    def __init__(self, meal_rules):
        self.meal_rules = meal_rules
    
    def filter(self, foods):
        """Filter foods appropriate for the meal type"""
        if not self.meal_rules:
            return foods
        
        return [food for food in foods 
                if self.meal_rules.is_appropriate(food) and not self.meal_rules.is_forbidden(food)]

class CategoryFilter(FoodFilter):
    """Filter foods by specific categories"""
    
    def __init__(self, allowed_categories=None, forbidden_categories=None):
        self.allowed_categories = allowed_categories or []
        self.forbidden_categories = forbidden_categories or []
    
    def filter(self, foods):
        """Filter foods by category rules"""
        result = foods
        
        # Apply allowed categories filter
        if self.allowed_categories:
            result = [food for food in result if food.category in self.allowed_categories]
        
        # Apply forbidden categories filter
        if self.forbidden_categories:
            result = [food for food in result if food.category not in self.forbidden_categories]
        
        return result

class SubcategoryFilter(FoodFilter):
    """Filter foods by specific subcategories"""
    
    def __init__(self, allowed_subcategories=None, forbidden_subcategories=None):
        self.allowed_subcategories = allowed_subcategories or []
        self.forbidden_subcategories = forbidden_subcategories or []
    
    def filter(self, foods):
        """Filter foods by subcategory rules"""
        result = foods
        
        # Apply allowed subcategories filter
        if self.allowed_subcategories:
            result = [food for food in result if food.subcategory in self.allowed_subcategories]
        
        # Apply forbidden subcategories filter
        if self.forbidden_subcategories:
            result = [food for food in result if food.subcategory not in self.forbidden_subcategories]
        
        return result

class FoodTypeFilter(FoodFilter):
    """Filter foods by food type using classifier"""
    
    def __init__(self, food_classifier, required_types=None, forbidden_types=None):
        self.food_classifier = food_classifier
        self.required_types = required_types or []
        self.forbidden_types = forbidden_types or []
    
    def filter(self, foods):
        """Filter foods by food type"""
        result = []
        
        for food in foods:
            food_type = self.food_classifier.get_food_type(food)
            
            # Check forbidden types
            if food_type in self.forbidden_types:
                continue
            
            # Check required types (if any specified)
            if self.required_types:
                if food_type in self.required_types:
                    result.append(food)
                # Also include foods that match specific type checks
                elif any(self.food_classifier.is_food_of_type(food, req_type) 
                        for req_type in self.required_types):
                    result.append(food)
            else:
                result.append(food)
        
        return result