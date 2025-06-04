# src/filters/nutritional_filter.py - Nutritional filtering

from .base_filter import FoodFilter
from config import Config

class NutritionalSoundnessFilter(FoodFilter):
    """Filter foods based on nutritional validity"""
    
    def __init__(self, config=None):
        if config is None:
            config = Config()
        self.max_calories_per_100g = config.MAX_CALORIES_PER_100G
        self.max_sodium_per_100g = config.MAX_SODIUM_PER_100G
    
    def filter(self, foods):
        """Filter out nutritionally unsound foods"""
        return [food for food in foods if self.is_nutritionally_sound(food)]
    
    def is_nutritionally_sound(self, food):
        """Check if food is nutritionally sound"""
        nutrition = food.nutrition_per_100g
        
        # Basic validation
        if not nutrition.is_valid():
            return False
        
        # Check for reasonable calorie density
        if nutrition.calories > self.max_calories_per_100g:
            return False
        
        # Check for reasonable sodium levels
        if food.sodium > self.max_sodium_per_100g:
            return False
        
        # Check for negative values
        if (nutrition.calories < 0 or nutrition.protein < 0 or 
            nutrition.carbs < 0 or nutrition.fat < 0):
            return False
        
        return True

class MacroBalanceFilter(FoodFilter):
    """Filter foods based on macronutrient balance"""
    
    def __init__(self, min_protein_ratio=0, max_fat_ratio=1, max_carb_ratio=1):
        self.min_protein_ratio = min_protein_ratio
        self.max_fat_ratio = max_fat_ratio
        self.max_carb_ratio = max_carb_ratio
    
    def filter(self, foods):
        """Filter foods based on macro ratios"""
        return [food for food in foods if self.has_good_macro_balance(food)]
    
    def has_good_macro_balance(self, food):
        """Check if food has acceptable macro balance"""
        ratios = food.nutrition_per_100g.get_macro_ratios()
        
        if ratios['protein'] < self.min_protein_ratio:
            return False
        if ratios['fat'] > self.max_fat_ratio:
            return False
        if ratios['carbs'] > self.max_carb_ratio:
            return False
        
        return True

class CalorieDensityFilter(FoodFilter):
    """Filter foods based on calorie density"""
    
    def __init__(self, min_calories=0, max_calories=600):
        self.min_calories = min_calories
        self.max_calories = max_calories
    
    def filter(self, foods):
        """Filter foods by calorie density"""
        return [food for food in foods if self.has_acceptable_calorie_density(food)]
    
    def has_acceptable_calorie_density(self, food):
        """Check if food has acceptable calorie density"""
        calories = food.nutrition_per_100g.calories
        return self.min_calories <= calories <= self.max_calories