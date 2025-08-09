// Meal-related constants
export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch', 
  DINNER: 'dinner',
  SNACK: 'snack'
};

export const MEAL_TYPE_INFO = {
  [MEAL_TYPES.BREAKFAST]: { icon: '🌅', label: 'Breakfast' },
  [MEAL_TYPES.LUNCH]: { icon: '🌞', label: 'Lunch' },
  [MEAL_TYPES.DINNER]: { icon: '🌙', label: 'Dinner' },
  [MEAL_TYPES.SNACK]: { icon: '🍎', label: 'Snack' }
};

export const DEFAULT_MEAL_ITEM = {
  custom_food_name: '',
  quantity: 100,
  unit: 'grams',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0
};

export const DEFAULT_MEAL_FORM = {
  name: '',
  description: '',
  target_nutrition: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  },
  items: []
};

export const NUTRITION_UNITS = {
  CALORIES: 'kcal',
  PROTEIN: 'g',
  CARBS: 'g',
  FAT: 'g'
};

export const QUANTITY_UNITS = {
  GRAMS: 'grams',
  ML: 'ml',
  CUPS: 'cups',
  PIECES: 'pieces',
  OUNCES: 'oz'
};

export const MEAL_GENERATION_DEFAULTS = {
  [MEAL_TYPES.BREAKFAST]: { 
    icon: '🌅', 
    defaultCalories: 400,
    protein: 15, // 15% of calories from protein
    carbs: 45,   // 45% of calories from carbs  
    fat: 35      // 35% of calories from fat
  },
  [MEAL_TYPES.LUNCH]: { 
    icon: '🌞', 
    defaultCalories: 600,
    protein: 15,
    carbs: 45,
    fat: 35
  },
  [MEAL_TYPES.DINNER]: { 
    icon: '🌙', 
    defaultCalories: 700,
    protein: 15,
    carbs: 45,
    fat: 35
  },
  [MEAL_TYPES.SNACK]: { 
    icon: '🍎', 
    defaultCalories: 200,
    protein: 15,
    carbs: 45,
    fat: 35
  }
};

export const DEFAULT_GENERATION_PARAMS = {
  calories: 500,
  protein: 30,
  carbs: 50,
  fat: 20,
  num_items: 3
};