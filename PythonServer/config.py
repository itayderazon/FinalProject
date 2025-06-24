# config.py - Configuration settings with category preferences

import os

class Config:
    """Base configuration class"""
    
    # Data file paths
    DATA_DIR = "data"
    NUTRITION_DATA_FILE = os.path.join(DATA_DIR, "nutrition_data.json")
    CATEGORIES_DATA_FILE = os.path.join(DATA_DIR, "categories_extracted.json")
    
    # Algorithm settings
    DEFAULT_ATTEMPTS = 300  # Number of attempts to generate menus
    
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
    
   
    
    # Food classifications
    FOOD_CLASSIFICATIONS = {
        'high_sugar': ['ממתקים', 'סוכריות ומסטיקים', 'דבש, ריבה וממרחים'],
        'protein': ['בשר  ודגים', 'גבינות', 'חלב', 'יוגורט ומעדני חלב'],
        'fiber': ['פירות וירקות', 'דגנים וחטיפי אנרגיה', 'אורז וקטניות'],
        'processed': ['שימורים', 'נקניקיות ונקניקים', 'אוכל להכנה מהירה'],
        'wholesome': ['אורגני וטבעוני', 'ללא גלוטן', 'פירות וירקות']
    }
    # Meal rules
    MEAL_SUBCATEGORY_TEMPLATES = {
        'breakfast': [
            'חלב', 'גבינות', 'יוגורט ומעדני חלב', 'חמאה מרגרינה שמנת',
            'לחם, פיתה, לחמניה', 'דבש, ריבה וממרחים',
            'פיצוחים ופירות יבשים', 'סלטים'
        ],
        'lunch': [
            'בשרים על האש', 'נקניקיות ונקניקים', 'בשר קפוא',
            'אורז וקטניות', 'פסטה, פתיתים, קוסקוס', 
            'גבינות', 'סלטים', 'מזון מצונן',
            'מרקים ותבשילים', 'שימורים'
        ],
        'dinner': [
            'בשרים על האש', 'בשר קפוא', 'עוף קפוא', 'נקניקיות ונקניקים',
            'אוכל להכנה מהירה', 'פיצות, מאפים ובצקים קפואים',
            'אורז וקטניות', 'פסטה, פתיתים, קוסקוס', 'מרקים ותבשילים'
        ],
        'snack': [
            'פיצוחים ופירות יבשים', 'דגנים וחטיפי אנרגיה',
            'יוגורט ומעדני חלב', 'גבינות', 'חטיפים מלוחים',
            'פריכיות וקרקרים', 'וופלים וביסקוויטים'
        ]
    }


class TestConfig(Config):
    """Test configuration"""
    DEBUG = True
    DEFAULT_ATTEMPTS = 10  # Very few attempts for fast tests
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