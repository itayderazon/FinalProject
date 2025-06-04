# src/algorithm/enhanced_menu_builder.py - Next-generation menu builder with learning

import random
import math
import json
import os
from datetime import datetime
from typing import List, Dict, Optional, Tuple, Any
from ..models import Menu, MenuItem, NutritionInfo
from .menu_builder import MenuBuilder

class PreferenceEngine:
    """Learns and adapts to user preferences"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.preferences_file = f"user_preferences_{user_id}.json"
        self.preferences = self._load_preferences()
    
    def _load_preferences(self) -> Dict:
        """Load user preferences from file"""
        if os.path.exists(self.preferences_file):
            try:
                with open(self.preferences_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        
        return {
            'food_scores': {},  # individual food ratings
            'category_preferences': {},  # category preferences  
            'meal_preferences': {},  # meal-type preferences
            'rejection_list': [],  # foods to avoid
            'successful_combinations': [],  # good food pairings
            'total_ratings': 0,
            'avg_rating': 3.0
        }
    
    def _save_preferences(self):
        """Save preferences to file"""
        try:
            with open(self.preferences_file, 'w') as f:
                json.dump(self.preferences, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save preferences: {e}")
    
    def record_feedback(self, menu: Menu, rating: int, meal_type: str = None):
        """Record user feedback on a menu"""
        # Update overall stats
        self.preferences['total_ratings'] += 1
        total = self.preferences['total_ratings']
        current_avg = self.preferences['avg_rating']
        self.preferences['avg_rating'] = ((current_avg * (total - 1)) + rating) / total
        
        # Update individual food scores
        for item in menu.items:
            food_name = item.food.name
            if food_name not in self.preferences['food_scores']:
                self.preferences['food_scores'][food_name] = {'total': 0, 'count': 0}
            
            self.preferences['food_scores'][food_name]['total'] += rating
            self.preferences['food_scores'][food_name]['count'] += 1
            
            # Update category preferences
            category = item.food.category
            if category not in self.preferences['category_preferences']:
                self.preferences['category_preferences'][category] = {'total': 0, 'count': 0}
            
            self.preferences['category_preferences'][category]['total'] += rating
            self.preferences['category_preferences'][category]['count'] += 1
        
        # Update meal-type preferences
        if meal_type:
            if meal_type not in self.preferences['meal_preferences']:
                self.preferences['meal_preferences'][meal_type] = {'total': 0, 'count': 0}
            
            self.preferences['meal_preferences'][meal_type]['total'] += rating
            self.preferences['meal_preferences'][meal_type]['count'] += 1
        
        # Track rejections and successes
        if rating <= 2:
            # Add foods to rejection consideration
            for item in menu.items:
                food_name = item.food.name
                if food_name not in self.preferences['rejection_list']:
                    # Only add to rejection if consistently rated poorly
                    food_score = self.get_food_score(food_name)
                    if food_score < 2.5:
                        self.preferences['rejection_list'].append(food_name)
        
        elif rating >= 4:
            # Track successful combinations
            food_names = [item.food.name for item in menu.items]
            if len(food_names) > 1:
                combination = sorted(food_names)
                if combination not in self.preferences['successful_combinations']:
                    self.preferences['successful_combinations'].append(combination)
        
        self._save_preferences()
    
    def get_food_score(self, food_name: str) -> float:
        """Get preference score for a specific food"""
        if food_name in self.preferences['food_scores']:
            scores = self.preferences['food_scores'][food_name]
            return scores['total'] / scores['count']
        return self.preferences['avg_rating']  # Default to user's average
    
    def get_category_score(self, category: str) -> float:
        """Get preference score for a food category"""
        if category in self.preferences['category_preferences']:
            scores = self.preferences['category_preferences'][category]
            return scores['total'] / scores['count']
        return self.preferences['avg_rating']
    
    def is_rejected(self, food_name: str) -> bool:
        """Check if food is in rejection list"""
        return food_name in self.preferences['rejection_list']
    
    def get_successful_combinations(self) -> List[List[str]]:
        """Get list of successful food combinations"""
        return self.preferences['successful_combinations']


class SynergyEngine:
    """Optimizes food combinations for nutritional synergy"""
    
    # Nutritional synergy rules based on science
    SYNERGY_RULES = {
        # Protein complementarity (complete amino acid profiles)
        'protein_complementarity': {
            ('legumes', 'grains'): 1.3,  # Rice + beans = complete protein
            ('legumes', 'nuts'): 1.2,    # Nuts + legumes
            ('grains', 'dairy'): 1.1,    # Cereal + milk
        },
        
        # Vitamin/mineral absorption synergies
        'absorption_synergy': {
            ('iron_rich', 'vitamin_c'): 1.4,      # Iron + Vitamin C = better absorption
            ('fat_soluble_vitamins', 'healthy_fats'): 1.3,  # Vitamins A,D,E,K + fats
            ('calcium', 'vitamin_d'): 1.2,        # Calcium + Vitamin D
            ('beta_carotene', 'healthy_fats'): 1.2,  # Carotenoids + fats
        },
        
        # Digestive synergies
        'digestive_synergy': {
            ('fiber', 'probiotics'): 1.2,         # Fiber + fermented foods
            ('antioxidants', 'anti_inflammatory'): 1.15,  # Antioxidant combinations
        }
    }
    
    # Anti-synergies (foods that don't work well together)
    ANTI_SYNERGY_RULES = {
        ('high_calcium', 'high_iron'): 0.8,       # Calcium blocks iron absorption
        ('caffeine', 'iron_rich'): 0.9,           # Caffeine reduces iron absorption
        ('high_fiber', 'high_fat'): 0.9,          # Too much fiber + fat = digestive issues
    }
    
    # Food classifications for synergy calculation
    FOOD_CLASSIFICATIONS = {
        'iron_rich': ['beef', 'spinach', 'lentils', 'quinoa', 'tofu'],
        'vitamin_c': ['oranges', 'strawberries', 'bell_peppers', 'broccoli', 'tomatoes'],
        'healthy_fats': ['avocado', 'olive_oil', 'nuts', 'seeds', 'salmon'],
        'fat_soluble_vitamins': ['leafy_greens', 'carrots', 'sweet_potato', 'fish'],
        'legumes': ['beans', 'lentils', 'chickpeas', 'peas'],
        'grains': ['rice', 'quinoa', 'oats', 'bread'],
        'dairy': ['milk', 'yogurt', 'cheese'],
        'nuts': ['almonds', 'walnuts', 'cashews'],
        'fiber': ['beans', 'oats', 'apples', 'broccoli'],
        'probiotics': ['yogurt', 'kefir', 'sauerkraut'],
        'antioxidants': ['berries', 'dark_chocolate', 'green_tea'],
        'anti_inflammatory': ['turmeric', 'ginger', 'fatty_fish']
    }
    
    def calculate_menu_synergy_score(self, menu: Menu) -> float:
        """Calculate overall synergy score for a menu"""
        foods = [item.food for item in menu.items]
        total_synergy = 1.0
        combinations_found = 0
        
        # Check all food pairs for synergies
        for i, food1 in enumerate(foods):
            for j, food2 in enumerate(foods[i+1:], i+1):
                synergy_factor = self._calculate_food_pair_synergy(food1, food2)
                if synergy_factor != 1.0:
                    total_synergy *= synergy_factor
                    combinations_found += 1
        
        # Normalize based on number of combinations
        if combinations_found > 0:
            return total_synergy ** (1.0 / combinations_found)
        
        return 1.0
    
    def _calculate_food_pair_synergy(self, food1, food2) -> float:
        """Calculate synergy factor between two foods"""
        synergy_score = 1.0
        
        # Get food classifications
        food1_classes = self._get_food_classes(food1.name.lower())
        food2_classes = self._get_food_classes(food2.name.lower())
        
        # Check positive synergies
        for rule_type, rules in self.SYNERGY_RULES.items():
            for (class1, class2), factor in rules.items():
                if ((class1 in food1_classes and class2 in food2_classes) or
                    (class2 in food1_classes and class1 in food2_classes)):
                    synergy_score *= factor
        
        # Check anti-synergies
        for (class1, class2), factor in self.ANTI_SYNERGY_RULES.items():
            if ((class1 in food1_classes and class2 in food2_classes) or
                (class2 in food1_classes and class1 in food2_classes)):
                synergy_score *= factor
        
        return synergy_score
    
    def _get_food_classes(self, food_name: str) -> List[str]:
        """Get all classifications for a food"""
        classes = []
        for class_name, foods in self.FOOD_CLASSIFICATIONS.items():
            if any(food.lower() in food_name for food in foods):
                classes.append(class_name)
        return classes
    
    def suggest_menu_improvements(self, menu: Menu, available_foods) -> List[Dict]:
        """Suggest improvements to increase synergy"""
        suggestions = []
        current_synergy = self.calculate_menu_synergy_score(menu)
        
        # Try replacing each food item
        for i, item in enumerate(menu.items):
            best_replacement = None
            best_synergy = current_synergy
            
            for food in available_foods[:20]:  # Limit for performance
                if food.name == item.food.name:
                    continue
                
                # Create test menu with replacement
                test_menu = Menu(menu.items[:i] + [MenuItem(food, item.portion)] + menu.items[i+1:])
                test_synergy = self.calculate_menu_synergy_score(test_menu)
                
                if test_synergy > best_synergy:
                    best_synergy = test_synergy
                    best_replacement = food
            
            if best_replacement:
                improvement = (best_synergy - current_synergy) / current_synergy * 100
                suggestions.append({
                    'replace': item.food.name,
                    'with': best_replacement.name,
                    'improvement': f"{improvement:.1f}%"
                })
        
        return sorted(suggestions, key=lambda x: float(x['improvement'].rstrip('%')), reverse=True)


class SmartPortionOptimizer:
    """Advanced portion optimization using nutritional science"""
    
    # Satiety factors (how filling foods are per calorie)
    SATIETY_FACTORS = {
        'protein': 1.0,      # Baseline
        'fiber': 0.8,        # Very filling
        'fat': 0.3,          # Less filling per calorie
        'refined_carbs': 0.2, # Least filling
        'complex_carbs': 0.6  # Moderately filling
    }
    
    # Nutritional density scores (nutrients per calorie)
    DENSITY_SCORES = {
        'vegetables': 1.0,
        'fruits': 0.8,
        'lean_proteins': 0.9,
        'whole_grains': 0.7,
        'nuts_seeds': 0.6,
        'dairy': 0.5,
        'processed': 0.2
    }
    
    def __init__(self, config):
        self.config = config
    
    def optimize_portions(self, foods_with_portions: List[Tuple], target_nutrition: NutritionInfo, meal_context: Dict = None) -> List[Tuple]:
        """Optimize portions for better satiety and nutrition"""
        optimized = []
        
        for food, base_portion in foods_with_portions:
            # Calculate base factors
            satiety_factor = self._calculate_satiety_factor(food)
            density_score = self._calculate_density_score(food)
            
            # Apply meal context adjustments
            context_multiplier = self._get_context_multiplier(food, meal_context)
            
            # Optimize portion
            optimized_portion = base_portion * satiety_factor * context_multiplier
            
            # Apply digestive limits
            optimized_portion = self._apply_digestive_limits(food, optimized_portion)
            
            optimized.append((food, optimized_portion))
        
        return optimized
    
    def _calculate_satiety_factor(self, food) -> float:
        """Calculate how filling a food is"""
        # This is simplified - would use actual nutritional data in practice
        if hasattr(food, 'protein') and food.protein > 15:  # High protein
            return 1.2
        elif hasattr(food, 'fiber') and food.fiber > 5:  # High fiber
            return 1.1
        elif 'vegetable' in food.category.lower():
            return 1.15
        elif 'fruit' in food.category.lower():
            return 1.05
        else:
            return 1.0
    
    def _calculate_density_score(self, food) -> float:
        """Calculate nutritional density"""
        category = food.category.lower()
        if 'vegetable' in category:
            return 1.0
        elif 'fruit' in category:
            return 0.9
        elif 'protein' in category:
            return 0.95
        elif 'grain' in category:
            return 0.8
        else:
            return 0.7
    
    def _get_context_multiplier(self, food, meal_context: Dict) -> float:
        """Adjust portions based on meal context"""
        if not meal_context:
            return 1.0
        
        multiplier = 1.0
        
        # Time of day adjustments
        hour = meal_context.get('hour', 12)
        if hour < 10:  # Breakfast - lighter portions
            multiplier *= 0.9
        elif hour > 18:  # Dinner - moderate portions
            multiplier *= 0.95
        
        # Meal type adjustments
        meal_type = meal_context.get('meal_type')
        if meal_type == 'snacks':
            multiplier *= 0.6
        elif meal_type == 'breakfast':
            multiplier *= 0.8
        
        return multiplier
    
    def _apply_digestive_limits(self, food, portion: float) -> float:
        """Apply digestive comfort limits"""
        # Protein absorption limit (~40g per meal)
        if hasattr(food, 'protein'):
            protein_per_100g = getattr(food, 'protein', 0)
            if protein_per_100g > 0:
                max_portion_for_protein = 4000 / protein_per_100g  # 40g protein max
                portion = min(portion, max_portion_for_protein)
        
        # Fat digestion limit (~30g per meal) 
        if hasattr(food, 'fat'):
            fat_per_100g = getattr(food, 'fat', 0)
            if fat_per_100g > 0:
                max_portion_for_fat = 3000 / fat_per_100g  # 30g fat max
                portion = min(portion, max_portion_for_fat)
        
        # Volume/weight limits (max ~800g total per meal)
        portion = min(portion, 400)  # Max 400g per food item
        
        return max(portion, 50)  # Minimum viable portion


class EnhancedMenuBuilder(MenuBuilder):
    """Enhanced menu builder with learning and optimization"""
    
    def __init__(self, food_classifier, portion_calculator, config, user_id="default"):
        super().__init__(food_classifier, portion_calculator, config)
        self.user_id = user_id
        
        # Initialize advanced engines
        self.preference_engine = PreferenceEngine(user_id)
        self.synergy_engine = SynergyEngine()
        self.portion_optimizer = SmartPortionOptimizer(config)
        
        print(f"🧠 Enhanced Menu Builder initialized for user: {user_id}")
    
    def build_enhanced_menu(self, suitable_foods: List, target_nutrition: NutritionInfo, 
                          meal_type: str = None, num_items: int = None, meal_context: Dict = None) -> Menu:
        """Build menu using enhanced algorithms"""
        
        if num_items is None:
            num_items = random.randint(self.config.DEFAULT_MIN_ITEMS, self.config.DEFAULT_MAX_ITEMS)
        
        # Phase 1: Enhanced food selection with preference scoring
        scored_foods = self._score_foods_with_preferences(suitable_foods, meal_type)
        
        # Phase 2: Smart menu generation with synergy optimization
        menu = self._generate_synergy_optimized_menu(scored_foods, target_nutrition, num_items, meal_context)
        
        if menu:
            # Phase 3: Portion optimization
            menu = self._optimize_menu_portions(menu, target_nutrition, meal_context)
            
            # Phase 4: Synergy-based improvements
            menu = self._apply_synergy_improvements(menu, scored_foods)
        
        return menu
    
    def _score_foods_with_preferences(self, foods: List, meal_type: str) -> List[Tuple]:
        """Score foods using multiple factors including user preferences"""
        scored_foods = []
        
        for food in foods:
            # Base nutritional score (from parent class)
            base_score = self._calculate_food_score(food, self.target_macros if hasattr(self, 'target_macros') else None)
            
            # Preference score
            preference_score = self.preference_engine.get_food_score(food.name)
            category_score = self.preference_engine.get_category_score(food.category)
            
            # Check rejection list
            if self.preference_engine.is_rejected(food.name):
                continue  # Skip rejected foods
            
            # Health score (nutritional density)
            health_score = self._calculate_health_score(food)
            
            # Diversity bonus (encourage variety)
            diversity_score = self._calculate_diversity_score(food)
            
            # Combined score with weights
            final_score = (
                base_score * 0.3 +           # Macro fit
                preference_score * 0.25 +     # User preference
                category_score * 0.15 +       # Category preference  
                health_score * 0.2 +          # Nutritional quality
                diversity_score * 0.1         # Variety encouragement
            )
            
            scored_foods.append((food, final_score))
        
        # Sort by score (higher is better)
        scored_foods.sort(key=lambda x: x[1], reverse=True)
        return scored_foods
    
    def _calculate_health_score(self, food) -> float:
        """Calculate nutritional quality score"""
        score = 3.0  # Base score
        
        # Bonus for high protein
        if hasattr(food, 'protein') and food.protein > 15:
            score += 0.5
        
        # Bonus for fiber
        if hasattr(food, 'fiber') and food.fiber > 5:
            score += 0.3
        
        # Bonus for vitamins/minerals (simplified)
        if 'vegetable' in food.category.lower() or 'fruit' in food.category.lower():
            score += 0.4
        
        # Penalty for processed foods
        if 'processed' in food.category.lower() or 'snack' in food.category.lower():
            score -= 0.3
        
        return max(score, 1.0)
    
    def _calculate_diversity_score(self, food) -> float:
        """Encourage dietary diversity"""
        # This would track recently used foods in practice
        # For now, give slight bonus to less common categories
        uncommon_categories = ['seeds', 'herbs', 'spices', 'fermented']
        if any(cat in food.category.lower() for cat in uncommon_categories):
            return 4.0
        return 3.0
    
    def _generate_synergy_optimized_menu(self, scored_foods: List[Tuple], target_nutrition: NutritionInfo, 
                                       num_items: int, meal_context: Dict) -> Menu:
        """Generate menu optimized for food synergies"""
        
        menu_items = []
        remaining_nutrition = NutritionInfo(
            target_nutrition.calories,
            target_nutrition.protein, 
            target_nutrition.carbs,
            target_nutrition.fat
        )
        
        # Start with highest scoring foods
        for food, score in scored_foods[:num_items * 3]:  # Consider top candidates
            if len(menu_items) >= num_items:
                break
            
            # Calculate needed portion
            portion = self.portion_calculator.calculate_portion(food, remaining_nutrition, len(menu_items))
            
            if portion > 0:
                # Check if adding this food improves synergy
                test_item = MenuItem(food, portion)
                test_menu = Menu(menu_items + [test_item])
                
                if len(menu_items) == 0:
                    # Always add first food
                    synergy_improvement = True
                else:
                    # Check synergy improvement
                    current_synergy = self.synergy_engine.calculate_menu_synergy_score(Menu(menu_items))
                    new_synergy = self.synergy_engine.calculate_menu_synergy_score(test_menu)
                    synergy_improvement = new_synergy >= current_synergy * 0.95  # Allow small decreases
                
                if synergy_improvement:
                    menu_items.append(test_item)
                    
                    # Update remaining nutrition
                    item_nutrition = test_item.get_nutrition()
                    remaining_nutrition.calories -= item_nutrition.calories
                    remaining_nutrition.protein -= item_nutrition.protein
                    remaining_nutrition.carbs -= item_nutrition.carbs
                    remaining_nutrition.fat -= item_nutrition.fat
        
        return Menu(menu_items) if menu_items else None
    
    def _optimize_menu_portions(self, menu: Menu, target_nutrition: NutritionInfo, meal_context: Dict) -> Menu:
        """Optimize portions using smart portion calculator"""
        
        # Extract foods and portions
        foods_with_portions = [(item.food, item.portion) for item in menu.items]
        
        # Optimize
        optimized = self.portion_optimizer.optimize_portions(foods_with_portions, target_nutrition, meal_context)
        
        # Create new menu with optimized portions
        optimized_items = [MenuItem(food, portion) for food, portion in optimized]
        return Menu(optimized_items)
    
    def _apply_synergy_improvements(self, menu: Menu, available_foods: List[Tuple]) -> Menu:
        """Apply synergy-based improvements"""
        
        # Get improvement suggestions
        improvements = self.synergy_engine.suggest_menu_improvements(menu, [food for food, _ in available_foods[:50]])
        
        # Apply top improvement if significant
        if improvements and len(improvements) > 0:
            top_improvement = improvements[0]
            improvement_pct = float(top_improvement['improvement'].rstrip('%'))
            
            if improvement_pct > 5:  # Only apply if >5% improvement
                # Find and replace the food
                for i, item in enumerate(menu.items):
                    if item.food.name == top_improvement['replace']:
                        # Find replacement food
                        for food, _ in available_foods:
                            if food.name == top_improvement['with']:
                                menu.items[i] = MenuItem(food, item.portion)
                                print(f"🔄 Synergy improvement: Replaced {top_improvement['replace']} with {top_improvement['with']} (+{improvement_pct:.1f}%)")
                                break
                        break
        
        return menu
    
    def record_user_feedback(self, menu: Menu, rating: int, meal_type: str = None):
        """Record user feedback for learning"""
        self.preference_engine.record_feedback(menu, rating, meal_type)
        print(f"📝 Recorded feedback: Rating {rating}/5 for {meal_type or 'general'} menu")
    
    def get_user_preferences_summary(self) -> Dict:
        """Get summary of learned preferences"""
        prefs = self.preference_engine.preferences
        
        # Top liked foods
        top_foods = []
        for food, scores in prefs['food_scores'].items():
            avg_score = scores['total'] / scores['count']
            if scores['count'] >= 2 and avg_score >= 4:  # Well-rated foods
                top_foods.append((food, avg_score))
        
        top_foods.sort(key=lambda x: x[1], reverse=True)
        
        # Top categories
        top_categories = []
        for category, scores in prefs['category_preferences'].items():
            avg_score = scores['total'] / scores['count']
            if scores['count'] >= 3:
                top_categories.append((category, avg_score))
        
        top_categories.sort(key=lambda x: x[1], reverse=True)
        
        return {
            'total_ratings': prefs['total_ratings'],
            'average_rating': prefs['avg_rating'],
            'top_liked_foods': top_foods[:5],
            'top_categories': top_categories[:5],
            'rejected_foods': prefs['rejection_list'],
            'successful_combinations': len(prefs['successful_combinations'])
        } 