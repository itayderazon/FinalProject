# src/algorithm/food_filter_service.py - Database-based food filtering service

class DatabaseFoodFilterService:
    """Database-based food filtering service that replaces the old filter classes"""
    
    def __init__(self, sql_food_provider, config):
        self.sql_food_provider = sql_food_provider
        self.config = config
        print("🗃️ Database Food Filter Service initialized")
    
    def get_suitable_foods(self, subcategories=None):
        """Get foods filtered by subcategories using database queries"""
        
        # Use configuration values for filtering parameters
        max_calories_per_100g = getattr(self.config, 'MAX_CALORIES_PER_100G', 600)
        
        # Get filtered foods using database query
        suitable_foods = self.sql_food_provider.get_filtered_foods(
            max_calories_per_100g=max_calories_per_100g,
            included_subcategories=subcategories
        )
        
        if subcategories:
            print(f"✅ Database filtering with subcategories {subcategories} returned {len(suitable_foods)} suitable foods")
        else:
            print(f"✅ Database filtering (all subcategories) returned {len(suitable_foods)} suitable foods")
        
        return suitable_foods
    
    def get_foods_by_meal_requirements(self, meal_type, required_types=None):
        """Get foods that meet specific meal requirements using database queries"""
        if not meal_type:
            return self.get_suitable_foods()
        
        # Get base filtered foods
        suitable_foods = self.get_suitable_foods()
        
        # If specific nutrition types are required, filter further
        if required_types:
            filtered_foods = []
            
            for food in suitable_foods:
                meets_requirements = True
                
                # Check protein requirement
                if 'protein' in required_types:
                    if food.nutrition_per_100g.protein < self.config.MIN_PROTEIN_DENSITY:
                        meets_requirements = False
                
                # Check fiber requirement (approximated by checking for fiber-rich categories)
                if 'fiber' in required_types:
                    fiber_categories = ['פירות וירקות', 'דגנים וחטיפי אנרגיה', 'אורז וקטניות']
                    if food.category not in fiber_categories:
                        # Could be more lenient and allow foods with high carbs as potential fiber sources
                        if food.nutrition_per_100g.carbs < 20:  # Arbitrary threshold
                            meets_requirements = False
                
                if meets_requirements:
                    filtered_foods.append(food)
            
            suitable_foods = filtered_foods
        
        print(f"📊 After requirement filtering: {len(suitable_foods)} foods")
        return suitable_foods
    
    def get_high_protein_foods(self, subcategories=None, min_protein=15):
        """Get high-protein foods using database query"""
        return self.sql_food_provider.get_foods_with_high_protein(
            min_protein=min_protein, 
            included_subcategories=subcategories
        )
    
    def get_foods_by_subcategories(self, subcategories, limit=None):
        """Get foods from specific subcategories"""
        foods = self.sql_food_provider.get_foods_by_subcategories(subcategories, limit)
        return foods
    
    def get_filtering_stats(self, subcategories=None):
        """Get statistics about the filtering process using database queries"""
        try:
            # Get total foods count
            all_foods = self.sql_food_provider.get_all_foods()
            total_count = len(all_foods)
            
            # Get filtered foods count
            filtered_foods = self.get_suitable_foods(subcategories)
            filtered_count = len(filtered_foods)
            
            return {
                'original_count': total_count,
                'filtered_count': filtered_count,
                'filtered_percentage': (filtered_count / total_count * 100) if total_count > 0 else 0,
                'removed_count': total_count - filtered_count,
                'subcategories': subcategories
            }
        except Exception as e:
            print(f"Error getting filtering stats: {e}")
            return {
                'original_count': 0,
                'filtered_count': 0,
                'filtered_percentage': 0,
                'removed_count': 0,
                'error': str(e)
            }

# Keep the old class for backward compatibility but mark it as deprecated
class FoodFilterService:
    """DEPRECATED: Legacy food filtering service - use DatabaseFoodFilterService instead"""
    
    def __init__(self, nutritional_filter, preference_filter, meal_rules_factory):
        print("⚠️  WARNING: Using deprecated FoodFilterService. Please use DatabaseFoodFilterService instead.")
        self.nutritional_filter = nutritional_filter
        self.preference_filter = preference_filter
        self.meal_rules_factory = meal_rules_factory
    
    def get_suitable_foods(self, all_foods, meal_type=None):
        """DEPRECATED: Apply complete filtering pipeline to get suitable foods"""
        print("⚠️  WARNING: This method is deprecated. Use DatabaseFoodFilterService.get_suitable_foods() instead.")
        
        if not all_foods:
            return []
        
        print(f"🔍 Starting with {len(all_foods)} total foods")
        
        # Apply nutritional filtering
        suitable_foods = self.nutritional_filter.filter(all_foods)
        print(f"📊 After nutritional filtering: {len(suitable_foods)} foods")
        
        # Apply category preference filtering
        suitable_foods = self.preference_filter.filter(suitable_foods)
        print(f"🏷️  After category preference filtering: {len(suitable_foods)} foods")
        
        # Apply meal-specific filtering if specified
        if meal_type:
            print(f"🍽️  Applying {meal_type} meal rules...")
            meal_rules = self.meal_rules_factory.create_rules(meal_type)
            print(f"   Primary categories: {meal_rules.get_primary_categories()}")
            print(f"   Secondary categories: {meal_rules.get_secondary_categories()}")
            print(f"   Forbidden categories: {meal_rules.get_forbidden_categories()}")
            
            # Import here to avoid circular imports
            from ..filters import MealAppropriatenessFilter
            meal_filter = MealAppropriatenessFilter(meal_rules)
            before_meal_filter = len(suitable_foods)
            suitable_foods = meal_filter.filter(suitable_foods)
            print(f"   After meal appropriateness filtering: {len(suitable_foods)} foods (removed {before_meal_filter - len(suitable_foods)})")
        
        return suitable_foods
    
    def get_filtering_stats(self, original_count, filtered_count):
        """Get statistics about the filtering process"""
        return {
            'original_count': original_count,
            'filtered_count': filtered_count,
            'filtered_percentage': (filtered_count / original_count * 100) if original_count > 0 else 0,
            'removed_count': original_count - filtered_count
        }