# src/algorithm/menu_generator.py 

import random
from .menu_builder import MenuBuilder
from .menu_validator import MenuValidator
from .menu_scorer import MenuScorer
from .food_filter_service import DatabaseFoodFilterService
from config import Config

class MenuGenerator:
    """High-level orchestrator that coordinates menu generation (SRP + DIP)"""
    
    def __init__(self, food_provider, food_classifier, portion_calculator, meal_rules_factory, config=None, price_comparison=None):
        # Dependency Injection - depends on abstractions
        self.food_provider = food_provider
        self.food_classifier = food_classifier
        self.portion_calculator = portion_calculator
        self.meal_rules_factory = meal_rules_factory
        
        if config is None:
            config = Config()
        self.config = config
        self.price_comparison = price_comparison
        
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
            self.food_provider  # Pass food provider for direct database access
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
    
    def generate_menu(self, target_nutrition, subcategories=None, num_items=None, attempts=None, required_items_with_portions=None, excluded_allergens=None, min_price=None, max_price=None):
        """Generate multiple balanced menus with subcategory and allergen filtering"""
        
        # Build info strings with a tiny helper (readability only)
        filter_info = self._build_filter_info(subcategories, excluded_allergens)
        # Validate required inputs
        if num_items is None:
            raise ValueError("num_items is required - must be provided as input")
        if attempts is None:
            attempts = self.config.DEFAULT_ATTEMPTS
        
        # Debug: Check what required items are provided
        if required_items_with_portions:
            print(f"🎯 Required items with portions provided: {required_items_with_portions}")
        else:
            print("📝 No required items provided")
        
        # Debug: Check filtering parameters (already built above)
        
        if filter_info:
            print(f"Generating menu with {' and '.join(filter_info)}")
        else:
            print("Generating menu with no specific filters")
        
        self._log_menu_target(target_nutrition)
        
        # Get suitable foods using subcategory and allergen filtering
        suitable_foods = self._get_suitable_foods_by_filters(subcategories, excluded_allergens)
        if not suitable_foods:
            filter_desc = []
            if subcategories:
                filter_desc.append(f"subcategories: {subcategories}")
            if excluded_allergens:
                filter_desc.append(f"excluded allergens: {excluded_allergens}")
            
            print(f"❌ No suitable foods found for {' and '.join(filter_desc) if filter_desc else 'specified filters'}")
            # Check if we have required items and return them as fallback
            return self._create_required_items_fallback_menu(target_nutrition, required_items_with_portions)
        
        print(f"Starting generation with {len(suitable_foods)} suitable foods...")
        
        # Generate menus (remove meal_type since we use subcategories now)
        best_menus = self._generate_multiple_menus(
            suitable_foods,
            target_nutrition,
            num_items,
            attempts,
            required_items_with_portions,
            min_price=min_price,
            max_price=max_price
        )
        
        if best_menus:
            print(f"✅ Found {len(best_menus)} good menus")
            return best_menus
        else:
            print("❌ Failed to generate any valid menu")
            # Fallback: create menu with just required items if they exist
            fallback_menu = self._create_required_items_fallback_menu(target_nutrition, required_items_with_portions)
            if fallback_menu:
                print("✅ Created fallback menu with required items only")
                return fallback_menu
            return None
    
    def _get_suitable_foods_by_filters(self, subcategories, excluded_allergens):
        """Get filtered foods using database filter service with subcategories and allergens"""
        filter_desc = []
        if subcategories:
            filter_desc.append(f"subcategories: {subcategories}")
        if excluded_allergens:
            filter_desc.append(f"excluded allergens: {excluded_allergens}")
        
        print(f"Getting suitable foods for {' and '.join(filter_desc) if filter_desc else 'no specific filters'}")
        suitable_foods = self.filter_service.get_suitable_foods(
            subcategories=subcategories, 
            excluded_allergens=excluded_allergens
        )
        return suitable_foods
    
    def _generate_multiple_menus(self, suitable_foods, target_nutrition, num_items, attempts, required_items_with_portions, min_price=None, max_price=None):
        """Generate multiple menus with fallback to best option if validation fails"""
        best_menus = []
        best_invalid_menu = None
        best_invalid_score = float('inf')
        max_menus = 3
        
        for attempt in range(attempts):
            self._log_attempt(attempt, attempts)
            
            # Generate menu (remove meal_type parameter)
            menu = self.menu_builder.build_menu(suitable_foods, target_nutrition, num_items, required_items_with_portions)
            
            if menu and len(menu.items) > 0:
                # Calculate score for all menus (valid or not)
                score = self.menu_scorer.score_menu(menu, target_nutrition)
                menu.validation_score = score
                
                # Basic validation - pass required_items for validation
                is_valid, validation_msg = self._validate_menu_with_required_items(menu, target_nutrition, required_items_with_portions)
                
                if is_valid:
                    # Optional price-range validation inside algorithm
                    if (min_price is not None or max_price is not None) and self.price_comparison is not None:
                        if not self._is_menu_in_price_range(menu, min_price, max_price):
                            print("❌ Menu failed price range validation")
                            continue
                    menu.is_fallback = False  # Mark as normal menu
                    best_menus.append(menu)
                    print(f"✅ Valid menu found (attempt {attempt + 1})")
                    
                    if len(best_menus) >= max_menus:
                        break
                else:
                    print(f"❌ Menu validation failed: {validation_msg}")
                    # Track the best invalid menu as fallback option
                    if score < best_invalid_score:
                        best_invalid_score = score
                        best_invalid_menu = menu
                        best_invalid_menu.is_fallback = True
                        best_invalid_menu.fallback_reason = validation_msg
                        print(f"📝 New best invalid menu (score: {score:.3f})")
        
        # If we found valid menus, return them
        if best_menus:
            best_menus.sort(key=lambda m: m.validation_score, reverse=False)
            return best_menus[:max_menus]
        
        # If no valid menus but we have a best invalid one, return it
        if best_invalid_menu:
            print(f"⚠️ Returning best invalid menu as fallback (score: {best_invalid_score:.3f})")
            print(f"⚠️ Fallback reason: {best_invalid_menu.fallback_reason}")
            return [best_invalid_menu]
        
        return []

    def _extract_menu_items_for_price(self, menu):
        """Extract simple items list for price comparison service."""
        items = []
        for item in menu.items:
            try:
                items.append({
                    'item_code': str(getattr(item.food, 'item_code', '')),
                    'portion_grams': float(getattr(item, 'portion_grams', 0)),
                    'name': getattr(item.food, 'name', 'Item')
                })
            except Exception:
                continue
        return items

    def _is_menu_in_price_range(self, menu, min_price, max_price):
        """Check if the menu's cheapest total cost fits within the price range."""
        try:
            menu_items = self._extract_menu_items_for_price(menu)
            if not menu_items:
                return False
            price_data = self.price_comparison.compare_menu_prices(menu_items)
            if not isinstance(price_data, dict):
                return False
            cheapest = None
            if isinstance(price_data.get('cheapest_total'), (int, float)):
                cheapest = price_data['cheapest_total']
            else:
                st = price_data.get('supermarket_totals') or {}
                costs = []
                for v in st.values():
                    if isinstance(v, (int, float)):
                        costs.append(v)
                    elif isinstance(v, dict) and isinstance(v.get('total_cost'), (int, float)):
                        costs.append(v['total_cost'])
                if costs:
                    cheapest = min(costs)
            if cheapest is None:
                return False
            if min_price is not None and cheapest < float(min_price):
                return False
            if max_price is not None and cheapest > float(max_price):
                return False
            return True
        except Exception as e:
            print(f"Price range validation failed with error: {e}")
            return False
    
    def _validate_menu_with_required_items(self, menu, target_nutrition, required_items_with_portions):
        """Validate menu including required items check"""
        # Basic macro validation
        if not self.menu_validator.is_menu_valid(menu, target_nutrition):
            return False, "Failed macro validation"
        
        # Required items validation with parameter
        item_valid, item_msg = self.menu_validator.validate_required_items(menu, required_items_with_portions)
        if not item_valid:
            return False, f"Required items validation failed: {item_msg}"
        
        return True, "Menu validation passed"
    
    def calculate_menu_stats(self, menu):
        """Calculate menu statistics using scorer service"""
        stats = self.menu_scorer.calculate_menu_stats(menu)
        return stats
        
    def _create_required_items_fallback_menu(self, target_nutrition, required_items_with_portions):
        """Create a fallback menu containing only required items when full menu generation fails"""
        if not required_items_with_portions:
            print("No required items to include in fallback menu")
            return None
        
        print(f"Creating fallback menu with required items: {required_items_with_portions}")
        
        from ..models import Menu, MenuItem
        fallback_menu = Menu()
        
        required_portions = getattr(self.config, 'REQUIRED_ITEM_PORTIONS', {})
        
        for item_code, portion in required_items_with_portions.items():
            # Use the menu builder's database method to fetch the item
            required_food = self.menu_builder._find_food_by_code_from_database(item_code)
            if required_food:
                # Use the exact portion specified by the user
                fallback_menu.add_item(MenuItem(required_food, portion))
                print(f"Added required item: {required_food.name} ({portion}g) - USER SPECIFIED PORTION")
            else:
                print(f"⚠️ Required item {item_code} not found in database")
        
        if len(fallback_menu.items) > 0:
            # Score the fallback menu but mark it as fallback
            fallback_menu.validation_score = 999  # High score to indicate it's a fallback
            fallback_menu.is_fallback = True
            fallback_menu.fallback_reason = "Required items only - full menu generation failed"
            return [fallback_menu]
        
        return None

    def _build_filter_info(self, subcategories, excluded_allergens):
        info = []
        if subcategories:
            info.append(f"subcategories: {subcategories}")
        if excluded_allergens:
            info.append(f"excluded allergens: {excluded_allergens}")
        return info

    def _log_menu_target(self, target_nutrition):
        print(
            f"Target: {target_nutrition.calories}cal, {target_nutrition.protein}g protein, {target_nutrition.carbs}g carbs, {target_nutrition.fat}g fat"
        )

    def _log_attempt(self, attempt_index, total_attempts):
        print(f"Attempt {attempt_index + 1}/{total_attempts}")
