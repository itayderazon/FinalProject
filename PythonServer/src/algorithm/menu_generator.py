# src/algorithm/menu_generator.py - Refactored main orchestrator with enhanced support

import random
from .menu_builder import MenuBuilder
from .enhanced_menu_builder import EnhancedMenuBuilder
from .menu_validator import MenuValidator
from .menu_scorer import MenuScorer
from .food_filter_service import FoodFilterService
from ..filters import NutritionalSoundnessFilter, CategoryPreferenceFilter
from config import Config

class MenuGenerator:
    """High-level orchestrator that coordinates menu generation (SRP + DIP)"""
    
    def __init__(self, food_provider, food_classifier, portion_calculator, meal_rules_factory, config=None, use_enhanced=False, user_id=None):
        # Dependency Injection - depends on abstractions
        self.food_provider = food_provider
        self.food_classifier = food_classifier
        self.portion_calculator = portion_calculator
        self.meal_rules_factory = meal_rules_factory
        self.use_enhanced = use_enhanced
        self.user_id = user_id
        
        if config is None:
            config = Config()
        self.config = config
        
        # Compose specialized services (Composition over inheritance)
        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize all specialized services"""
        # Filters
        nutritional_filter = NutritionalSoundnessFilter(self.config)
        preference_filter = CategoryPreferenceFilter(self.config)
        
        # Services following SRP
        self.filter_service = FoodFilterService(
            nutritional_filter, 
            preference_filter, 
            self.meal_rules_factory
        )
        
        # Choose menu builder based on configuration
        if self.use_enhanced:
            print("🚀 Using Enhanced Menu Builder with AI-like features")
            self.menu_builder = EnhancedMenuBuilder(
                self.food_classifier, 
                self.portion_calculator, 
                self.config,
                self.user_id
            )
        else:
            print("📊 Using Standard Menu Builder")
            self.menu_builder = MenuBuilder(
                self.food_classifier, 
                self.portion_calculator, 
                self.config
            )
        
        self.menu_validator = MenuValidator(
            self.config, 
            preference_filter
        )
        
        self.menu_scorer = MenuScorer(
            self.food_classifier, 
            self.config
        )
    
    def generate_menu(self, target_nutrition, meal_type=None, num_items=None, attempts=None, meal_context=None):
        """Generate multiple balanced menus (Main orchestration method)"""
        
        # Use config defaults if not specified
        if num_items is None:
            num_items = random.randint(self.config.DEFAULT_MIN_ITEMS, self.config.DEFAULT_MAX_ITEMS)
        if attempts is None:
            attempts = self.config.DEFAULT_ATTEMPTS
        
        print(f"Generating {meal_type or 'general'} menu...")
        print(f"Target: {target_nutrition.calories}cal, {target_nutrition.protein}g protein, {target_nutrition.carbs}g carbs, {target_nutrition.fat}g fat")
        
        # Get suitable foods using filtering service
        suitable_foods = self._get_suitable_foods(meal_type)
        if not suitable_foods:
            print(f"❌ No suitable foods found for meal type: {meal_type}")
            return None
        
        print(f"Starting generation with {len(suitable_foods)} suitable foods...")
        
        # Generate menus using the appropriate builder
        if self.use_enhanced:
            best_menus = self._generate_enhanced_menus(suitable_foods, target_nutrition, meal_type, num_items, meal_context)
        else:
            best_menus = self._generate_multiple_menus(suitable_foods, target_nutrition, meal_type, num_items, attempts)
        
        if best_menus:
            print(f"✅ Found {len(best_menus)} good menus")
            return best_menus
        else:
            print("❌ Failed to generate any valid menu")
            return None
    
    def _get_suitable_foods(self, meal_type):
        """Get filtered foods using filter service"""
        all_foods = self.food_provider.get_all_foods()
        if not all_foods:
            print("❌ No foods available from provider")
            return []
        
        return self.filter_service.get_suitable_foods(all_foods, meal_type)
    
    def _generate_enhanced_menus(self, suitable_foods, target_nutrition, meal_type, num_items, meal_context):
        """Generate menus using enhanced builder"""
        best_menus = []
        
        # Enhanced builder generates fewer attempts but higher quality
        for attempt in range(min(50, self.config.DEFAULT_ATTEMPTS // 6)):
            try:
                # Build enhanced menu
                menu = self.menu_builder.build_enhanced_menu(
                    suitable_foods, target_nutrition, meal_type, num_items, meal_context
                )
                
                if menu and len(menu.items) > 0:
                    # Validate menu
                    is_valid, validation_msg = self.menu_validator.is_menu_complete(menu, target_nutrition)
                    
                    if is_valid:
                        # Score menu
                        score = self.menu_scorer.score_menu(menu, target_nutrition)
                        
                        # Add to best menus
                        best_menus.append((menu, score))
                        
                        # Enhanced builder typically produces good results quickly
                        if len(best_menus) >= 3:  # Stop after 3 good menus
                            break
                            
                        print(f"✨ Enhanced menu #{len(best_menus)} generated (attempt {attempt + 1}, score: {score:.3f})")
                    else:
                        print(f"❌ Enhanced menu validation failed: {validation_msg}")
                        
            except Exception as e:
                print(f"⚠️ Enhanced menu generation error (attempt {attempt + 1}): {e}")
                continue
        
        # Sort by score and return best ones
        if best_menus:
            best_menus.sort(key=lambda x: x[1])
            return best_menus[:5]
        
        return None
    
    def _generate_multiple_menus(self, suitable_foods, target_nutrition, meal_type, num_items, attempts):
        """Generate multiple menu attempts using standard builder"""
        best_menus = []  # Store top 5 menus
        
        # Try multiple attempts
        for attempt in range(attempts):
            # Build menu using menu builder
            menu = self.menu_builder.build_menu(suitable_foods, target_nutrition, meal_type, num_items)
            
            if menu:
                # Validate menu using validator
                is_valid, validation_msg = self.menu_validator.is_menu_complete(menu, target_nutrition)
                
                if is_valid:
                    # Score menu using scorer
                    score = self.menu_scorer.score_menu(menu, target_nutrition)
                    
                    # Add to best menus list
                    best_menus.append((menu, score))
                    
                    # Keep only top 5, sorted by score (lower is better)
                    best_menus.sort(key=lambda x: x[1])
                    if len(best_menus) > 5:
                        best_menus = best_menus[:5]
                    
                    if len(best_menus) <= 5:
                        print(f"✨ Menu #{len(best_menus)} found (attempt {attempt + 1}, score: {score:.3f})")
        
        return best_menus if best_menus else None
    
    def record_user_feedback(self, menu, rating, meal_type=None):
        """Record user feedback (only works with enhanced builder)"""
        if self.use_enhanced and hasattr(self.menu_builder, 'record_user_feedback'):
            self.menu_builder.record_user_feedback(menu, rating, meal_type)
            return True
        else:
            print("📝 Feedback recording only available with enhanced builder")
            return False
    
    def calculate_menu_stats(self, menu):
        """Calculate menu statistics using scorer service"""
        stats = self.menu_scorer.calculate_menu_stats(menu)
        
        # Add enhanced stats if using enhanced builder
        if self.use_enhanced and hasattr(self.menu_builder, 'synergy_engine'):
            synergy_score = self.menu_builder.synergy_engine.calculate_menu_synergy_score(menu)
            stats['synergy_score'] = synergy_score
            stats['enhanced_features'] = True
        else:
            stats['enhanced_features'] = False
            
        return stats