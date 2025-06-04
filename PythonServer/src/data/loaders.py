# src/data/loaders.py - Data loading services

import json
import os
from ..models import NutritionInfo, Food

class DataLoader:
    """Base class for loading data - Open/Closed principle"""
    
    def load(self):
        """Load data. Override in subclasses."""
        raise NotImplementedError

class JsonDataLoader(DataLoader):
    """Loads data from JSON file"""
    
    def __init__(self, file_path):
        self.file_path = file_path
    
    def load(self):
        """Load JSON data from file"""
        try:
            if not os.path.exists(self.file_path):
                print(f"Warning: File {self.file_path} not found")
                return []
            
            with open(self.file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
                print(f"Loaded JSON data from {self.file_path}")
                return data
                
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in {self.file_path}: {e}")
            return []
        except Exception as e:
            print(f"Error loading {self.file_path}: {e}")
            return []

class FoodDataProcessor:
    """Responsible ONLY for converting JSON data to Food objects"""
    
    def __init__(self):
        self.processed_count = 0
        self.skipped_count = 0
    
    def process_food_data(self, json_data):
        """Convert JSON data to Food objects"""
        foods = []
        self.processed_count = 0
        self.skipped_count = 0
        
        if not isinstance(json_data, list):
            print("Error: JSON data should be a list of food items")
            return foods
        
        for item in json_data:
            try:
                food = self._process_single_food_item(item)
                if food:
                    foods.append(food)
                    self.processed_count += 1
                else:
                    self.skipped_count += 1
                    
            except Exception as e:
                print(f"Error processing food item: {e}")
                self.skipped_count += 1
                continue
        
        print(f"Processed {self.processed_count} foods, skipped {self.skipped_count}")
        return foods
    
    def _process_single_food_item(self, item):
        """Process a single food item from JSON"""
        # Handle different possible JSON formats
        item_code = self._get_value(item, ['item_code', 'itemCode', 'id'])
        name = self._get_value(item, ['name', 'description']) or item_code
        category = self._get_value(item, ['category']) or ''
        subcategory = self._get_value(item, ['subcategory']) or ''
        
        # Extract nutrition data
        calories = self._get_numeric_value(item, ['calories', 'cal', 'energy'])
        protein = self._get_numeric_value(item, ['protein', 'proteins'])
        carbs = self._get_numeric_value(item, ['total_carbs', 'carbs', 'carbohydrates'])
        fat = self._get_numeric_value(item, ['total_fat', 'fat', 'fats'])
        sodium = self._get_numeric_value(item, ['sodium', 'salt']) or 0
        
        # Skip items with missing essential data
        if not item_code:
            return None
        if any(value is None for value in [calories, protein, carbs, fat]):
            return None
        
        # Create nutrition info
        try:
            nutrition = NutritionInfo(calories, protein, carbs, fat)
        except Exception:
            return None
        
        # Skip items with invalid nutrition
        if not nutrition.is_valid():
            return None
        
        # Create and return food object
        return Food(item_code, name, category, subcategory, nutrition, sodium)
    
    def _get_value(self, item, possible_keys):
        """Get value from item using possible key names"""
        for key in possible_keys:
            if key in item and item[key] is not None:
                value = item[key]
                if isinstance(value, str):
                    value = value.strip()
                return value
        return None
    
    def _get_numeric_value(self, item, possible_keys):
        """Get numeric value from item"""
        value = self._get_value(item, possible_keys)
        if value is None:
            return None
        
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def get_processing_stats(self):
        """Get processing statistics"""
        return {
            'processed': self.processed_count,
            'skipped': self.skipped_count,
            'total': self.processed_count + self.skipped_count,
            'success_rate': (self.processed_count / (self.processed_count + self.skipped_count) * 100) 
                          if (self.processed_count + self.skipped_count) > 0 else 0
        }

class CategoryDataLoader:
    """Loads category data from categories_extracted.json"""
    
    def __init__(self, categories_file_path):
        self.categories_file_path = categories_file_path
        self.json_loader = JsonDataLoader(categories_file_path)
    
    def load_categories(self):
        """Load category information"""
        category_data = self.json_loader.load()
        if not category_data:
            return self._get_empty_categories()
        
        try:
            return {
                'summary': category_data.get('summary', {}),
                'categories': [cat['name'] for cat in category_data.get('categories', [])],
                'subcategories': [sub['name'] for sub in category_data.get('subcategories', [])],
                'category_mapping': category_data.get('category_mapping', {})
            }
        except Exception as e:
            print(f"Error processing category data: {e}")
            return self._get_empty_categories()
    
    def _get_empty_categories(self):
        """Return empty categories structure"""
        return {
            'summary': {},
            'categories': [],
            'subcategories': [],
            'category_mapping': {}
        }

class ConfigDataLoader:
    """Loads configuration from JSON files"""
    
    def __init__(self, config_file_path):
        self.config_file_path = config_file_path
        self.json_loader = JsonDataLoader(config_file_path)
    
    def load_config(self):
        """Load configuration data"""
        return self.json_loader.load()
    
    def save_config(self, config_data):
        """Save configuration data"""
        try:
            with open(self.config_file_path, 'w', encoding='utf-8') as file:
                json.dump(config_data, file, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Error saving config: {e}")
            return False