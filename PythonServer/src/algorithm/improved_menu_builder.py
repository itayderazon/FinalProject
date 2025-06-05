# src/algorithm/improved_menu_builder.py - Enhanced menu builder with better balance

import random
import math
from ..models import Menu, MenuItem

class ImprovedMenuBuilder:
    """Menu builder with better calorie distribution and balance"""
    
    def __init__(self, food_classifier, portion_calculator, config):
        self.food_classifier = food_classifier
        self.portion_calculator = portion_calculator
        self.config = config
    
    def build_menu(self, foods, target_nutrition, meal_type, num_items):
        """Build a menu with better calorie distribution"""
        menu = Menu()
        used_foods = set()
        
        # Calculate target calories per item (with some variance)
        base_calories_per_item = target_nutrition.calories / num_items
        
        # Phase 1: Add required items first
        remaining_nutrition = self._add_required_items(menu, foods, used_foods, target_nutrition)
        remaining_slots = num_items - len(menu.items)
        
        if remaining_slots <= 0:
            return menu
        
        # Phase 2: Build menu with balanced calorie distribution
        self._build_balanced_menu(menu, foods, used_foods, remaining_nutrition, remaining_slots, base_calories_per_item)
        
        return menu
    
    def _build_balanced_menu(self, menu, foods, used_foods, target_nutrition, num_items, base_calories_per_item):
        """Build menu with controlled calorie distribution per item"""
        from ..filters import BalanceFilter
        
        # Define calorie ranges for different food types
        calorie_ranges = {
            'protein': (base_calories_per_item * 0.8, base_calories_per_item * 1.4),
            'carbs': (base_calories_per_item * 0.6, base_calories_per_item * 1.2),
            'fat': (base_calories_per_item * 0.4, base_calories_per_item * 0.8),
            'vegetables': (base_calories_per_item * 0.2, base_calories_per_item * 0.6),
            'other': (base_calories_per_item * 0.5, base_calories_per_item * 1.0)
        }
        
        # Track macro allocation across items
        macro_allocation = {
            'protein_allocated': 0,
            'carbs_allocated': 0,
            'fat_allocated': 0
        }
        
        # Build menu item by item with calorie constraints
        for slot in range(num_items):
            # Calculate remaining nutrition needs
            current_nutrition = menu.get_total_nutrition()
            remaining_nutrition = self._subtract_nutrition(target_nutrition, current_nutrition)
            remaining_slots = num_items - len(menu.items)
            
            if remaining_slots <= 0:
                break
            
            # Get available foods with balance filtering
            available_foods = [f for f in foods if f.item_code not in used_foods]
            balance_filter = BalanceFilter(self.food_classifier, menu, target_nutrition, self.config)
            available_foods = balance_filter.filter(available_foods)
            
            if not available_foods:
                break
            
            # Select food with calorie distribution in mind
            selected_food = self._select_food_with_calorie_target(
                available_foods, 
                remaining_nutrition, 
                remaining_slots,
                base_calories_per_item,
                macro_allocation
            )
            
            if not selected_food:
                break
            
            # Calculate portion with calorie constraints
            portion = self._calculate_constrained_portion(
                selected_food, 
                remaining_nutrition, 
                remaining_slots,
                base_calories_per_item,
                calorie_ranges
            )
            
            # Add item to menu
            menu.add_item(MenuItem(selected_food, portion))
            used_foods.add(selected_food.item_code)
            
            # Update macro allocation tracking
            item_nutrition = selected_food.get_nutrition_for_portion(portion)
            self._update_macro_allocation(macro_allocation, item_nutrition, selected_food)
    
    def _select_food_with_calorie_target(self, foods, remaining_nutrition, remaining_slots, target_calories_per_item, macro_allocation):
        """Select food considering calorie distribution and macro needs"""
        if not foods:
            return None
        
        # Calculate macro needs
        remaining_protein_ratio = remaining_nutrition.protein / max(1, remaining_nutrition.calories) * 4
        remaining_carb_ratio = remaining_nutrition.carbs / max(1, remaining_nutrition.calories) * 4
        remaining_fat_ratio = remaining_nutrition.fat / max(1, remaining_nutrition.calories) * 9
        
        # Score foods based on multiple criteria
        scored_foods = []
        
        for food in foods:
            score = self._calculate_comprehensive_food_score(
                food, 
                remaining_nutrition, 
                remaining_slots,
                target_calories_per_item,
                remaining_protein_ratio,
                remaining_carb_ratio, 
                remaining_fat_ratio,
                macro_allocation
            )
            scored_foods.append((food, score))
        
        # Sort by score and add variety in selection
        scored_foods.sort(key=lambda x: x[1], reverse=True)
        
        # Select from top candidates with some randomness
        top_count = min(8, max(3, len(scored_foods) // 3))
        top_foods = [item[0] for item in scored_foods[:top_count]]
        
        return random.choice(top_foods)
    
    def _calculate_comprehensive_food_score(self, food, remaining_nutrition, remaining_slots, 
                                          target_calories_per_item, protein_ratio, carb_ratio, fat_ratio, macro_allocation):
        """Calculate comprehensive score for food selection"""
        food_nutrition = food.nutrition_per_100g
        
        # Base score from macro matching
        macro_score = self._calculate_macro_matching_score(
            food_nutrition, protein_ratio, carb_ratio, fat_ratio
        )
        
        # Calorie appropriateness score
        calorie_score = self._calculate_calorie_appropriateness_score(
            food_nutrition, target_calories_per_item
        )
        
        # Macro balance score (prevent over-allocation)
        balance_score = self._calculate_macro_balance_score(
            food, remaining_nutrition, macro_allocation
        )
        
        # Health score
        health_score = self.food_classifier.get_food_score(food) / 100.0
        
        # Combine scores
        total_score = (
            macro_score * 0.4 +
            calorie_score * 0.3 +
            balance_score * 0.2 +
            health_score * 0.1
        )
        
        return total_score
    
    def _calculate_macro_matching_score(self, food_nutrition, target_protein_ratio, target_carb_ratio, target_fat_ratio):
        """Score how well food matches needed macro ratios"""
        if food_nutrition.calories <= 0:
            return 0
        
        food_protein_ratio = food_nutrition.protein * 4 / food_nutrition.calories
        food_carb_ratio = food_nutrition.carbs * 4 / food_nutrition.calories
        food_fat_ratio = food_nutrition.fat * 9 / food_nutrition.calories
        
        # Calculate similarity (inverse of differences)
        protein_diff = abs(food_protein_ratio - target_protein_ratio)
        carb_diff = abs(food_carb_ratio - target_carb_ratio)
        fat_diff = abs(food_fat_ratio - target_fat_ratio)
        
        # Convert to score (lower difference = higher score)
        return 1.0 / (1.0 + protein_diff + carb_diff + fat_diff)
    
    def _calculate_calorie_appropriateness_score(self, food_nutrition, target_calories):
        """Score how appropriate food's calorie density is for target"""
        # Ideal calorie contribution should be within 50%-150% of target per item
        ideal_min = target_calories * 0.5
        ideal_max = target_calories * 1.5
        
        # Calculate what portion would give us target calories
        if food_nutrition.calories > 0:
            target_portion = (target_calories / food_nutrition.calories) * 100
        else:
            return 0
        
        # Apply portion limits to see realistic calories
        limited_portion = self.portion_calculator.apply_portion_limits(
            type('Food', (), {'subcategory': 'default'})(), target_portion
        )
        
        realistic_calories = food_nutrition.calories * (limited_portion / 100)
        
        # Score based on how close realistic calories are to ideal range
        if ideal_min <= realistic_calories <= ideal_max:
            return 1.0
        elif realistic_calories < ideal_min:
            return realistic_calories / ideal_min
        else:  # realistic_calories > ideal_max
            return ideal_max / realistic_calories
    
    def _calculate_macro_balance_score(self, food, remaining_nutrition, macro_allocation):
        """Prevent over-allocation of specific macros"""
        food_type = self.food_classifier.get_food_type(food)
        
        # Check if we've already allocated too much of this macro type
        total_protein_needed = remaining_nutrition.protein
        total_carbs_needed = remaining_nutrition.carbs
        total_fat_needed = remaining_nutrition.fat
        
        if total_protein_needed > 0:
            protein_saturation = macro_allocation['protein_allocated'] / total_protein_needed
        else:
            protein_saturation = 0
            
        if total_carbs_needed > 0:
            carb_saturation = macro_allocation['carbs_allocated'] / total_carbs_needed
        else:
            carb_saturation = 0
            
        if total_fat_needed > 0:
            fat_saturation = macro_allocation['fat_allocated'] / total_fat_needed
        else:
            fat_saturation = 0
        
        # Penalize foods that would over-saturate already high macros
        penalty = 0
        if food_type == 'protein' and protein_saturation > 0.7:
            penalty += 0.3
        elif food_type == 'fiber' and carb_saturation > 0.7:
            penalty += 0.3
        elif self.food_classifier.is_high_sugar(food) and fat_saturation > 0.7:
            penalty += 0.4
        
        return max(0, 1.0 - penalty)
    
    def _calculate_constrained_portion(self, food, remaining_nutrition, remaining_slots, 
                                     target_calories_per_item, calorie_ranges):
        """Calculate portion with calorie distribution constraints"""
        food_nutrition = food.nutrition_per_100g
        food_type = self.food_classifier.get_food_type(food)
        
        # Get calorie range for this food type
        if food_type in calorie_ranges:
            min_cal, max_cal = calorie_ranges[food_type]
        else:
            min_cal, max_cal = calorie_ranges['other']
        
        # Adjust range based on remaining needs
        avg_remaining_per_slot = remaining_nutrition.calories / max(1, remaining_slots)
        adjusted_max = min(max_cal, avg_remaining_per_slot * 1.5)
        adjusted_min = min(min_cal, avg_remaining_per_slot * 0.3)
        
        # Calculate portion to hit target calorie range
        if food_nutrition.calories > 0:
            # Target middle of the range
            target_calories = (adjusted_min + adjusted_max) / 2
            target_portion = (target_calories / food_nutrition.calories) * 100
        else:
            target_portion = 100
        
        # Apply food-specific adjustments
        if self.food_classifier.is_high_sugar(food):
            target_portion *= 0.7  # Reduce sugar portions
        elif self.food_classifier.is_protein_source(food):
            target_portion = max(target_portion, 80)  # Ensure minimum protein
        
        # Apply portion limits
        final_portion = self.portion_calculator.apply_portion_limits(food, target_portion)
        
        # Verify the portion gives reasonable calories
        final_calories = food_nutrition.calories * (final_portion / 100)
        
        # If final calories are way off, adjust within limits
        if final_calories > adjusted_max * 1.3:
            # Reduce to max allowed
            limits = self.portion_calculator.get_portion_limits(food)
            max_allowed_portion = min(limits['max'], (adjusted_max / food_nutrition.calories) * 100)
            final_portion = max(limits['min'], max_allowed_portion)
        
        return final_portion
    
    def _update_macro_allocation(self, macro_allocation, item_nutrition, food):
        """Update tracking of macro allocation"""
        if self.food_classifier.is_protein_source(food):
            macro_allocation['protein_allocated'] += item_nutrition.protein
        
        if self.food_classifier.is_fiber_source(food):
            macro_allocation['carbs_allocated'] += item_nutrition.carbs
            
        # Track fat from all sources
        macro_allocation['fat_allocated'] += item_nutrition.fat
    
    # Utility methods (same as original)
    def _add_required_items(self, menu, foods, used_foods, target_nutrition):
        """Add items specified in REQUIRED_ITEM_CODES"""
        required_item_codes = getattr(self.config, 'REQUIRED_ITEM_CODES', [])
        required_portions = getattr(self.config, 'REQUIRED_ITEM_PORTIONS', {})
        
        remaining_nutrition = target_nutrition
        
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
            # Calculate reasonable portion (15% of remaining calories to avoid domination)
            portion = min(200, max(50, remaining_nutrition.calories * 0.15 / food.nutrition_per_100g.calories * 100))
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