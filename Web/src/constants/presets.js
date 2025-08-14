// Nutrition presets for meal generation
export const NUTRITION_PRESETS = {
  weightLoss: { 
    calories: 1500, 
    protein: 130, 
    carbs: 120, 
    fat: 50 
  },
  maintenance: { 
    calories: 2000, 
    protein: 150, 
    carbs: 200, 
    fat: 65 
  },
  bulking: { 
    calories: 2800, 
    protein: 200, 
    carbs: 350, 
    fat: 85 
  }
};

// Default form values
export const DEFAULT_FORM_DATA = {
  calories: 500,
  protein: 50,
  carbs: 50,
  fat: 11,
  meal_template: '',
  subcategories: [],
  excluded_allergens: [],
  num_items: 5,
  include_prices: true,
  min_price: 0,
  max_price: 0,
  requiredProducts: [],
  requiredProductPortions: {}
};

// Default nutrition goals
export const DEFAULT_NUTRITION_GOALS = {
  calories: 2000,
  protein: 140,
  carbs: 250,
  fat: 70
};