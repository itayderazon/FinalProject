# src/algorithm/smart_portion_optimizer.py - Advanced portion calculation

import math
from collections import defaultdict

class SmartPortionOptimizer:
    """Advanced portion size optimization using nutritional density and satiety factors"""
    
    def __init__(self, food_classifier, config):
        self.food_classifier = food_classifier
        self.config = config
        self.satiety_index = self._initialize_satiety_index()
        self.nutritional_density_weights = self._initialize_density_weights()
        self.digestive_factors = self._initialize_digestive_factors()
    
    def _initialize_satiety_index(self):
        """Initialize satiety index for different food types"""
        return {
            'protein_dense': 3.5,    # High protein foods are very satiating
            'fiber_rich': 3.0,       # High fiber foods promote satiety
            'whole_grains': 2.8,     # Complex carbs provide sustained satiety
            'healthy_fats': 2.5,     # Fats provide satiety but calorie-dense
            'fruits_vegetables': 2.2, # High volume, low calorie
            'processed_carbs': 1.5,  # Low satiety, quick energy
            'sugary_foods': 1.0,     # Lowest satiety index
            'liquids': 0.8           # Liquids generally less satiating
        }
    
    def _initialize_density_weights(self):
        """Initialize nutritional density scoring weights"""
        return {
            'protein_per_calorie': 4.0,
            'fiber_per_calorie': 3.0,
            'micronutrient_density': 2.5,
            'healthy_fat_ratio': 2.0,
            'natural_vs_processed': 3.5,
            'sodium_penalty': -2.0,
            'sugar_penalty': -1.5
        }
    
    def _initialize_digestive_factors(self):
        """Initialize digestive and absorption factors"""
        return {
            'optimal_meal_volume': (400, 800),  # ml - optimal stomach capacity
            'protein_absorption_limit': 35,     # grams per meal
            'fat_digestion_optimal': (15, 25),  # grams range for optimal digestion
            'fiber_comfort_limit': 15,          # grams to avoid digestive discomfort
            'meal_duration_factor': 1.2         # Account for eating duration
        }
    
    def calculate_optimal_portions(self, menu_foods, target_nutrition, meal_context=None):
        """Calculate optimal portion sizes for a complete menu"""
        if not menu_foods:
            return {}
        
        # Analyze food characteristics
        food_analysis = self._analyze_foods(menu_foods)
        
        # Calculate base portions using nutritional targets
        base_portions = self._calculate_base_portions(menu_foods, target_nutrition)
        
        # Apply optimization adjustments
        optimized_portions = self._apply_optimization_factors(
            menu_foods, base_portions, food_analysis, target_nutrition, meal_context
        )
        
        # Ensure digestive comfort and balance
        final_portions = self._ensure_digestive_balance(
            menu_foods, optimized_portions, target_nutrition
        )
        
        return final_portions
    
    def _analyze_foods(self, foods):
        """Analyze food characteristics for optimization"""
        analysis = {}
        
        for food in foods:
            analysis[food.item_code] = {
                'satiety_score': self._calculate_satiety_score(food),
                'nutritional_density': self._calculate_nutritional_density(food),
                'digestive_load': self._calculate_digestive_load(food),
                'macro_profile': self._analyze_macro_profile(food),
                'volume_density': self._estimate_volume_density(food),
                'absorption_rate': self._estimate_absorption_rate(food)
            }
        
        return analysis
    
    def _calculate_satiety_score(self, food):
        """Calculate satiety score for a food"""
        base_score = 2.0  # Default
        nutrition = food.nutrition_per_100g
        
        # Protein factor (most important for satiety)
        if nutrition.protein > 20:
            base_score += 1.5
        elif nutrition.protein > 10:
            base_score += 1.0
        elif nutrition.protein > 5:
            base_score += 0.5
        
        # Fiber factor
        if hasattr(nutrition, 'fiber'):
            if nutrition.fiber > 8:
                base_score += 1.2
            elif nutrition.fiber > 4:
                base_score += 0.8
            elif nutrition.fiber > 2:
                base_score += 0.4
        elif self.food_classifier.is_fiber_source(food):
            base_score += 0.8  # Estimated fiber benefit
        
        # Fat factor (moderate satiety)
        if nutrition.fat > 15:
            base_score += 0.8
        elif nutrition.fat > 8:
            base_score += 0.5
        
        # Volume factor (low calorie density = higher satiety)
        calorie_density = nutrition.calories / 100
        if calorie_density < 150:
            base_score += 1.0
        elif calorie_density < 250:
            base_score += 0.5
        elif calorie_density > 400:
            base_score -= 0.5
        
        # Processing penalty
        if self.food_classifier.is_processed(food):
            base_score -= 0.8
        
        # Sugar penalty
        if self.food_classifier.is_high_sugar(food):
            base_score -= 1.2
        
        return max(0.5, min(5.0, base_score))
    
    def _calculate_nutritional_density(self, food):
        """Calculate nutritional density score"""
        nutrition = food.nutrition_per_100g
        if nutrition.calories <= 0:
            return 0.0
        
        density_score = 0.0
        
        # Protein density
        protein_density = nutrition.protein * 4 / nutrition.calories
        density_score += protein_density * self.nutritional_density_weights['protein_per_calorie']
        
        # Fiber density (estimated)
        if self.food_classifier.is_fiber_source(food):
            estimated_fiber = min(10, nutrition.carbs * 0.3)  # Rough estimate
            fiber_density = estimated_fiber * 4 / nutrition.calories
            density_score += fiber_density * self.nutritional_density_weights['fiber_per_calorie']
        
        # Healthy fat ratio
        if nutrition.fat > 0:
            fat_ratio = nutrition.fat * 9 / nutrition.calories
            if 0.2 <= fat_ratio <= 0.35:  # Healthy fat range
                density_score += self.nutritional_density_weights['healthy_fat_ratio']
        
        # Natural vs processed
        if self.food_classifier.is_wholesome(food):
            density_score += self.nutritional_density_weights['natural_vs_processed']
        elif self.food_classifier.is_processed(food):
            density_score += self.nutritional_density_weights['natural_vs_processed'] * 0.3
        
        # Penalties
        if nutrition.sodium > 500:
            sodium_penalty = (nutrition.sodium - 500) / 1000
            density_score += sodium_penalty * self.nutritional_density_weights['sodium_penalty']
        
        if self.food_classifier.is_high_sugar(food):
            density_score += self.nutritional_density_weights['sugar_penalty']
        
        return max(0.0, density_score)
    
    def _calculate_digestive_load(self, food):
        """Calculate digestive complexity/load"""
        nutrition = food.nutrition_per_100g
        load = 1.0  # Base load
        
        # Protein increases digestive work
        load += nutrition.protein * 0.02
        
        # Fat slows digestion
        load += nutrition.fat * 0.03
        
        # Fiber requires more digestive work but is beneficial
        if self.food_classifier.is_fiber_source(food):
            load += 0.3
        
        # Processing reduces digestive work (but not necessarily good)
        if self.food_classifier.is_processed(food):
            load *= 0.8
        
        # Raw foods require more digestive work
        if 'טרי' in food.subcategory or 'פירות' in food.category:
            load += 0.2
        
        return load
    
    def _analyze_macro_profile(self, food):
        """Analyze macronutrient profile"""
        nutrition = food.nutrition_per_100g
        total_cals = max(1, nutrition.calories)
        
        return {
            'protein_ratio': (nutrition.protein * 4) / total_cals,
            'carb_ratio': (nutrition.carbs * 4) / total_cals,
            'fat_ratio': (nutrition.fat * 9) / total_cals,
            'primary_macro': self._get_primary_macro(nutrition),
            'macro_balance': self._calculate_macro_balance(nutrition)
        }
    
    def _get_primary_macro(self, nutrition):
        """Determine primary macronutrient"""
        total_cals = max(1, nutrition.calories)
        protein_cals = nutrition.protein * 4
        carb_cals = nutrition.carbs * 4
        fat_cals = nutrition.fat * 9
        
        if protein_cals > carb_cals and protein_cals > fat_cals:
            return 'protein'
        elif fat_cals > carb_cals:
            return 'fat'
        else:
            return 'carbs'
    
    def _calculate_macro_balance(self, nutrition):
        """Calculate how balanced the macros are"""
        total_cals = max(1, nutrition.calories)
        ratios = [
            (nutrition.protein * 4) / total_cals,
            (nutrition.carbs * 4) / total_cals,
            (nutrition.fat * 9) / total_cals
        ]
        
        # Calculate standard deviation (lower = more balanced)
        mean_ratio = sum(ratios) / 3
        variance = sum((r - mean_ratio) ** 2 for r in ratios) / 3
        return math.sqrt(variance)
    
    def _estimate_volume_density(self, food):
        """Estimate volume per 100g (ml/100g)"""
        # Rough estimates based on food type
        if 'משקאות' in food.category:
            return 100  # Liquids
        elif 'פירות' in food.category:
            return 85   # High water content
        elif 'ירקות' in food.category:
            return 80   # High water content
        elif 'חלב' in food.category:
            return 95   # Mostly liquid
        elif 'לחם' in food.category:
            return 65   # Dense but airy
        elif 'בשר' in food.category:
            return 70   # Dense
        elif 'אגוזים' in food.subcategory:
            return 45   # Very dense
        else:
            return 60   # Default estimate
    
    def _estimate_absorption_rate(self, food):
        """Estimate absorption rate (fast/medium/slow)"""
        if self.food_classifier.is_high_sugar(food):
            return 'fast'
        elif self.food_classifier.is_protein_source(food):
            return 'medium'
        elif self.food_classifier.is_fiber_source(food):
            return 'slow'
        elif 'משקאות' in food.category:
            return 'fast'
        else:
            return 'medium'
    
    def _calculate_base_portions(self, foods, target_nutrition):
        """Calculate base portion sizes using macro targets"""
        portions = {}
        
        # Calculate total macro density
        total_density = {
            'calories': sum(f.nutrition_per_100g.calories for f in foods),
            'protein': sum(f.nutrition_per_100g.protein for f in foods),
            'carbs': sum(f.nutrition_per_100g.carbs for f in foods),
            'fat': sum(f.nutrition_per_100g.fat for f in foods)
        }
        
        if total_density['calories'] == 0:
            return {food.item_code: 100 for food in foods}
        
        # Calculate base portions proportionally
        for food in foods:
            nutrition = food.nutrition_per_100g
            
            # Weight by calorie contribution
            calorie_weight = nutrition.calories / total_density['calories']
            target_calories = target_nutrition.calories * calorie_weight
            
            if nutrition.calories > 0:
                base_portion = (target_calories / nutrition.calories) * 100
            else:
                base_portion = 100
            
            # Apply portion limits
            min_portion = self.config.PORTION_LIMITS.get(food.category, {}).get('min', 50)
            max_portion = self.config.PORTION_LIMITS.get(food.category, {}).get('max', 300)
            
            portions[food.item_code] = max(min_portion, min(max_portion, base_portion))
        
        return portions
    
    def _apply_optimization_factors(self, foods, base_portions, food_analysis, target_nutrition, meal_context):
        """Apply optimization factors to base portions"""
        optimized_portions = base_portions.copy()
        
        for food in foods:
            food_code = food.item_code
            analysis = food_analysis[food_code]
            current_portion = optimized_portions[food_code]
            
            # Satiety adjustment
            satiety_factor = self._calculate_satiety_adjustment(analysis['satiety_score'])
            
            # Nutritional density adjustment
            density_factor = self._calculate_density_adjustment(analysis['nutritional_density'])
            
            # Digestive load adjustment
            digestive_factor = self._calculate_digestive_adjustment(analysis['digestive_load'])
            
            # Meal context adjustment
            context_factor = self._calculate_context_adjustment(food, meal_context)
            
            # Apply all factors
            total_factor = satiety_factor * density_factor * digestive_factor * context_factor
            optimized_portion = current_portion * total_factor
            
            # Ensure reasonable bounds
            min_portion = self.config.PORTION_LIMITS.get(food.category, {}).get('min', 50)
            max_portion = self.config.PORTION_LIMITS.get(food.category, {}).get('max', 500)
            
            optimized_portions[food_code] = max(min_portion, min(max_portion, optimized_portion))
        
        return optimized_portions
    
    def _calculate_satiety_adjustment(self, satiety_score):
        """Calculate portion adjustment based on satiety"""
        # Higher satiety = smaller portion needed
        normalized_score = (satiety_score - 1.0) / 4.0  # Normalize to 0-1
        return 1.0 - (normalized_score * 0.3)  # Reduce portion by up to 30%
    
    def _calculate_density_adjustment(self, density_score):
        """Calculate portion adjustment based on nutritional density"""
        # Higher density = smaller portion needed
        if density_score > 5.0:
            return 0.8
        elif density_score > 3.0:
            return 0.9
        elif density_score < 1.0:
            return 1.2
        else:
            return 1.0
    
    def _calculate_digestive_adjustment(self, digestive_load):
        """Calculate portion adjustment based on digestive load"""
        # Higher load = smaller portion for comfort
        if digestive_load > 2.0:
            return 0.85
        elif digestive_load > 1.5:
            return 0.95
        elif digestive_load < 1.0:
            return 1.1
        else:
            return 1.0
    
    def _calculate_context_adjustment(self, food, meal_context):
        """Calculate portion adjustment based on meal context"""
        if not meal_context:
            return 1.0
        
        factor = 1.0
        
        # Meal type adjustments
        meal_type = meal_context.get('meal_type')
        if meal_type == 'breakfast':
            if self.food_classifier.is_protein_source(food):
                factor *= 1.1  # More protein for breakfast
        elif meal_type == 'dinner':
            if self.food_classifier.is_fiber_source(food):
                factor *= 1.2  # More fiber for dinner
        
        # Time of day adjustments
        hour = meal_context.get('hour', 12)
        if hour < 10:  # Morning
            if 'פירות' in food.category:
                factor *= 1.1
        elif hour > 18:  # Evening
            if self.food_classifier.is_high_sugar(food):
                factor *= 0.8  # Less sugar in evening
        
        return factor
    
    def _ensure_digestive_balance(self, foods, portions, target_nutrition):
        """Ensure final portions promote digestive comfort"""
        food_portions = {food.item_code: portions[food.item_code] for food in foods}
        
        # Calculate total nutrition with current portions
        total_nutrition = self._calculate_total_nutrition(foods, food_portions)
        
        # Check protein limit
        if total_nutrition['protein'] > self.digestive_factors['protein_absorption_limit']:
            protein_foods = [f for f in foods if self.food_classifier.is_protein_source(f)]
            for food in protein_foods:
                reduction_factor = self.digestive_factors['protein_absorption_limit'] / total_nutrition['protein']
                food_portions[food.item_code] *= reduction_factor
        
        # Check fat comfort range
        fat_range = self.digestive_factors['fat_digestion_optimal']
        if total_nutrition['fat'] > fat_range[1]:
            fat_foods = [f for f in foods if f.nutrition_per_100g.fat > 5]
            for food in fat_foods:
                reduction_factor = fat_range[1] / total_nutrition['fat']
                food_portions[food.item_code] *= reduction_factor
        
        # Ensure minimum portions
        for food in foods:
            min_portion = self.config.PORTION_LIMITS.get(food.category, {}).get('min', 50)
            food_portions[food.item_code] = max(min_portion, food_portions[food.item_code])
        
        return food_portions
    
    def _calculate_total_nutrition(self, foods, portions):
        """Calculate total nutrition for given portions"""
        total = {'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0}
        
        for food in foods:
            portion = portions[food.item_code]
            nutrition = food.nutrition_per_100g
            multiplier = portion / 100
            
            total['calories'] += nutrition.calories * multiplier
            total['protein'] += nutrition.protein * multiplier
            total['carbs'] += nutrition.carbs * multiplier
            total['fat'] += nutrition.fat * multiplier
        
        return total 