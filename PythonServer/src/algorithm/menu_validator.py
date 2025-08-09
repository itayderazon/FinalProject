# src/algorithm/menu_validator.py - Menu validation logic

class MenuValidator:
    """Responsible ONLY for validating menus (SRP)"""
    
    def __init__(self, config, preference_filter=None, food_classifier=None):
        self.config = config
        self.preference_filter = preference_filter
        self.food_classifier = food_classifier
    
    def is_menu_valid(self, menu, target_nutrition):
        """Check if menu meets basic macro requirements"""
        if not menu or len(menu.items) == 0:
            return False
        
        total_nutrition = menu.get_total_nutrition()
        
        # Check macro ratios with configurable ranges for better accuracy
        cal_ratio = total_nutrition.calories / target_nutrition.calories
        protein_ratio = total_nutrition.protein / target_nutrition.protein
        carb_ratio = total_nutrition.carbs / target_nutrition.carbs
        fat_ratio = total_nutrition.fat / target_nutrition.fat
        
        # Use configurable validation ranges
        min_ratio = self.config.MIN_NUTRITION_RATIO
        max_ratio = self.config.MAX_NUTRITION_RATIO
        
        if not (min_ratio <= cal_ratio <= max_ratio): return False
        if not (min_ratio <= protein_ratio <= max_ratio): return False  
        if not (min_ratio <= carb_ratio <= max_ratio): return False
        if not (min_ratio <= fat_ratio <= max_ratio): return False
        
        return True
    
    def validate_category_requirements(self, menu):
        """Check if menu meets category/subcategory requirements"""
        if not self.preference_filter:
            return True, "No category requirements"
        
        return self.preference_filter.validate_required_categories(menu)
    
    def validate_required_items(self, menu, required_items_with_portions=None):
        """Check if menu contains all required item codes"""
        # Use parameter if provided, otherwise fall back to config
        if required_items_with_portions is not None:
            required_item_codes = list(required_items_with_portions.keys())
        else:
            required_item_codes = getattr(self.config, 'REQUIRED_ITEM_CODES', [])
        
        if not required_item_codes:
            return True, "No required items"
        
        menu_item_codes = set(item.food.item_code for item in menu.items)
        
        for required_code in required_item_codes:
            if required_code not in menu_item_codes:
                return False, f"Missing required item: {required_code}"
        
        return True, "All required items present"
    
    def validate_meal_specific_requirements(self, menu, meal_rules):
        """Validate meal-specific requirements including required food types"""
        if not meal_rules or not self.food_classifier:
            return True, "No meal-specific requirements"
        
        return meal_rules.validate_required_food_types(menu, self.food_classifier)
    
    def validate_meal_specific_requirements_database_based(self, menu, meal_type):
        """Validate meal-specific requirements using database-based logic instead of filter classes"""
        if not meal_type:
            return True, "No meal-specific requirements"
        
        # Define meal rules directly (copied from config but as local logic)
        meal_rules = {
            'breakfast': {
                'allowed_categories': ['חלב ביצים וסלטים', 'לחם ומאפים טריים', 'דבש, ריבה וממרחים', 'פירות וירקות', 'משקאות', 'קטניות ודגנים'],
                'forbidden_categories': ['בשר  ודגים', 'קפואים'],
                'required_types': ['protein']
            },
            'lunch': {
                'allowed_categories': ['בשר  ודגים', 'קטניות ודגנים', 'חלב ביצים וסלטים', 'פירות וירקות', 'שימורים בישול ואפיה'],
                'forbidden_categories': ['חטיפים ומתוקים'],
                'required_types': ['protein', 'fiber']
            },
            'dinner': {
                'allowed_categories': ['בשר  ודגים', 'קפואים', 'קטניות ודגנים', 'חלב ביצים וסלטים', 'שימורים בישול ואפיה'],
                'forbidden_categories': ['חטיפים ומתוקים'],
                'required_types': ['protein', 'fiber']
            },
            'snacks': {
                'allowed_categories': ['פירות וירקות', 'דגנים וחטיפי אנרגיה', 'חטיפים ומתוקים', 'חלב ביצים וסלטים', 'משקאות'],
                'forbidden_categories': [],
                'required_types': ['fiber']
            }
        }
        
        if meal_type not in meal_rules:
            return True, "Unknown meal type"
        
        rules = meal_rules[meal_type]
        menu_categories = [item.food.category for item in menu.items]
        
        # Check forbidden categories
        for category in menu_categories:
            if category in rules['forbidden_categories']:
                return False, f"Menu contains forbidden category for {meal_type}: {category}"
        
        # Check required nutritional types
        required_types = rules.get('required_types', [])
        if 'protein' in required_types:
            has_protein = any(item.food.nutrition_per_100g.protein >= 10 for item in menu.items)
            if not has_protein:
                return False, f"Menu lacks sufficient protein for {meal_type}"
        
        if 'fiber' in required_types:
            # Check for fiber-rich categories or high carb foods
            fiber_categories = ['פירות וירקות', 'דגנים וחטיפי אנרגיה', 'אורז וקטניות']
            has_fiber = any(item.food.category in fiber_categories or item.food.nutrition_per_100g.carbs >= 20 
                          for item in menu.items)
            if not has_fiber:
                return False, f"Menu lacks sufficient fiber sources for {meal_type}"
        
        return True, "Meal-specific requirements met"
    
    def is_menu_complete(self, menu, target_nutrition, meal_rules=None):
        """Comprehensive menu validation using old filter-based approach"""
        # Basic macro validation
        if not self.is_menu_valid(menu, target_nutrition):
            return False, "Failed macro validation"
        
        # Category requirements
        cat_valid, cat_msg = self.validate_category_requirements(menu)
        if not cat_valid:
            return False, f"Category validation failed: {cat_msg}"
        
        # Required items
        item_valid, item_msg = self.validate_required_items(menu)
        if not item_valid:
            return False, f"Required items validation failed: {item_msg}"
        
        # Meal-specific requirements (including required food types)
        if meal_rules:
            meal_valid, meal_msg = self.validate_meal_specific_requirements(menu, meal_rules)
            if not meal_valid:
                return False, f"Meal requirements validation failed: {meal_msg}"
        
        return True, "Menu validation passed"
    
    def is_menu_complete_database_based(self, menu, target_nutrition, meal_rules=None):
        """Comprehensive menu validation using database-based approach (no filter classes)"""
        # Basic macro validation
        if not self.is_menu_valid(menu, target_nutrition):
            return False, "Failed macro validation"
        
        # Required items validation (this doesn't depend on filters)
        item_valid, item_msg = self.validate_required_items(menu)
        if not item_valid:
            return False, f"Required items validation failed: {item_msg}"
        
        # Database-based meal-specific requirements
        if meal_rules and hasattr(meal_rules, 'meal_type'):
            meal_valid, meal_msg = self.validate_meal_specific_requirements_database_based(menu, meal_rules.meal_type)
            if not meal_valid:
                return False, f"Meal requirements validation failed: {meal_msg}"
        
        return True, "Menu validation passed (database-based)"