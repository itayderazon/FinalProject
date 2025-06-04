# src/filters/category_preference_filter.py - Filter based on category preferences

from .base_filter import FoodFilter

class CategoryPreferenceFilter(FoodFilter):
    """Filter foods based on category/subcategory preferences from config"""
    
    def __init__(self, config):
        self.config = config
        self.excluded_categories = getattr(config, 'EXCLUDED_CATEGORIES', [])
        self.excluded_subcategories = getattr(config, 'EXCLUDED_SUBCATEGORIES', [])
        self.preferred_categories = getattr(config, 'PREFERRED_CATEGORIES', [])
        self.preferred_subcategories = getattr(config, 'PREFERRED_SUBCATEGORIES', [])
        self.category_limits = getattr(config, 'CATEGORY_LIMITS', {})
        self.subcategory_limits = getattr(config, 'SUBCATEGORY_LIMITS', {})
    
    def filter(self, foods):
        """Filter foods based on category preferences"""
        filtered_foods = []
        
        for food in foods:
            # Skip excluded categories/subcategories
            if food.category in self.excluded_categories:
               
                continue
            if food.subcategory in self.excluded_subcategories:
                
                continue
            
            filtered_foods.append(food)
        
        return filtered_foods
    
    def apply_menu_limits(self, foods, current_menu):
        """Apply category/subcategory limits based on current menu"""
        # Count current categories and subcategories in menu
        current_categories = {}
        current_subcategories = {}
        
        for item in current_menu.items:
            category = item.food.category
            subcategory = item.food.subcategory
            
            current_categories[category] = current_categories.get(category, 0) + 1
            current_subcategories[subcategory] = current_subcategories.get(subcategory, 0) + 1
        
        # Filter foods that would exceed limits
        limited_foods = []
        
        for food in foods:
            # Check category limits
            if food.category in self.category_limits:
                limit = self.category_limits[food.category]
                if current_categories.get(food.category, 0) >= limit:
                    continue
            
            # Check subcategory limits
            if food.subcategory in self.subcategory_limits:
                limit = self.subcategory_limits[food.subcategory]
                if current_subcategories.get(food.subcategory, 0) >= limit:
                    continue
            
            limited_foods.append(food)
        
        return limited_foods
    
    def get_preference_score(self, food):
        """Get preference score for food selection (higher = more preferred)"""
        score = 0
        
        # Bonus for preferred categories
        if food.category in self.preferred_categories:
            score += 50
        
        # Bonus for preferred subcategories  
        if food.subcategory in self.preferred_subcategories:
            score += 30
        
        return score
    
    def validate_required_categories(self, menu):
        """Check if menu meets required category/subcategory requirements"""
        required_categories = getattr(self.config, 'REQUIRED_CATEGORIES', [])
        required_subcategories = getattr(self.config, 'REQUIRED_SUBCATEGORIES', [])
        
        menu_categories = set(item.food.category for item in menu.items)
        menu_subcategories = set(item.food.subcategory for item in menu.items)
        
        # Check required categories
        for required_cat in required_categories:
            if required_cat not in menu_categories:
                return False, f"Missing required category: {required_cat}"
        
        # Check required subcategories
        for required_subcat in required_subcategories:
            if required_subcat not in menu_subcategories:
                return False, f"Missing required subcategory: {required_subcat}"
        
        return True, "All requirements met"

class SmartCategoryFilter(FoodFilter):
    """Enhanced filter that combines preferences with meal rules"""
    
    def __init__(self, config, meal_rules=None):
        self.preference_filter = CategoryPreferenceFilter(config)
        self.meal_rules = meal_rules
    
    def filter(self, foods):
        """Apply both preference filtering and meal rules"""
        # First apply category preferences
        filtered_foods = self.preference_filter.filter(foods)
        
        # Then apply meal rules if available
        if self.meal_rules:
            filtered_foods = [food for food in filtered_foods 
                            if self.meal_rules.is_appropriate(food) and not self.meal_rules.is_forbidden(food)]
        
        return filtered_foods
    
    def filter_with_menu_context(self, foods, current_menu):
        """Filter considering current menu state"""
        # Apply basic filtering
        filtered_foods = self.filter(foods)
        
        # Apply menu-specific limits
        limited_foods = self.preference_filter.apply_menu_limits(filtered_foods, current_menu)
        
        return limited_foods
    
    def score_food_with_preferences(self, food, meal_context=None):
        """Score food considering preferences and meal context"""
        score = self.preference_filter.get_preference_score(food)
        
        # Add meal appropriateness score
        if self.meal_rules:
            score += self.meal_rules.get_meal_priority_score(food) * 10
        
        return score