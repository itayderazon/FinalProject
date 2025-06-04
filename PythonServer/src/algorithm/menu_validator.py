# src/algorithm/menu_validator.py - Menu validation logic

class MenuValidator:
    """Responsible ONLY for validating menus (SRP)"""
    
    def __init__(self, config, preference_filter=None):
        self.config = config
        self.preference_filter = preference_filter
    
    def is_menu_valid(self, menu, target_nutrition):
        """Check if menu meets basic macro requirements"""
        if not menu or len(menu.items) == 0:
            return False
        
        total_nutrition = menu.get_total_nutrition()
        
        # Check macro ratios with flexible ranges for variety
        cal_ratio = total_nutrition.calories / target_nutrition.calories
        protein_ratio = total_nutrition.protein / target_nutrition.protein
        carb_ratio = total_nutrition.carbs / target_nutrition.carbs
        fat_ratio = total_nutrition.fat / target_nutrition.fat
        
        # Very flexible ranges - allow 50% to 150% (±50%)
        if not (0.5 <= cal_ratio <= 1.5): return False
        if not (0.5 <= protein_ratio <= 1.5): return False  
        if not (0.5 <= carb_ratio <= 1.5): return False
        if not (0.5 <= fat_ratio <= 1.5): return False
        
        return True
    
    def validate_category_requirements(self, menu):
        """Check if menu meets category/subcategory requirements"""
        if not self.preference_filter:
            return True, "No category requirements"
        
        return self.preference_filter.validate_required_categories(menu)
    
    def validate_required_items(self, menu):
        """Check if menu contains all required item codes"""
        required_item_codes = getattr(self.config, 'REQUIRED_ITEM_CODES', [])
        
        if not required_item_codes:
            return True, "No required items"
        
        menu_item_codes = set(item.food.item_code for item in menu.items)
        
        for required_code in required_item_codes:
            if required_code not in menu_item_codes:
                return False, f"Missing required item: {required_code}"
        
        return True, "All required items present"
    
    def is_menu_complete(self, menu, target_nutrition):
        """Comprehensive menu validation"""
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
        
        return True, "Menu validation passed"