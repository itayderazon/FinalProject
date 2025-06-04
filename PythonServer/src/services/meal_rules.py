# src/services/meal_rules.py - Meal rules service

from config import Config

class MealRules:
    """Base class for meal rules - Open/Closed principle"""
    
    def __init__(self, config=None):
        if config is None:
            config = Config()
        self.config = config
    
    def get_primary_categories(self):
        """Get primary food categories for this meal"""
        return []
    
    def get_secondary_categories(self):
        """Get secondary food categories for this meal"""
        return []
    
    def get_forbidden_categories(self):
        """Get forbidden food categories for this meal"""
        return []
    
    def get_required_food_types(self):
        """Get required food types for this meal"""
        return ['protein']
    
    def is_appropriate(self, food):
        """Check if food is appropriate for this meal"""
        category = food.category
        return (category in self.get_primary_categories() or 
                category in self.get_secondary_categories())
    
    def is_forbidden(self, food):
        """Check if food is forbidden for this meal"""
        return food.category in self.get_forbidden_categories()
    
    def get_meal_priority_score(self, food):
        """Get priority score for food in this meal (higher = better)"""
        if food.category in self.get_primary_categories():
            return 3
        elif food.category in self.get_secondary_categories():
            return 2
        elif food.category in self.get_forbidden_categories():
            return 0
        else:
            return 1

class BreakfastRules(MealRules):
    """Breakfast-specific rules"""
    
    def get_primary_categories(self):
        return self.config.MEAL_RULES['breakfast']['primary']
    
    def get_secondary_categories(self):
        return self.config.MEAL_RULES['breakfast']['secondary']
    
    def get_forbidden_categories(self):
        return self.config.MEAL_RULES['breakfast']['forbidden']
    
    def get_required_food_types(self):
        return self.config.MEAL_RULES['breakfast']['required_types']

class LunchRules(MealRules):
    """Lunch-specific rules"""
    
    def get_primary_categories(self):
        return self.config.MEAL_RULES['lunch']['primary']
    
    def get_secondary_categories(self):
        return self.config.MEAL_RULES['lunch']['secondary']
    
    def get_forbidden_categories(self):
        return self.config.MEAL_RULES['lunch']['forbidden']
    
    def get_required_food_types(self):
        return self.config.MEAL_RULES['lunch']['required_types']

class DinnerRules(MealRules):
    """Dinner-specific rules"""
    
    def get_primary_categories(self):
        return self.config.MEAL_RULES['dinner']['primary']
    
    def get_secondary_categories(self):
        return self.config.MEAL_RULES['dinner']['secondary']
    
    def get_forbidden_categories(self):
        return self.config.MEAL_RULES['dinner']['forbidden']
    
    def get_required_food_types(self):
        return self.config.MEAL_RULES['dinner']['required_types']

class SnackRules(MealRules):
    """Snack-specific rules"""
    
    def get_primary_categories(self):
        return self.config.MEAL_RULES['snacks']['primary']
    
    def get_secondary_categories(self):
        return self.config.MEAL_RULES['snacks']['secondary']
    
    def get_forbidden_categories(self):
        return self.config.MEAL_RULES['snacks']['forbidden']
    
    def get_required_food_types(self):
        return self.config.MEAL_RULES['snacks']['required_types']

class MealRulesFactory:
    """Factory to create meal rules - easily extensible"""
    
    @staticmethod
    def create_rules(meal_type, config=None):
        """Create appropriate meal rules for the given meal type"""
        rules_map = {
            'breakfast': BreakfastRules,
            'lunch': LunchRules,
            'dinner': DinnerRules,
            'snacks': SnackRules
        }
        
        rule_class = rules_map.get(meal_type.lower())
        if not rule_class:
            return MealRules(config)  # Default rules
        return rule_class(config)
    
    @staticmethod
    def get_available_meal_types():
        """Get list of available meal types"""
        return ['breakfast', 'lunch', 'dinner', 'snacks']
    
    @staticmethod
    def validate_meal_type(meal_type):
        """Validate that meal type is supported"""
        return meal_type.lower() in MealRulesFactory.get_available_meal_types()