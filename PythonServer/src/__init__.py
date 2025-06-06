# src/__init__.py - Main package

from .models import NutritionInfo, Food, MenuItem, Menu
from .services import FoodClassifier, PortionCalculator, MealRulesFactory
from .algorithm import MenuGenerator

__all__ = [
    'NutritionInfo',
    'Food', 
    'MenuItem',
    'Menu',
    'FoodClassifier',
    'PortionCalculator',
    'MealRulesFactory',
    'MenuGenerator'
]