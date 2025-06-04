# src/algorithm/synergy_engine.py - Nutritional synergy optimization

from collections import defaultdict
import math

class NutritionalSynergyEngine:
    """Optimizes food combinations based on nutritional synergies and compatibility"""
    
    def __init__(self, food_classifier):
        self.food_classifier = food_classifier
        self.synergy_rules = self._initialize_synergy_rules()
        self.amino_acid_profiles = self._initialize_amino_acid_data()
        self.nutrient_absorption_rules = self._initialize_absorption_rules()
    
    def _initialize_synergy_rules(self):
        """Define food combination synergies"""
        return {
            # Protein combinations for complete amino profiles
            'protein_synergies': [
                (['קטניות', 'דגנים'], 1.3),  # Legumes + grains = complete protein
                (['חלב ביצים וסלטים', 'קטניות ודגנים'], 1.2),  # Dairy + grains/legumes
                (['בשר  ודגים', 'ירקות עליים'], 1.15),  # Meat + leafy greens
            ],
            
            # Vitamin absorption synergies
            'vitamin_synergies': [
                (['פירות וירקות', 'שמן, חומץ ומיץ לימון'], 1.25),  # Fat-soluble vitamins
                (['ירקות כתומים', 'גבינות'], 1.2),  # Beta-carotene + fat
                (['עגבניות', 'שמן זית'], 1.3),  # Lycopene + fat
            ],
            
            # Mineral absorption synergies
            'mineral_synergies': [
                (['בשר  ודגים', 'פירות וירקות'], 1.2),  # Iron + Vitamin C
                (['דגנים מלאים', 'חלב ביצים וסלטים'], 1.15),  # Calcium + complex carbs
                (['אגוזים וזרעים', 'פירות'], 1.1),  # Healthy fats + antioxidants
            ],
            
            # Digestive synergies
            'digestive_synergies': [
                (['דגנים מלאים', 'ירקות'], 1.2),  # Fiber + prebiotics
                (['חלב ביצים וסלטים', 'פירות'], 1.1),  # Probiotics + prebiotics
                (['בשר  ודגים', 'ירקות חמוצים'], 1.15),  # Protein + digestive enzymes
            ],
            
            # Anti-combinations (foods that reduce each other's benefits)
            'negative_combinations': [
                (['חלב ביצים וסלטים', 'תה וקפה'], 0.85),  # Calcium + caffeine
                (['בשר  ודגים', 'דגנים מלאים'], 0.9),  # Iron + phytates (mild)
                (['אלכוהול', 'ויטמינים'], 0.7),  # Alcohol reduces vitamin absorption
            ]
        }
    
    def _initialize_amino_acid_data(self):
        """Initialize amino acid profile data for different food categories"""
        return {
            'קטניות ודגנים': {
                'lysine': 0.7, 'methionine': 0.3, 'threonine': 0.6,
                'tryptophan': 0.2, 'isoleucine': 0.5, 'leucine': 0.8,
                'valine': 0.6, 'phenylalanine': 0.7, 'histidine': 0.4
            },
            'דגנים': {
                'lysine': 0.3, 'methionine': 0.8, 'threonine': 0.4,
                'tryptophan': 0.3, 'isoleucine': 0.6, 'leucine': 0.9,
                'valine': 0.7, 'phenylalanine': 0.8, 'histidine': 0.5
            },
            'בשר  ודגים': {
                'lysine': 1.0, 'methionine': 1.0, 'threonine': 1.0,
                'tryptophan': 1.0, 'isoleucine': 1.0, 'leucine': 1.0,
                'valine': 1.0, 'phenylalanine': 1.0, 'histidine': 1.0
            },
            'חלב ביצים וסלטים': {
                'lysine': 0.9, 'methionine': 0.9, 'threonine': 0.8,
                'tryptophan': 0.8, 'isoleucine': 0.8, 'leucine': 0.9,
                'valine': 0.8, 'phenylalanine': 0.9, 'histidine': 0.7
            }
        }
    
    def _initialize_absorption_rules(self):
        """Initialize nutrient absorption enhancement/inhibition rules"""
        return {
            'enhancers': {
                'iron': ['vitamin_c', 'meat_factor', 'organic_acids'],
                'calcium': ['vitamin_d', 'magnesium', 'protein'],
                'beta_carotene': ['fats', 'oils'],
                'lycopene': ['fats', 'heat_processed'],
                'vitamin_k': ['fats'],
                'vitamin_e': ['fats'],
                'zinc': ['protein', 'organic_acids'],
                'b_vitamins': ['complex_carbs', 'protein']
            },
            'inhibitors': {
                'iron': ['calcium_excess', 'tannins', 'phytates'],
                'calcium': ['oxalates', 'phytates', 'excess_fiber'],
                'zinc': ['phytates', 'calcium_excess', 'iron_excess'],
                'vitamin_b12': ['alcohol', 'excess_fiber'],
                'folate': ['alcohol', 'heat_exposure']
            }
        }
    
    def calculate_menu_synergy_score(self, menu):
        """Calculate overall synergy score for a menu"""
        if len(menu.items) < 2:
            return 1.0  # No synergy possible with single item
        
        categories = [item.food.category for item in menu.items]
        subcategories = [item.food.subcategory for item in menu.items]
        
        total_synergy = 1.0
        synergy_count = 0
        
        # Check protein synergies
        protein_synergy = self._calculate_protein_synergy(categories, menu)
        total_synergy *= protein_synergy
        if protein_synergy != 1.0:
            synergy_count += 1
        
        # Check vitamin synergies
        vitamin_synergy = self._calculate_vitamin_synergy(categories, menu)
        total_synergy *= vitamin_synergy
        if vitamin_synergy != 1.0:
            synergy_count += 1
        
        # Check mineral synergies
        mineral_synergy = self._calculate_mineral_synergy(categories, menu)
        total_synergy *= mineral_synergy
        if mineral_synergy != 1.0:
            synergy_count += 1
        
        # Check digestive synergies
        digestive_synergy = self._calculate_digestive_synergy(categories, menu)
        total_synergy *= digestive_synergy
        if digestive_synergy != 1.0:
            synergy_count += 1
        
        # Check negative combinations
        negative_penalty = self._calculate_negative_combinations(categories, menu)
        total_synergy *= negative_penalty
        
        # Diversity bonus - more food categories create more synergy opportunities
        diversity_bonus = min(1.2, 1.0 + (len(set(categories)) - 1) * 0.05)
        total_synergy *= diversity_bonus
        
        return max(0.5, min(2.0, total_synergy))  # Cap between 0.5 and 2.0
    
    def _calculate_protein_synergy(self, categories, menu):
        """Calculate protein combination synergies"""
        synergy = 1.0
        
        for synergy_categories, multiplier in self.synergy_rules['protein_synergies']:
            if all(any(cat in category for category in categories) for cat in synergy_categories):
                # Calculate protein completeness score
                completeness = self._calculate_amino_acid_completeness(menu)
                synergy *= (1.0 + (multiplier - 1.0) * completeness)
        
        return synergy
    
    def _calculate_amino_acid_completeness(self, menu):
        """Calculate amino acid profile completeness"""
        combined_profile = defaultdict(float)
        total_protein = 0
        
        for item in menu.items:
            if self.food_classifier.is_protein_source(item.food):
                category = item.food.category
                if category in self.amino_acid_profiles:
                    protein_amount = item.food.nutrition_per_100g.protein * (item.portion / 100)
                    profile = self.amino_acid_profiles[category]
                    
                    for amino_acid, score in profile.items():
                        combined_profile[amino_acid] += score * protein_amount
                    total_protein += protein_amount
        
        if total_protein == 0:
            return 0.0
        
        # Normalize by total protein
        for amino_acid in combined_profile:
            combined_profile[amino_acid] /= total_protein
        
        # Calculate completeness (minimum amino acid score)
        if not combined_profile:
            return 0.0
        
        essential_amino_acids = ['lysine', 'methionine', 'threonine', 'tryptophan', 
                               'isoleucine', 'leucine', 'valine', 'phenylalanine', 'histidine']
        
        completeness_scores = []
        for amino_acid in essential_amino_acids:
            if amino_acid in combined_profile:
                completeness_scores.append(min(1.0, combined_profile[amino_acid]))
        
        if not completeness_scores:
            return 0.0
        
        # Use geometric mean for completeness (all amino acids need to be present)
        geometric_mean = math.pow(math.prod(completeness_scores), 1.0 / len(completeness_scores))
        return geometric_mean
    
    def _calculate_vitamin_synergy(self, categories, menu):
        """Calculate vitamin absorption synergies"""
        synergy = 1.0
        
        for synergy_categories, multiplier in self.synergy_rules['vitamin_synergies']:
            if all(any(cat in category for category in categories) for cat in synergy_categories):
                # Check if combination is meaningful based on menu composition
                has_fat_soluble_vitamins = self._has_fat_soluble_vitamins(menu)
                has_healthy_fats = self._has_healthy_fats(menu)
                
                if has_fat_soluble_vitamins and has_healthy_fats:
                    synergy *= multiplier
        
        return synergy
    
    def _calculate_mineral_synergy(self, categories, menu):
        """Calculate mineral absorption synergies"""
        synergy = 1.0
        
        for synergy_categories, multiplier in self.synergy_rules['mineral_synergies']:
            if all(any(cat in category for category in categories) for cat in synergy_categories):
                # Calculate mineral synergy based on actual content
                iron_enhancer_score = self._calculate_iron_enhancement(menu)
                calcium_synergy_score = self._calculate_calcium_synergy(menu)
                
                enhancement_factor = (iron_enhancer_score + calcium_synergy_score) / 2
                synergy *= (1.0 + (multiplier - 1.0) * enhancement_factor)
        
        return synergy
    
    def _calculate_digestive_synergy(self, categories, menu):
        """Calculate digestive synergies"""
        synergy = 1.0
        
        for synergy_categories, multiplier in self.synergy_rules['digestive_synergies']:
            if all(any(cat in category for category in categories) for cat in synergy_categories):
                # Calculate fiber and prebiotic content
                fiber_score = self._calculate_fiber_quality(menu)
                synergy *= (1.0 + (multiplier - 1.0) * fiber_score)
        
        return synergy
    
    def _calculate_negative_combinations(self, categories, menu):
        """Calculate penalties for negative food combinations"""
        penalty = 1.0
        
        for synergy_categories, multiplier in self.synergy_rules['negative_combinations']:
            if all(any(cat in category for category in categories) for cat in synergy_categories):
                penalty *= multiplier
        
        return penalty
    
    def _has_fat_soluble_vitamins(self, menu):
        """Check if menu contains foods rich in fat-soluble vitamins"""
        vitamin_foods = ['פירות וירקות', 'ירקות עליים', 'ירקות כתומים']
        categories = [item.food.category for item in menu.items]
        return any(any(vf in cat for vf in vitamin_foods) for cat in categories)
    
    def _has_healthy_fats(self, menu):
        """Check if menu contains healthy fats"""
        fat_foods = ['שמן, חומץ ומיץ לימון', 'אגוזים וזרעים', 'דגים שמנים']
        categories = [item.food.category for item in menu.items]
        subcategories = [item.food.subcategory for item in menu.items]
        
        return (any(any(ff in cat for ff in fat_foods) for cat in categories) or
                any('אבוקדו' in subcat or 'זית' in subcat for subcat in subcategories))
    
    def _calculate_iron_enhancement(self, menu):
        """Calculate iron absorption enhancement score"""
        has_iron_source = any(self.food_classifier.is_protein_source(item.food) 
                             for item in menu.items)
        has_vitamin_c = any('פירות' in item.food.category or 'ירקות' in item.food.category
                           for item in menu.items)
        
        if has_iron_source and has_vitamin_c:
            return 1.0
        elif has_iron_source or has_vitamin_c:
            return 0.5
        return 0.0
    
    def _calculate_calcium_synergy(self, menu):
        """Calculate calcium synergy score"""
        has_calcium = any('חלב' in item.food.category or 'גבינות' in item.food.subcategory
                         for item in menu.items)
        has_magnesium = any('אגוזים' in item.food.subcategory or 'דגנים מלאים' in item.food.subcategory
                           for item in menu.items)
        
        if has_calcium and has_magnesium:
            return 1.0
        elif has_calcium or has_magnesium:
            return 0.5
        return 0.0
    
    def _calculate_fiber_quality(self, menu):
        """Calculate fiber quality and diversity score"""
        fiber_sources = 0
        total_items = len(menu.items)
        
        for item in menu.items:
            if self.food_classifier.is_fiber_source(item.food):
                fiber_sources += 1
        
        return min(1.0, fiber_sources / max(1, total_items))
    
    def suggest_synergy_improvements(self, menu, available_foods):
        """Suggest foods that would improve menu synergy"""
        current_score = self.calculate_menu_synergy_score(menu)
        suggestions = []
        
        categories = [item.food.category for item in menu.items]
        
        # Suggest protein combinations
        if any(self.food_classifier.is_protein_source(item.food) for item in menu.items):
            for food in available_foods:
                if food.category not in categories:
                    # Test adding this food
                    test_categories = categories + [food.category]
                    improvement = self._would_improve_protein_synergy(test_categories, menu)
                    if improvement > 0.1:
                        suggestions.append((food, 'protein_synergy', improvement))
        
        # Suggest vitamin absorption improvements
        vitamin_improvements = self._suggest_vitamin_improvements(menu, available_foods)
        suggestions.extend(vitamin_improvements)
        
        # Suggest mineral absorption improvements
        mineral_improvements = self._suggest_mineral_improvements(menu, available_foods)
        suggestions.extend(mineral_improvements)
        
        # Sort by improvement potential
        suggestions.sort(key=lambda x: x[2], reverse=True)
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def _would_improve_protein_synergy(self, test_categories, menu):
        """Check if adding a category would improve protein synergy"""
        for synergy_categories, multiplier in self.synergy_rules['protein_synergies']:
            current_match = all(any(cat in category for category in test_categories[:-1]) 
                              for cat in synergy_categories)
            new_match = all(any(cat in category for category in test_categories) 
                           for cat in synergy_categories)
            
            if not current_match and new_match:
                return multiplier - 1.0
        
        return 0.0
    
    def _suggest_vitamin_improvements(self, menu, available_foods):
        """Suggest foods for vitamin synergy improvement"""
        suggestions = []
        
        has_fat_soluble = self._has_fat_soluble_vitamins(menu)
        has_fats = self._has_healthy_fats(menu)
        
        if has_fat_soluble and not has_fats:
            # Suggest healthy fats
            for food in available_foods:
                if 'שמן' in food.category or 'אגוזים' in food.subcategory:
                    suggestions.append((food, 'vitamin_absorption', 0.25))
        
        elif not has_fat_soluble and has_fats:
            # Suggest vitamin-rich foods
            for food in available_foods:
                if 'פירות' in food.category or 'ירקות' in food.category:
                    suggestions.append((food, 'vitamin_absorption', 0.25))
        
        return suggestions
    
    def _suggest_mineral_improvements(self, menu, available_foods):
        """Suggest foods for mineral synergy improvement"""
        suggestions = []
        
        has_iron = any(self.food_classifier.is_protein_source(item.food) for item in menu.items)
        has_vitamin_c = any('פירות' in item.food.category for item in menu.items)
        
        if has_iron and not has_vitamin_c:
            # Suggest vitamin C sources
            for food in available_foods:
                if 'פירות' in food.category or 'ירקות טריים' in food.subcategory:
                    suggestions.append((food, 'iron_absorption', 0.2))
        
        return suggestions 