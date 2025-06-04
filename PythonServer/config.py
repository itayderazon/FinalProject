# config.py - Configuration settings with category preferences

import os

class Config:
    """Base configuration class"""
    
    # Data file paths
    DATA_DIR = "data"
    NUTRITION_DATA_FILE = os.path.join(DATA_DIR, "nutrition_data.json")
    CATEGORIES_DATA_FILE = os.path.join(DATA_DIR, "categories_extracted.json")
    
    # Algorithm settings
    DEFAULT_MIN_ITEMS = 5  # Reduced from 4 to allow simpler menus
    DEFAULT_MAX_ITEMS = 8 # Reduced from 8 to focus on core foods
    DEFAULT_ATTEMPTS = 300  # Increased attempts
    
    # Nutrition constraints
    MAX_SUGAR_PERCENTAGE = 0.15  # Max 15% calories from sugar
    MAX_PROCESSED_PERCENTAGE = 0.4  # Max 40% processed foods
    MIN_PROTEIN_DENSITY = 10  
    MAX_SODIUM_PER_100G = 1500  # Max sodium per 100g
    MAX_CALORIES_PER_100G = 600  # Max calories per 100g
    
    # Portion limits
    DEFAULT_MIN_PORTION = 50
    DEFAULT_MAX_PORTION = 1000
    
    # Category-specific portion limits
    PORTION_LIMITS = {
        'ממתקים': {'min': 20, 'max': 80},
        'סוכריות ומסטיקים': {'min': 15, 'max': 50},
        'דבש, ריבה וממרחים': {'min': 15, 'max': 40},
        'שמן, חומץ ומיץ לימון': {'min': 5, 'max': 30},
        'תבלינים': {'min': 2, 'max': 15},
        'משקאות קלים': {'min': 100, 'max': 350},
        'חלב': {'min': 100, 'max': 300},
        'גבינות': {'min': 30, 'max': 150},
        'בשרים על האש': {'min': 80, 'max': 250},
        'נקניקיות ונקניקים': {'min': 50, 'max': 200},
        'פירות וירקות': {'min': 80, 'max': 300},
        'לחם, פיתה, לחמניה': {'min': 50, 'max': 150}
    }
    
    
    EXCLUDED_CATEGORIES = [
       
    ]
    
    EXCLUDED_SUBCATEGORIES = [
    'מוצרי אפיה',
    'רטבים', 
    'דבש, ריבה וממרחים',
    'שמן, חומץ ומיץ לימון',
    'תבלינים',
    'תרכיזים',
    'קמח ופירורי לחם',
    'סוכריות ומסטיקים',
    'משקאות קלים',
    'אלכוהול ואנרגיה',
    'מזון לתינוקות',
    'משקאות חמים',
    'משקאות במארזים',
]
    
    PREFERRED_CATEGORIES = [
    
    ]
    
    PREFERRED_SUBCATEGORIES = [

    ]
    
    #
    CATEGORY_LIMITS = {
      
    }
    
    SUBCATEGORY_LIMITS = {
    }
    
    REQUIRED_CATEGORIES = [
    ]
    
    REQUIRED_SUBCATEGORIES = [

    ]
    REQUIRED_ITEM_CODES = [

]
    REQUIRED_ITEM_PORTIONS = {
   
}
    
    # Food classifications
    FOOD_CLASSIFICATIONS = {
        'high_sugar': ['ממתקים', 'סוכריות ומסטיקים', 'דבש, ריבה וממרחים'],
        'protein': ['בשר  ודגים', 'גבינות', 'חלב', 'יוגורט ומעדני חלב'],
        'fiber': ['פירות וירקות', 'דגנים וחטיפי אנרגיה', 'אורז וקטניות'],
        'processed': ['שימורים', 'נקניקיות ונקניקים', 'אוכל להכנה מהירה'],
        'wholesome': ['אורגני וטבעוני', 'ללא גלוטן', 'פירות וירקות']
    }
    
    # Meal rules
    MEAL_RULES = {
        'breakfast': {
            'primary': ['חלב ביצים וסלטים', 'לחם ומאפים טריים'],
            'secondary': ['דבש, ריבה וממרחים', 'פירות וירקות', 'משקאות'],
            'forbidden': ['בשר  ודגים', 'קפואים'],
            'required_types': ['protein', 'fiber']
        },
        'lunch': {
            'primary': ['בשר  ודגים', 'קטניות ודגנים'],
            'secondary': ['חלב ביצים וסלטים', 'פירות וירקות', 'שימורים בישול ואפיה'],
            'forbidden': ['חטיפים ומתוקים'],
            'required_types': ['protein', 'fiber']
        },
        'dinner': {
            'primary': ['בשר  ודגים', 'קפואים'],
            'secondary': ['קטניות ודגנים', 'חלב ביצים וסלטים', 'שימורים בישול ואפיה'],
            'forbidden': ['חטיפים ומתוקים'],
            'required_types': ['protein', 'fiber']
        },
        'snacks': {
            'primary': ['פירות וירקות', 'דגנים וחטיפי אנרגיה'],
            'secondary': ['חטיפים ומתוקים', 'חלב ביצים וסלטים', 'משקאות'],
            'forbidden': [],
            'required_types': ['fiber']
        }
    }

class TestConfig(Config):
    """Test configuration"""
    DEBUG = True
    ATTEMPTS = 10  # Very few attempts for fast tests
    NUTRITION_DATA_FILE = "tests/test_data.json"

# Configuration mapping
config_mapping = {
    'testing': TestConfig,
    'default': Config
}

def get_config(config_name='default'):
    """Get configuration by name"""
    return config_mapping.get(config_name, Config)

def get_available_configs():
    """Get list of available configuration names"""
    return list(config_mapping.keys())