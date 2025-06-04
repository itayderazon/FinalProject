# src/algorithm/menu_scorer.py - Menu scoring logic

class MenuScorer:
    """Responsible ONLY for scoring menus (SRP)"""
    
    def __init__(self, food_classifier, config):
        self.food_classifier = food_classifier
        self.config = config
    
    def score_menu(self, menu, target_nutrition):
        """Calculate overall menu score (lower = better)"""
        if not menu or len(menu.items) == 0:
            return float('inf')
        
        macro_score = self._calculate_macro_accuracy_score(menu, target_nutrition)
        return macro_score
    
    def _calculate_macro_accuracy_score(self, menu, target_nutrition):
        """Calculate score based on macro accuracy"""
        total_nutrition = menu.get_total_nutrition()
        
        # Calculate relative errors for each macro
        cal_diff = abs(total_nutrition.calories - target_nutrition.calories) / target_nutrition.calories
        protein_diff = abs(total_nutrition.protein - target_nutrition.protein) / target_nutrition.protein
        carb_diff = abs(total_nutrition.carbs - target_nutrition.carbs) / target_nutrition.carbs  
        fat_diff = abs(total_nutrition.fat - target_nutrition.fat) / target_nutrition.fat
        
        # Give extra weight to fat accuracy since it was problematic
        accuracy_score = cal_diff + protein_diff + carb_diff + (fat_diff * 1.5)
        
        return accuracy_score
    
    def calculate_menu_stats(self, menu):
        """Calculate comprehensive menu statistics"""
        if not menu or len(menu.items) == 0:
            return {}
        
        total_nutrition = menu.get_total_nutrition()
        classification = self.food_classifier.classify_menu(menu)
        
        return {
            'total_nutrition': total_nutrition.to_dict(),
            'macro_ratios': total_nutrition.get_macro_ratios(),
            'classification': classification,
            'categories': menu.get_categories(),
            'subcategories': menu.get_subcategories(),
            'item_count': len(menu.items),
            'balance_score': self._calculate_balance_score(menu),
            'health_score': self._calculate_health_score(menu)
        }
    
    def _calculate_balance_score(self, menu):
        """Calculate balance score (0-100, higher is better)"""
        if len(menu.items) == 0:
            return 0
        
        score = 100
        classification = self.food_classifier.classify_menu(menu)
        
        # Penalties for imbalanced composition
        sugar_percentage = classification['high_sugar'] / classification['total_items']
        if sugar_percentage > self.config.MAX_SUGAR_PERCENTAGE:
            score -= (sugar_percentage - self.config.MAX_SUGAR_PERCENTAGE) * 200
        
        processed_percentage = classification['processed'] / classification['total_items']
        if processed_percentage > self.config.MAX_PROCESSED_PERCENTAGE:
            score -= (processed_percentage - self.config.MAX_PROCESSED_PERCENTAGE) * 100
        
        # Bonuses for good composition
        wholesome_percentage = classification['wholesome'] / classification['total_items']
        score += wholesome_percentage * 30
        
        protein_percentage = classification['protein'] / classification['total_items']
        score += protein_percentage * 20
        
        # Category diversity bonus
        categories = menu.get_categories()
        diversity_bonus = min(20, len(categories) * 5)
        score += diversity_bonus
        
        return max(0, min(100, round(score)))
    
    def _calculate_health_score(self, menu):
        """Calculate health score (0-100, higher is better)"""
        if len(menu.items) == 0:
            return 0
        
        total_score = sum(self.food_classifier.get_food_score(item.food) for item in menu.items)
        return round(total_score / len(menu.items))