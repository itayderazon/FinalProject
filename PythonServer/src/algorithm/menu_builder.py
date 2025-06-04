# src/algorithm/menu_builder.py - Core menu construction logic

import random
from ..models import Menu, MenuItem

class MenuBuilder:
    """Responsible ONLY for building individual menus (SRP)"""
    
    def __init__(self, food_classifier, portion_calculator, config):
        self.food_classifier = food_classifier
        self.portion_calculator = portion_calculator
        self.config = config
    
    def build_menu(self, foods, target_nutrition, meal_type, num_items):
        """Build a single menu with strategic food selection"""
        menu = Menu()
        used_foods = set()
        remaining_nutrition = target_nutrition
        
        # Phase 1: Add required items if specified
        remaining_nutrition = self._add_required_items(menu, foods, used_foods, remaining_nutrition)
        
        # Phase 2: Add protein if needed
        remaining_nutrition = self._add_protein_if_needed(menu, foods, used_foods, remaining_nutrition, num_items)
        
        # Phase 3: Add carbs if needed
        remaining_nutrition = self._add_carbs_if_needed(menu, foods, used_foods, remaining_nutrition, num_items)
        
        # Phase 4: Fill remaining slots
        self._fill_remaining_slots(menu, foods, used_foods, remaining_nutrition, target_nutrition, num_items)
        
        return menu
    
    def _add_required_items(self, menu, foods, used_foods, remaining_nutrition):
        """Add items specified in REQUIRED_ITEM_CODES"""
        required_item_codes = getattr(self.config, 'REQUIRED_ITEM_CODES', [])
        required_portions = getattr(self.config, 'REQUIRED_ITEM_PORTIONS', {})
        
        for item_code in required_item_codes:
            required_food = self._find_food_by_code(foods, item_code)
            if required_food:
                portion = self._get_required_portion(required_food, item_code, required_portions, remaining_nutrition)
                
                menu.add_item(MenuItem(required_food, portion))
                used_foods.add(required_food.item_code)
                
                # Update remaining nutrition
                item_nutrition = required_food.get_nutrition_for_portion(portion)
                remaining_nutrition = self._subtract_nutrition(remaining_nutrition, item_nutrition)
        
        return remaining_nutrition
    
    def _add_protein_if_needed(self, menu, foods, used_foods, remaining_nutrition, num_items):
        """Add protein source if not already present"""
        if not any(self.food_classifier.is_protein_source(item.food) for item in menu.items):
            protein_foods = [f for f in foods if f.item_code not in used_foods 
                           and self.food_classifier.is_protein_source(f)]
            
            if protein_foods:
                selected_protein = self._select_protein_food(protein_foods)
                portion = self._calculate_protein_portion(selected_protein, remaining_nutrition)
                
                menu.add_item(MenuItem(selected_protein, portion))
                used_foods.add(selected_protein.item_code)
                
                item_nutrition = selected_protein.get_nutrition_for_portion(portion)
                remaining_nutrition = self._subtract_nutrition(remaining_nutrition, item_nutrition)
        
        return remaining_nutrition
    
    def _add_carbs_if_needed(self, menu, foods, used_foods, remaining_nutrition, num_items):
        """Add carb source if not already present"""
        if not any(self.food_classifier.is_fiber_source(item.food) for item in menu.items):
            carb_foods = [f for f in foods if f.item_code not in used_foods 
                         and self.food_classifier.is_fiber_source(f)]
            
            if carb_foods and len(menu.items) < num_items:
                selected_carb = self._select_carb_food(carb_foods)
                portion = self._calculate_carb_portion(selected_carb, remaining_nutrition)
                
                menu.add_item(MenuItem(selected_carb, portion))
                used_foods.add(selected_carb.item_code)
                
                item_nutrition = selected_carb.get_nutrition_for_portion(portion)
                remaining_nutrition = self._subtract_nutrition(remaining_nutrition, item_nutrition)
        
        return remaining_nutrition
    
    def _fill_remaining_slots(self, menu, foods, used_foods, remaining_nutrition, target_nutrition, num_items):
        """Fill remaining menu slots with balanced foods"""
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
            portion = self._calculate_balanced_portion(selected_food, remaining_nutrition, num_items - len(menu.items))
            
            menu.add_item(MenuItem(selected_food, portion))
            used_foods.add(selected_food.item_code)
            
            item_nutrition = selected_food.get_nutrition_for_portion(portion)
            remaining_nutrition = self._subtract_nutrition(remaining_nutrition, item_nutrition)
    
    def _select_protein_food(self, protein_foods):
        """Select protein food with variety (flexible top 50%)"""
        protein_foods.sort(key=lambda f: (f.nutrition_per_100g.protein / max(1, f.nutrition_per_100g.fat), 
                                        f.nutrition_per_100g.protein), reverse=True)
        
        variety_count = max(10, len(protein_foods) // 2)
        top_proteins = protein_foods[:min(variety_count, len(protein_foods))]
        return random.choice(top_proteins)
    
    def _select_carb_food(self, carb_foods):
        """Select carb food with variety (flexible top 50%)"""
        carb_foods.sort(key=lambda f: (f.nutrition_per_100g.carbs / max(1, f.nutrition_per_100g.fat),
                                     f.nutrition_per_100g.carbs), reverse=True)
        
        variety_count = max(10, len(carb_foods) // 2)
        top_carbs = carb_foods[:min(variety_count, len(carb_foods))]
        return random.choice(top_carbs)
    
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
    
    def _calculate_protein_portion(self, food, remaining_nutrition):
        """Calculate portion for protein foods"""
        protein_portion = min(400, max(100, (remaining_nutrition.protein * 0.4) / food.nutrition_per_100g.protein * 100))
        return self.portion_calculator.apply_portion_limits(food, protein_portion)
    
    def _calculate_carb_portion(self, food, remaining_nutrition):
        """Calculate portion for carb foods"""
        carb_portion = min(300, max(50, remaining_nutrition.carbs / food.nutrition_per_100g.carbs * 100))
        return self.portion_calculator.apply_portion_limits(food, carb_portion)
    
    def _calculate_balanced_portion(self, food, remaining_nutrition, remaining_slots):
        """Calculate portion using multi-macro approach"""
        if remaining_slots <= 0:
            return self.portion_calculator.apply_portion_limits(food, 100)
        
        food_nutrition = food.nutrition_per_100g
        portions = []
        
        # Calculate portions based on each macro
        if food_nutrition.calories > 0:
            cal_portion = (remaining_nutrition.calories / remaining_slots) / food_nutrition.calories * 100
            portions.append(cal_portion)
        
        if food_nutrition.fat > 0:
            fat_portion = (remaining_nutrition.fat / remaining_slots) / food_nutrition.fat * 100
            portions.append(fat_portion)
            portions.append(fat_portion)  # Give fat extra weight
        
        if food_nutrition.protein > 0:
            protein_portion = (remaining_nutrition.protein / remaining_slots) / food_nutrition.protein * 100
            portions.append(protein_portion)
        
        if food_nutrition.carbs > 0:
            carb_portion = (remaining_nutrition.carbs / remaining_slots) / food_nutrition.carbs * 100
            portions.append(carb_portion)
        
        # Use median to avoid extremes
        if portions:
            portions.sort()
            if len(portions) % 2 == 0:
                median_portion = (portions[len(portions)//2 - 1] + portions[len(portions)//2]) / 2
            else:
                median_portion = portions[len(portions)//2]
        else:
            median_portion = 100
        
        portion = self.portion_calculator.apply_portion_limits(food, median_portion)
        
        # Extra fat control for high-fat foods
        if food_nutrition.fat > 15:
            fat_addition = food_nutrition.fat * portion / 100
            if fat_addition > remaining_nutrition.fat:
                adjusted_portion = (remaining_nutrition.fat / food_nutrition.fat) * 100
                portion = min(portion, adjusted_portion)
                portion = self.portion_calculator.apply_portion_limits(food, portion)
        
        return portion
    
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
    
    def _find_food_by_code(self, foods, item_code):
        """Find food by item code"""
        for food in foods:
            if food.item_code == item_code:
                return food
        return None
    
    def _get_required_portion(self, food, item_code, required_portions, remaining_nutrition):
        """Get portion for required item"""
        if item_code in required_portions:
            return required_portions[item_code]
        else:
            # Calculate reasonable portion (25% of remaining calories)
            portion = min(300, max(50, remaining_nutrition.calories * 0.25 / food.nutrition_per_100g.calories * 100))
            return self.portion_calculator.apply_portion_limits(food, portion)
    
    def _subtract_nutrition(self, target, subtract):
        """Subtract nutrition values, ensuring no negatives"""
        from ..models import NutritionInfo
        return NutritionInfo(
            max(0, target.calories - subtract.calories),
            max(0, target.protein - subtract.protein), 
            max(0, target.carbs - subtract.carbs),
            max(0, target.fat - subtract.fat)
        )