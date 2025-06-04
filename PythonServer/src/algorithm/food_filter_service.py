# src/algorithm/food_filter_service.py - Food filtering orchestration

from ..filters import NutritionalSoundnessFilter, MealAppropriatenessFilter

class FoodFilterService:
    """Responsible ONLY for orchestrating food filtering (SRP)"""
    
    def __init__(self, nutritional_filter, preference_filter, meal_rules_factory):
        self.nutritional_filter = nutritional_filter
        self.preference_filter = preference_filter
        self.meal_rules_factory = meal_rules_factory
    
    def get_suitable_foods(self, all_foods, meal_type=None):
        """Apply complete filtering pipeline to get suitable foods"""
        if not all_foods:
            return []
        
        # Apply nutritional filtering
        suitable_foods = self.nutritional_filter.filter(all_foods)
        
        # Apply category preference filtering
        suitable_foods = self.preference_filter.filter(suitable_foods)
        
        # Apply meal-specific filtering if specified
        if meal_type:
            meal_rules = self.meal_rules_factory.create_rules(meal_type)
            meal_filter = MealAppropriatenessFilter(meal_rules)
            suitable_foods = meal_filter.filter(suitable_foods)
        
        return suitable_foods
    
    def get_filtering_stats(self, original_count, filtered_count):
        """Get statistics about the filtering process"""
        return {
            'original_count': original_count,
            'filtered_count': filtered_count,
            'filtered_percentage': (filtered_count / original_count * 100) if original_count > 0 else 0,
            'removed_count': original_count - filtered_count
        }