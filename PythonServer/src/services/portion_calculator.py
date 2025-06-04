# src/services/portion_calculator.py - Portion calculation service

import random
from config import Config

class PortionCalculator:
    """Responsible ONLY for calculating portion sizes"""
    
    def __init__(self, config=None):
        if config is None:
            config = Config()
        
        self.default_limits = {
            'min': config.DEFAULT_MIN_PORTION,
            'max': config.DEFAULT_MAX_PORTION
        }
        self.category_limits = config.PORTION_LIMITS
    
    def get_portion_limits(self, food):
        """Get portion limits for a food"""
        return self.category_limits.get(food.subcategory, self.default_limits)
    
    def calculate_portion(self, food, target_nutrition, current_nutrition, remaining_slots):
        """Calculate appropriate portion size"""
        remaining_calories = max(0, target_nutrition.calories - current_nutrition.calories)
        food_calories_per_100g = food.nutrition_per_100g.calories
        
        if food_calories_per_100g > 0 and remaining_slots > 0:
            # Calculate portion based on remaining calorie needs
            portion = (remaining_calories / remaining_slots) / food_calories_per_100g * 100
            # Add some randomness for variety
            portion *= (0.7 + random.random() * 0.6)
        else:
            # Default to middle of range
            limits = self.get_portion_limits(food)
            portion = (limits['min'] + limits['max']) / 2
        
        return self.apply_portion_limits(food, portion)
    
    def apply_portion_limits(self, food, portion):
        """Apply min/max limits to portion size"""
        limits = self.get_portion_limits(food)
        return max(limits['min'], min(limits['max'], round(portion)))
    
    def calculate_smart_portion(self, food, target_nutrition, current_nutrition, remaining_slots, food_classifier):
        """Calculate portion with additional intelligence"""
        base_portion = self.calculate_portion(food, target_nutrition, current_nutrition, remaining_slots)
        
        # Adjust based on food type
        if food_classifier.is_high_sugar(food):
            # Reduce sugar portions
            base_portion = min(base_portion, self.get_portion_limits(food)['max'] * 0.7)
        
        elif food_classifier.is_protein_source(food):
            # Ensure adequate protein portions
            base_portion = max(base_portion, self.get_portion_limits(food)['min'] * 1.2)
        
        elif food_classifier.is_fiber_source(food):
            # Encourage fiber foods
            base_portion = max(base_portion, self.get_portion_limits(food)['min'] * 1.1)
        
        return self.apply_portion_limits(food, base_portion)
    
    def calculate_balanced_portion(self, food, target_nutrition, current_nutrition, menu_size, food_classifier):
        """Calculate portion for balanced nutrition"""
        current_ratios = current_nutrition.get_macro_ratios() if current_nutrition.calories > 0 else {'protein': 0, 'carbs': 0, 'fat': 0}
        target_ratios = target_nutrition.get_macro_ratios()
        
        # Base calculation
        remaining_calories = max(0, target_nutrition.calories - current_nutrition.calories)
        avg_calories_per_item = remaining_calories / menu_size if menu_size > 0 else 100
        
        food_calories = food.nutrition_per_100g.calories
        if food_calories > 0:
            base_portion = (avg_calories_per_item / food_calories) * 100
        else:
            base_portion = 100
        
        # Adjust based on macro needs
        protein_deficit = target_ratios['protein'] - current_ratios['protein']
        carb_deficit = target_ratios['carbs'] - current_ratios['carbs']
        fat_deficit = target_ratios['fat'] - current_ratios['fat']
        
        food_nutrition = food.nutrition_per_100g
        food_ratios = food_nutrition.get_macro_ratios()
        
        # Increase portion if food helps with deficit
        if protein_deficit > 10 and food_ratios['protein'] > 20:
            base_portion *= 1.2
        if carb_deficit > 10 and food_ratios['carbs'] > 40:
            base_portion *= 1.1
        if fat_deficit > 10 and food_ratios['fat'] > 20:
            base_portion *= 1.1
        
        # Apply food-type adjustments
        if food_classifier:
            base_portion = self.apply_food_type_adjustments(food, base_portion, food_classifier)
        
        return self.apply_portion_limits(food, base_portion)
    
    def apply_food_type_adjustments(self, food, portion, food_classifier):
        """Apply portion adjustments based on food type"""
        # Sugar foods - strict limits
        if food_classifier.is_high_sugar(food):
            limits = self.get_portion_limits(food)
            portion = min(portion, limits['max'] * 0.8)
        
        # Protein foods - ensure minimum
        elif food_classifier.is_protein_source(food):
            limits = self.get_portion_limits(food)
            portion = max(portion, limits['min'] * 1.2)
        
        # Processed foods - moderate
        elif food_classifier.is_processed(food):
            limits = self.get_portion_limits(food)
            portion = min(portion, limits['max'] * 0.9)
        
        # Wholesome foods - encourage
        elif food_classifier.is_wholesome(food):
            limits = self.get_portion_limits(food)
            portion = max(portion, limits['min'] * 1.1)
        
        return portion
    
    def validate_portion(self, food, portion):
        """Validate that portion is within acceptable limits"""
        limits = self.get_portion_limits(food)
        return limits['min'] <= portion <= limits['max']
    
    def get_portion_info(self, food):
        """Get detailed portion information for a food"""
        limits = self.get_portion_limits(food)
        return {
            'min_portion': limits['min'],
            'max_portion': limits['max'],
            'suggested_portion': (limits['min'] + limits['max']) / 2,
            'portion_unit': 'grams',
            'category_specific': food.subcategory in self.category_limits
        }