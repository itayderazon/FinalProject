# src/services/food_classifier.py - Enhanced hybrid food classification

from config import Config

class FoodClassifier:
    """Enhanced food classifier with hybrid nutrition + category approach"""
    
    def __init__(self, config=None):
        if config is None:
            config = Config()
        
        self.classifications = config.FOOD_CLASSIFICATIONS
        self.min_protein_density = config.MIN_PROTEIN_DENSITY
        
        # Nutritional thresholds for hybrid approach
        self.protein_thresholds = {
            'min_density': 10,      # minimum 10g protein per 100g
            'min_percentage': 0.20, # minimum 20% calories from protein
            'high_density': 20,     # 20g+ = high protein
            'high_percentage': 0.30 # 30%+ calories = high protein
        }
        
        # Meal-specific protein preferences (using actual categories from JSON)
        self.meal_protein_preferences = {
            'breakfast': {
                'preferred_categories': ['חלב ביצים וסלטים'],
                'preferred_subcategories': ['חלב', 'גבינות', 'יוגורט ומעדני חלב', 'סלטים'],
                'discouraged_categories': ['בשר  ודגים'],
                'discouraged_subcategories': ['נקניקיות ונקניקים', 'בשרים על האש'],
                'acceptable_subcategories': ['אורז וקטניות']
            },
            'lunch': {
                'preferred_categories': ['בשר  ודגים', 'קטניות ודגנים'],
                'preferred_subcategories': ['בשרים על האש', 'אורז וקטניות', 'גבינות'],
                'discouraged_categories': [],
                'discouraged_subcategories': [],
                'acceptable_subcategories': ['חלב', 'יוגורט ומעדני חלב', 'סלטים']
            },
            'dinner': {
                'preferred_categories': ['בשר  ודגים', 'קטניות ודגנים'],
                'preferred_subcategories': ['בשרים על האש', 'אורז וקטניות'],
                'discouraged_categories': [],
                'discouraged_subcategories': [],
                'acceptable_subcategories': ['גבינות', 'סלטים']
            },
            'snacks': {
                'preferred_categories': ['חלב ביצים וסלטים'],
                'preferred_subcategories': ['יוגורט ומעדני חלב', 'גבינות'],
                'discouraged_categories': ['בשר  ודגים'],
                'discouraged_subcategories': ['בשרים על האש', 'נקניקיות ונקניקים'],
                'acceptable_subcategories': ['חלב', 'אורז וקטניות']
            }
        }
    
    def is_protein_source(self, food):
        """Enhanced protein detection: nutrition-based with category validation"""
        # Step 1: Check nutritional criteria
        nutrition = food.nutrition_per_100g
        protein_density = nutrition.protein
        
        # Calculate protein percentage of calories
        if nutrition.calories > 0:
            protein_percentage = (protein_density * 4) / nutrition.calories
        else:
            protein_percentage = 0
        
        # Primary check: nutritional thresholds
        meets_density = protein_density >= self.protein_thresholds['min_density']
        meets_percentage = protein_percentage >= self.protein_thresholds['min_percentage']
        
        is_nutritionally_protein = meets_density and meets_percentage
        
        # Step 2: Category validation (safety check)
        is_category_protein = food.subcategory in self.classifications['protein']
        
        # Hybrid decision: must meet nutritional criteria, category is additional validation
        if is_nutritionally_protein:
            return True
        
        # Fallback: if category says protein but nutrition is borderline, allow it
        if is_category_protein and protein_density >= 8:  # lenient fallback
            return True
        
        return False
    
    def get_protein_quality_score(self, food):
        """Rate protein quality (0-100, higher = better)"""
        nutrition = food.nutrition_per_100g
        protein_density = nutrition.protein
        
        if nutrition.calories > 0:
            protein_percentage = (protein_density * 4) / nutrition.calories
        else:
            return 0
        
        score = 0
        
        # Base score from protein density
        if protein_density >= 25:
            score += 40
        elif protein_density >= 20:
            score += 30
        elif protein_density >= 15:
            score += 20
        elif protein_density >= 10:
            score += 10
        
        # Bonus for protein percentage
        if protein_percentage >= 0.4:  # 40%+ calories from protein
            score += 30
        elif protein_percentage >= 0.3:  # 30%+ calories
            score += 20
        elif protein_percentage >= 0.2:  # 20%+ calories
            score += 10
        
        # Efficiency bonus (protein per calorie)
        protein_per_calorie = protein_density / max(nutrition.calories, 1)
        if protein_per_calorie > 0.08:  # very efficient
            score += 20
        elif protein_per_calorie > 0.05:  # efficient
            score += 10
        
        # Penalize high fat if it's not lean protein
        fat_percentage = (nutrition.fat * 9) / max(nutrition.calories, 1)
        if fat_percentage > 0.6:  # >60% calories from fat
            score -= 20
        elif fat_percentage > 0.4:  # >40% calories from fat
            score -= 10
        
        return min(100, max(0, score))
    
    def is_appropriate_protein_for_meal(self, food, meal_type):
        """Check if protein source is appropriate for specific meal"""
        if not self.is_protein_source(food):
            return False
        
        if not meal_type or meal_type.lower() not in self.meal_protein_preferences:
            return True  # No meal restriction
        
        preferences = self.meal_protein_preferences[meal_type.lower()]
        
        # Check if discouraged by category
        if food.category in preferences['discouraged_categories']:
            return False
        
        # Check if discouraged by subcategory
        if food.subcategory in preferences['discouraged_subcategories']:
            return False
        
        # Check if preferred or acceptable
        is_preferred = (food.category in preferences['preferred_categories'] or 
                       food.subcategory in preferences['preferred_subcategories'])
        
        is_acceptable = food.subcategory in preferences['acceptable_subcategories']
        
        return is_preferred or is_acceptable
    
    def get_meal_protein_preference_score(self, food, meal_type):
        """Get preference score for protein in specific meal (0-100)"""
        if not self.is_protein_source(food):
            return 0
        
        if not meal_type or meal_type.lower() not in self.meal_protein_preferences:
            return 50  # neutral
        
        preferences = self.meal_protein_preferences[meal_type.lower()]
        
        # Check discouraged first
        if (food.category in preferences['discouraged_categories'] or 
            food.subcategory in preferences['discouraged_subcategories']):
            return 10  # low but not zero
        
        # Check preferred
        if (food.category in preferences['preferred_categories'] or 
            food.subcategory in preferences['preferred_subcategories']):
            return 90  # high preference
        
        # Check acceptable
        if food.subcategory in preferences['acceptable_subcategories']:
            return 60  # moderately good
        
        # Unknown/neutral
        return 30
    
    def select_best_protein_for_meal(self, protein_foods, meal_type=None, variety_factor=0.3):
        """Select best protein considering both nutrition and meal appropriateness"""
        if not protein_foods:
            return None
        
        # Score each protein food
        scored_proteins = []
        
        for food in protein_foods:
            if not self.is_protein_source(food):
                continue
            
            # Base nutritional score
            nutrition_score = self.get_protein_quality_score(food)
            
            # Meal appropriateness score
            meal_score = self.get_meal_protein_preference_score(food, meal_type)
            
            # Combined score (weighted)
            combined_score = (nutrition_score * 0.6) + (meal_score * 0.4)
            
            scored_proteins.append((food, combined_score, nutrition_score, meal_score))
        
        if not scored_proteins:
            return None
        
        # Sort by combined score
        scored_proteins.sort(key=lambda x: x[1], reverse=True)
        
        # Apply variety factor - select from top candidates with some randomness
        import random
        
        if variety_factor > 0:
            # Select from top 30% with weighted random
            top_count = max(1, int(len(scored_proteins) * 0.3))
            top_candidates = scored_proteins[:top_count]
            
            # Weight by score for selection
            weights = [candidate[1] for candidate in top_candidates]
            selected = random.choices(top_candidates, weights=weights)[0]
            return selected[0]
        else:
            # Always select the best
            return scored_proteins[0][0]
    
    # Keep all existing methods unchanged
    def is_high_sugar(self, food):
        """Check if food is high in sugar"""
        return food.subcategory in self.classifications['high_sugar']
    
    def is_fiber_source(self, food):
        """Check if food is a fiber source"""
        return food.subcategory in self.classifications['fiber']
    
    def is_processed(self, food):
        """Check if food is processed"""
        return food.subcategory in self.classifications['processed']
    
    def is_wholesome(self, food):
        """Check if food is wholesome/healthy"""
        return food.subcategory in self.classifications['wholesome']
    
    def get_food_type(self, food):
        """Get the primary type of the food"""
        if self.is_protein_source(food):
            return 'protein'
        elif self.is_fiber_source(food):
            return 'fiber'
        elif self.is_high_sugar(food):
            return 'sugar'
        elif self.is_processed(food):
            return 'processed'
        else:
            return 'other'
    
    def is_food_of_type(self, food, food_type):
        """Check if food matches a specific type"""
        type_checkers = {
            'protein': self.is_protein_source,
            'fiber': self.is_fiber_source,
            'sugar': self.is_high_sugar,
            'processed': self.is_processed,
            'wholesome': self.is_wholesome
        }
        
        checker = type_checkers.get(food_type)
        if checker:
            return checker(food)
        return False
    
    def get_food_score(self, food):
        """Get a health score for the food (0-100)"""
        score = 50  # Base score
        
        # Bonuses
        if self.is_wholesome(food):
            score += 30
        if self.is_protein_source(food):
            # Use enhanced protein scoring
            protein_bonus = self.get_protein_quality_score(food) * 0.2
            score += protein_bonus
        if self.is_fiber_source(food):
            score += 15
        
        # Penalties
        if self.is_high_sugar(food):
            score -= 25
        if self.is_processed(food):
            score -= 20
        
        # Sodium penalty
        if food.sodium > 800:
            score -= 15
        elif food.sodium > 400:
            score -= 10
        
        # Calorie density consideration
        if food.nutrition_per_100g.calories > 400:
            score -= 10
        
        return max(0, min(100, score))
    
    def classify_menu(self, menu):
        """Classify all foods in a menu with enhanced protein analysis"""
        classification = {
            'wholesome': 0,
            'protein': 0,
            'high_quality_protein': 0,  # New: high-quality proteins
            'fiber': 0,
            'processed': 0,
            'high_sugar': 0,
            'total_items': len(menu.items),
            'avg_protein_quality': 0    # New: average protein quality
        }
        
        protein_scores = []
        
        for item in menu.items:
            if self.is_wholesome(item.food):
                classification['wholesome'] += 1
            if self.is_protein_source(item.food):
                classification['protein'] += 1
                protein_score = self.get_protein_quality_score(item.food)
                protein_scores.append(protein_score)
                if protein_score >= 70:  # High quality threshold
                    classification['high_quality_protein'] += 1
            if self.is_fiber_source(item.food):
                classification['fiber'] += 1
            if self.is_processed(item.food):
                classification['processed'] += 1
            if self.is_high_sugar(item.food):
                classification['high_sugar'] += 1
        
        # Calculate average protein quality
        if protein_scores:
            classification['avg_protein_quality'] = sum(protein_scores) / len(protein_scores)
        
        return classification