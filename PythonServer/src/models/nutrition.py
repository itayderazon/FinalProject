# src/models/nutrition.py - Nutrition information model

class NutritionInfo:
    """Responsible ONLY for nutrition data and calculations"""
    
    def __init__(self, calories, protein, carbs, fat):
        self.calories = float(calories)
        self.protein = float(protein)
        self.carbs = float(carbs)
        self.fat = float(fat)
    
    def calculated_calories(self):
        """Calculate calories from macronutrients"""
        return self.protein * 4 + self.carbs * 4 + self.fat * 9
    
    def is_valid(self, tolerance=0.15):
        """Check if nutrition data is consistent"""
        if self.calories <= 0:
            return False
        calculated = self.calculated_calories()
        if calculated == 0:
            return False
        return abs(calculated - self.calories) / self.calories <= tolerance
    
    def add(self, other):
        """Add two nutrition infos together"""
        return NutritionInfo(
            self.calories + other.calories,
            self.protein + other.protein,
            self.carbs + other.carbs,
            self.fat + other.fat
        )
    
    def multiply(self, factor):
        """Multiply nutrition by a factor"""
        return NutritionInfo(
            self.calories * factor,
            self.protein * factor,
            self.carbs * factor,
            self.fat * factor
        )
    
    def get_macro_ratios(self):
        """Get macronutrient ratios as percentages"""
        total_cal = self.calculated_calories()
        if total_cal == 0:
            return {'protein': 0, 'carbs': 0, 'fat': 0}
        
        return {
            'protein': round((self.protein * 4 / total_cal) * 100),
            'carbs': round((self.carbs * 4 / total_cal) * 100),
            'fat': round((self.fat * 9 / total_cal) * 100)
        }
    
    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'calories': round(self.calories, 1),
            'protein': round(self.protein, 1),
            'carbs': round(self.carbs, 1),
            'fat': round(self.fat, 1)
        }
    
    def __str__(self):
        return f"{self.calories:.1f}cal, {self.protein:.1f}g protein, {self.carbs:.1f}g carbs, {self.fat:.1f}g fat"
    
    def __repr__(self):
        return f"NutritionInfo(calories={self.calories}, protein={self.protein}, carbs={self.carbs}, fat={self.fat})"