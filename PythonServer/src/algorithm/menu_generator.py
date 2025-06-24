# src/algorithm/menu_generator.py - Updated with category filtering

import random
from .menu_builder import MenuBuilder
from .menu_validator import MenuValidator
from .menu_scorer import MenuScorer
from .food_filter_service import DatabaseFoodFilterService
from config import Config

class MenuGenerator:
    """High-level orchestrator that coordinates menu generation (SRP + DIP)"""
    
    def __init__(self, food_provider, food_classifier, portion_calculator, meal_rules_factory, config=None):
        # Dependency Injection - depends on abstractions
        self.food_provider = food_provider
        self.food_classifier = food_classifier
        self.portion_calculator = portion_calculator
        self.meal_rules_factory = meal_rules_factory
        
        if config is None:
            config = Config()
        self.config = config
        
        # Compose specialized services (Composition over inheritance)
        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize all specialized services"""
        # Use DatabaseFoodFilterService instead of old filter classes
        self.filter_service = DatabaseFoodFilterService(
            self.food_provider,  # Pass the SQL food provider
            self.config
        )
        
        print("📊 Using Standard Menu Builder with SQL Food Provider")
        self.menu_builder = MenuBuilder(
            self.food_classifier, 
            self.portion_calculator, 
            self.config,
        )
        
        self.menu_validator = MenuValidator(
            self.config, 
            None,  # Remove preference_filter since we're using database filtering
            self.food_classifier
        )
        
        self.menu_scorer = MenuScorer(
            self.food_classifier, 
            self.config
        )
    
    def generate_menu(self, target_nutrition, subcategories=None, num_items=None, attempts=None):
        """Generate multiple balanced menus with subcategory filtering"""
        
        # Validate required inputs
        if num_items is None:
            raise ValueError("num_items is required - must be provided as input")
        if attempts is None:
            attempts = self.config.DEFAULT_ATTEMPTS
        
        if subcategories:
            print(f"Generating menu with subcategories: {subcategories}")
        else:
            print("Generating menu with all subcategories")
        
        print(f"Target: {target_nutrition.calories}cal, {target_nutrition.protein}g protein, {target_nutrition.carbs}g carbs, {target_nutrition.fat}g fat")
        
        # Get suitable foods using subcategory filtering
        suitable_foods = self._get_suitable_foods_by_subcategories(subcategories)
        if not suitable_foods:
            print(f"❌ No suitable foods found for subcategories: {subcategories}")
            return None
        
        print(f"Starting generation with {len(suitable_foods)} suitable foods...")
        
        # Generate menus (remove meal_type since we use subcategories now)
        best_menus = self._generate_multiple_menus(suitable_foods, target_nutrition, num_items, attempts)
        
        if best_menus:
            print(f"✅ Found {len(best_menus)} good menus")
            return best_menus
        else:
            print("❌ Failed to generate any valid menu")
            return None
    
    def _get_suitable_foods_by_subcategories(self, subcategories):
        """Get filtered foods using database filter service with subcategories"""
        print(f"Getting suitable foods for subcategories: {subcategories}")
        suitable_foods = self.filter_service.get_suitable_foods(subcategories=subcategories)
        return suitable_foods
    
    def _generate_multiple_menus(self, suitable_foods, target_nutrition, num_items, attempts):
        """Generate multiple menus (remove meal_type dependency)"""
        best_menus = []
        max_menus = 3
        
        for attempt in range(attempts):
            print(f"Attempt {attempt + 1}/{attempts}")
            
            # Generate menu (remove meal_type parameter)
            menu = self.menu_builder.build_menu(suitable_foods, target_nutrition, num_items)
            
            if menu and len(menu.items) > 0:
                # Basic validation (remove meal_rules parameter)
                is_valid, validation_msg = self.menu_validator.is_menu_complete(menu, target_nutrition)
                
                if is_valid:
                    score = self.menu_scorer.score_menu(menu, target_nutrition)
                    menu.validation_score = score
                    best_menus.append(menu)
                    
                    print(f"✅ Valid menu found (attempt {attempt + 1})")
                    
                    if len(best_menus) >= max_menus:
                        break
                else:
                    print(f"❌ Menu validation failed: {validation_msg}")
        
        best_menus.sort(key=lambda m: m.validation_score, reverse=False)
        return best_menus[:max_menus]
    
    def calculate_menu_stats(self, menu):
        """Calculate menu statistics using scorer service"""
        stats = self.menu_scorer.calculate_menu_stats(menu)
        return stats