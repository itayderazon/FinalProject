# src/algorithm/menu_builder.py - Enhanced version with calorie distribution fix

import random
from ..models import Menu, MenuItem

class MenuBuilder:
    """Enhanced MenuBuilder with better calorie distribution"""
    
    def __init__(self, food_classifier, portion_calculator, config, food_provider=None):
        self.food_classifier = food_classifier
        self.portion_calculator = portion_calculator
        self.config = config
        self.food_provider = food_provider
    
    def build_menu(self, foods, target_nutrition, num_items, required_items_with_portions=None):
        """Build a single menu with improved calorie distribution"""
        MAX_CALORIE_VARIANCE = 1.3
        menu = Menu()
        used_foods = set()
        remaining_nutrition = target_nutrition
        
        # Calculate target calories per item for distribution control
        target_calories_per_item = target_nutrition.calories / num_items
        max_calories_per_item = target_calories_per_item * MAX_CALORIE_VARIANCE
        
        # Phase 1: Add required items if specified
        remaining_nutrition = self._add_required_items(menu, foods, used_foods, remaining_nutrition, max_calories_per_item, required_items_with_portions)

        
        # Phase 3: Add protein if needed (with calorie control)
        remaining_nutrition = self._add_protein_if_needed(menu, foods, used_foods, remaining_nutrition, num_items, max_calories_per_item)
        
        # Phase 4: Add carbs if needed (with calorie control)
        remaining_nutrition = self._add_carbs_if_needed(menu, foods, used_foods, remaining_nutrition, num_items, max_calories_per_item)
        
        # Phase 5: Fill remaining slots (with calorie control)
        self._fill_remaining_slots(menu, foods, used_foods, remaining_nutrition, target_nutrition, num_items, max_calories_per_item)
        
        return menu
    
    def _add_required_items(self, menu, foods, used_foods, remaining_nutrition, max_calories_per_item, required_items_with_portions):
        """Add items specified in required_items_with_portions with their exact portions"""
        # Use parameter instead of config
        if not required_items_with_portions:
            return remaining_nutrition
            
        print(f"🎯 Adding required items to menu: {required_items_with_portions}")
        
        for item_code, portion in required_items_with_portions.items():
            # Fetch required item directly from database instead of searching in filtered foods
            required_food = self._find_food_by_code_from_database(item_code)
            if required_food:
                # Use the exact portion provided from frontend
                menu.add_item(MenuItem(required_food, portion))
                used_foods.add(required_food.item_code)
                
                print(f"✅ Added required item: {required_food.name} ({portion}g) - USER SPECIFIED PORTION")
                
                # Update remaining nutrition
                item_nutrition = required_food.get_nutrition_for_portion(portion)
                remaining_nutrition = self._subtract_nutrition(remaining_nutrition, item_nutrition)
            else:
                print(f"⚠️ Required item {item_code} not found in database")
        
        return remaining_nutrition
    
    
    def _add_protein_if_needed(self, menu, foods, used_foods, remaining_nutrition, num_items, max_calories_per_item):
        """Add protein source with calorie control"""
        if not any(self.food_classifier.is_protein_source(item.food) for item in menu.items):
            protein_foods = [f for f in foods if f.item_code not in used_foods 
                           and self.food_classifier.is_protein_source(f)]
            
            if protein_foods:
                selected_protein = self._select_protein_food(protein_foods)
                # Use calorie-controlled portion calculation
                portion = self._calculate_controlled_portion(selected_protein, remaining_nutrition, max_calories_per_item, 'protein')
                
                menu.add_item(MenuItem(selected_protein, portion))
                used_foods.add(selected_protein.item_code)
                
                item_nutrition = selected_protein.get_nutrition_for_portion(portion)
                remaining_nutrition = self._subtract_nutrition(remaining_nutrition, item_nutrition)
        
        return remaining_nutrition
    
    def _add_carbs_if_needed(self, menu, foods, used_foods, remaining_nutrition, num_items, max_calories_per_item):
        """Add carb source with calorie control - improved to include staple carbs"""
        # Check if we already have carb sources in the menu
        has_carbs = any(f.nutrition_per_100g.carbs >= 20 for item in menu.items for f in [item.food])
        
        if not has_carbs and len(menu.items) < num_items:
            # Define carb-rich subcategories (staples + fiber sources)
            carb_subcategories = [
                'אורז וקטניות',  # Rice and legumes
                'פסטה, פתיתים, קוסקוס',  # Pasta, flakes, couscous  
                'לחם, פיתה, לחמניה',  # Bread, pita, rolls
                'דגנים וחטיפי אנרגיה',  # Grains and energy snacks
                'פיצות, מאפים ובצקים קפואים',  # Frozen pizzas and pastries
                'מוצרי אפיה',  # Baking products
            ]
            
            # Filter for carb foods (either from carb subcategories OR high carb content)
            carb_foods = [f for f in foods if f.item_code not in used_foods and (
                f.subcategory in carb_subcategories or  # Staple carb categories
                f.nutrition_per_100g.carbs >= 25  # High carb content foods
            )]
            
            print(f"🔍 Found {len(carb_foods)} potential carb foods")
            if carb_foods:
                # Debug: show subcategories available
                subcategories = set(f.subcategory for f in carb_foods)
                print(f"📋 Available carb subcategories: {', '.join(sorted(subcategories))}")
                
                selected_carb = self._select_carb_food(carb_foods)
                # Use calorie-controlled portion calculation
                portion = self._calculate_controlled_portion(selected_carb, remaining_nutrition, max_calories_per_item, 'carbs')
                
                menu.add_item(MenuItem(selected_carb, portion))
                used_foods.add(selected_carb.item_code)
                
                item_nutrition = selected_carb.get_nutrition_for_portion(portion)
                remaining_nutrition = self._subtract_nutrition(remaining_nutrition, item_nutrition)
        
        return remaining_nutrition
    
    def _fill_remaining_slots(self, menu, foods, used_foods, remaining_nutrition, target_nutrition, num_items, max_calories_per_item):
        """Fill remaining menu slots with calorie distribution control"""
        from ..filters import BalanceFilter
        
        while len(menu.items) < num_items and remaining_nutrition.calories > 50:
            # Get available foods with balance filtering
            available_foods = [f for f in foods if f.item_code not in used_foods]
            
            # Apply balance constraints
            balance_filter = BalanceFilter(self.food_classifier, menu, target_nutrition, self.config)
            available_foods = balance_filter.filter(available_foods)
            
            if not available_foods:
                break
            
            # Select food with flexible variety
            selected_food = self._select_balanced_food(available_foods, remaining_nutrition, menu)
            
            # Calculate remaining slots to distribute calories evenly
            remaining_slots = num_items - len(menu.items)
            
            # Use calorie-controlled portion calculation
            portion = self._calculate_distributed_portion(selected_food, remaining_nutrition, remaining_slots, max_calories_per_item)
            
            menu.add_item(MenuItem(selected_food, portion))
            used_foods.add(selected_food.item_code)
            
            item_nutrition = selected_food.get_nutrition_for_portion(portion)
            remaining_nutrition = self._subtract_nutrition(remaining_nutrition, item_nutrition)
    
    def _calculate_controlled_portion(self, food, remaining_nutrition, max_calories_per_item, food_type):
        """Calculate portion with calorie distribution control"""
        food_nutrition = food.nutrition_per_100g
        
        # Start with macro-based calculation
        if food_type == 'protein':
            base_portion = min(400, max(100, (remaining_nutrition.protein * 0.4) / food_nutrition.protein * 100))
        elif food_type == 'carbs':
            base_portion = min(300, max(50, remaining_nutrition.carbs / food_nutrition.carbs * 100))
        else:
            base_portion = 100
        
        # Apply calorie limit
        if food_nutrition.calories > 0:
            max_portion_for_calories = (max_calories_per_item / food_nutrition.calories) * 100
            base_portion = min(base_portion, max_portion_for_calories)
        
        return self.portion_calculator.apply_portion_limits(food, base_portion)
    
    def _calculate_distributed_portion(self, food, remaining_nutrition, remaining_slots, max_calories_per_item):
        """Calculate portion with even calorie distribution"""
        if remaining_slots <= 0:
            return self.portion_calculator.apply_portion_limits(food, 100)
        
        food_nutrition = food.nutrition_per_100g
        
        # Target calories for this slot
        target_calories_for_slot = remaining_nutrition.calories / remaining_slots
        
        # Don't exceed the maximum per item
        target_calories_for_slot = min(target_calories_for_slot, max_calories_per_item)
        
        # Calculate portion to hit target calories
        if food_nutrition.calories > 0:
            calorie_based_portion = (target_calories_for_slot / food_nutrition.calories) * 100
        else:
            calorie_based_portion = 100
        
        # Also consider macro needs for balance
        macro_portions = []
        
        if food_nutrition.fat > 0:
            fat_portion = (remaining_nutrition.fat / remaining_slots) / food_nutrition.fat * 100
            macro_portions.append(fat_portion * 2)  # Give fat extra weight to prevent excess
        
        if food_nutrition.protein > 0:
            protein_portion = (remaining_nutrition.protein / remaining_slots) / food_nutrition.protein * 100
            macro_portions.append(protein_portion)
        
        if food_nutrition.carbs > 0:
            carb_portion = (remaining_nutrition.carbs / remaining_slots) / food_nutrition.carbs * 100
            macro_portions.append(carb_portion)
        
        # Use the median of calorie-based and macro-based calculations
        all_portions = [calorie_based_portion] + macro_portions
        all_portions.sort()
        
        if len(all_portions) % 2 == 0:
            median_portion = (all_portions[len(all_portions)//2 - 1] + all_portions[len(all_portions)//2]) / 2
        else:
            median_portion = all_portions[len(all_portions)//2]
        
        # Apply limits
        final_portion = self.portion_calculator.apply_portion_limits(food, median_portion)
        
        # Final check: ensure we don't exceed calorie limit
        final_calories = food_nutrition.calories * (final_portion / 100)
        if final_calories > max_calories_per_item * 1.1:  # Small tolerance
            adjusted_portion = (max_calories_per_item / food_nutrition.calories) * 100
            final_portion = self.portion_calculator.apply_portion_limits(food, adjusted_portion)
        
        return final_portion
    
    def _get_required_portion_with_limit(self, food, item_code, required_portions, remaining_nutrition, max_calories_per_item):
        """Get portion for required item with calorie limit"""
        if item_code in required_portions:
            base_portion = required_portions[item_code]
        else:
            # Calculate reasonable portion (20% of remaining calories, reduced to prevent domination)
            base_portion = min(300, max(50, remaining_nutrition.calories * 0.20 / food.nutrition_per_100g.calories * 100))
        
        # Apply calorie limit
        if food.nutrition_per_100g.calories > 0:
            max_portion_for_calories = (max_calories_per_item / food.nutrition_per_100g.calories) * 100
            base_portion = min(base_portion, max_portion_for_calories)
        
        return self.portion_calculator.apply_portion_limits(food, base_portion)
    
    # Keep all the existing selection methods unchanged
    def _select_protein_food(self, protein_foods):
        """Select protein food with variety (flexible top 50%)"""
        protein_foods.sort(key=lambda f: (f.nutrition_per_100g.protein / max(1, f.nutrition_per_100g.fat), 
                                        f.nutrition_per_100g.protein), reverse=True)
        
        variety_count = max(10, len(protein_foods) // 2)
        top_proteins = protein_foods[:min(variety_count, len(protein_foods))]
        return random.choice(top_proteins)
    
    def _select_carb_food(self, carb_foods):
        """Select carb food with variety and preference for staple carbs"""
        if not carb_foods:
            return None
        
        # Define preferred carb subcategories (rice, pasta, bread)
        staple_carb_subcategories = [
            'אורז וקטניות',  # Rice and legumes
            'פסטה, פתיתים, קוסקוס',  # Pasta, flakes, couscous  
            'לחם, פיתה, לחמניה',  # Bread, pita, rolls
            'דגנים וחטיפי אנרגיה'  # Grains and energy snacks
        ]
        
        # Separate staple carbs from other carbs
        staple_carbs = [f for f in carb_foods if f.subcategory in staple_carb_subcategories]
        other_carbs = [f for f in carb_foods if f.subcategory not in staple_carb_subcategories]
        
        # 70% chance to pick from staple carbs if available
        if staple_carbs and random.random() < 0.7:
            print(f"🍚 Selecting from {len(staple_carbs)} staple carb options")
            selected_pool = staple_carbs
        else:
            print(f"🌾 Selecting from {len(carb_foods)} total carb options")
            selected_pool = carb_foods
        
        # Sort by carb content but not too strictly - allow for variety
        selected_pool.sort(key=lambda f: (
            f.nutrition_per_100g.carbs / max(1, f.nutrition_per_100g.fat),
            f.nutrition_per_100g.carbs
        ), reverse=True)
        
        # Take top 70% to ensure variety but avoid worst options
        variety_count = max(5, int(len(selected_pool) * 0.7))
        top_carbs = selected_pool[:variety_count]
        
        selected = random.choice(top_carbs)
        print(f"🎯 Selected carb: {selected.name} ({selected.subcategory})")
        return selected
    
    def _select_balanced_food(self, foods, remaining_nutrition, current_menu):
        """Select food based on macro needs with high variety"""
        if not foods:
            return None
        
        scored_foods = []
        for food in foods:
            score = self._calculate_food_macro_score(food, remaining_nutrition, current_menu)
            scored_foods.append((food, score))
        
        # Sort and select with high variety
        scored_foods.sort(key=lambda x: x[1], reverse=True)
        variety_count = max(15, len(scored_foods) // 2)
        top_candidates = scored_foods[:min(variety_count, len(scored_foods))]
        
        if len(top_candidates) <= 5:
            return random.choice([candidate[0] for candidate in top_candidates])
        else:
            # Mild preference for better foods but high randomness
            weights = [0.2 if i < 5 else 0.1 for i in range(len(top_candidates))]
            return random.choices([candidate[0] for candidate in top_candidates], weights=weights)[0]
    
    def _calculate_food_macro_score(self, food, remaining_nutrition, current_menu):
        """Score food based on how well it fits remaining macro needs"""
        remaining_cals = max(1, remaining_nutrition.calories)
        target_fat_ratio = remaining_nutrition.fat * 9 / remaining_cals
        target_protein_ratio = remaining_nutrition.protein * 4 / remaining_cals
        target_carb_ratio = remaining_nutrition.carbs * 4 / remaining_cals
        
        food_nutrition = food.nutrition_per_100g
        food_cals = max(1, food_nutrition.calories)
        food_fat_ratio = food_nutrition.fat * 9 / food_cals
        food_protein_ratio = food_nutrition.protein * 4 / food_cals
        food_carb_ratio = food_nutrition.carbs * 4 / food_cals
        
        # Calculate macro matching score
        fat_diff = abs(food_fat_ratio - target_fat_ratio)
        protein_diff = abs(food_protein_ratio - target_protein_ratio)
        carb_diff = abs(food_carb_ratio - target_carb_ratio)
        
        # Penalty for high-fat when fat target is low (reduced for variety)
        if target_fat_ratio < 0.3 and food_fat_ratio > 0.5:
            fat_diff *= 2
        
        macro_score = fat_diff + protein_diff + carb_diff
        
        # Add variety bonuses
        current_categories = set(item.food.category for item in current_menu.items)
        diversity_bonus = -0.2 if food.category not in current_categories else 0
        
        health_bonus = (100 - self.food_classifier.get_food_score(food)) / 1000
        
        return -(macro_score + health_bonus + diversity_bonus)  # Negative for higher is better
    #TODO: refactor this to use the food lookup service
    def _find_food_by_code(self, foods, item_code):
        """Find food by item code"""
        for food in foods:
            if food.item_code == item_code:
                return food
        return None
    
    def _find_food_by_code_from_database(self, item_code):
        """Find food by item code directly from database"""
        if not self.food_provider:
            print(f"❌ No food provider available to fetch item {item_code}")
            return None
        
        try:
            # Use the food provider to get the specific item by code
            foods = self.food_provider.get_foods_by_item_codes([item_code])
            if foods and len(foods) > 0:
                return foods[0]
            else:
                print(f"❌ Item {item_code} not found in database")
                return None
        except Exception as e:
            print(f"❌ Error fetching item {item_code} from database: {e}")
            return None
    
    def _subtract_nutrition(self, target, subtract):
        """Subtract nutrition values, ensuring no negatives"""
        from ..models import NutritionInfo
        return NutritionInfo(
            max(0, target.calories - subtract.calories),
            max(0, target.protein - subtract.protein), 
            max(0, target.carbs - subtract.carbs),
            max(0, target.fat - subtract.fat)
        )
    
    def _select_food_for_type(self, foods, food_type):
        """Select best food for a specific food type requirement"""
        if food_type == 'protein':
            return self._select_protein_food(foods)
        elif food_type == 'fiber':
            return self._select_carb_food(foods)
        else:
            # For other types, prefer wholesome and less processed options
            wholesome_foods = [f for f in foods if self.food_classifier.is_wholesome(f)]
            if wholesome_foods:
                return random.choice(wholesome_foods[:3])
            return random.choice(foods[:5])