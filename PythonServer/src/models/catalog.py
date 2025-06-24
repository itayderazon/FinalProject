# src/models/catalog.py - Catalog item models for menu integration

from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from .nutrition import NutritionInfo
from .food import Food, MenuItem

@dataclass
class CatalogItem:
    """Represents a product from the external catalog"""
    
    def __init__(self, item_code: str, name: str, category: str, subcategory: str, 
                 brand: Optional[str] = None, description: Optional[str] = None,
                 nutrition_per_100g: Optional[NutritionInfo] = None, 
                 price_stats: Optional[Dict[str, Any]] = None,
                 allergens: Optional[List[str]] = None):
        self.item_code = str(item_code)
        self.name = str(name)
        self.category = str(category)
        self.subcategory = str(subcategory)
        self.brand = brand or "כללי"
        self.description = description or ""
        self.nutrition_per_100g = nutrition_per_100g
        self.price_stats = price_stats or {}
        self.allergens = allergens or []
    
    def to_food(self) -> Food:
        """Convert catalog item to Food model for menu generation"""
        nutrition = self.nutrition_per_100g or NutritionInfo(0, 0, 0, 0)
        return Food(
            item_code=self.item_code,
            name=self.name,
            category=self.category,
            subcategory=self.subcategory,
            nutrition_per_100g=nutrition
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'item_code': self.item_code,
            'name': self.name,
            'category': self.category,
            'subcategory': self.subcategory,
            'brand': self.brand,
            'description': self.description,
            'nutrition_per_100g': self.nutrition_per_100g.to_dict() if self.nutrition_per_100g else None,
            'price_stats': self.price_stats,
            'allergens': self.allergens
        }
    
    def has_nutrition_info(self) -> bool:
        """Check if item has valid nutrition information"""
        return (self.nutrition_per_100g is not None and 
                self.nutrition_per_100g.calories > 0)
    
    def is_menu_eligible(self) -> bool:
        """Check if item is eligible for menu inclusion"""
        return (self.has_nutrition_info() and 
                self.category and 
                self.subcategory and
                len(self.name.strip()) > 0)

@dataclass 
class PortionSpecification:
    """Represents portion requirements for menu items"""
    
    def __init__(self, grams: float, description: Optional[str] = None,
                 min_grams: Optional[float] = None, max_grams: Optional[float] = None):
        self.grams = float(grams)
        self.description = description or f"{grams}g"
        self.min_grams = float(min_grams) if min_grams else max(10.0, grams * 0.5)
        self.max_grams = float(max_grams) if max_grams else min(1000.0, grams * 2.0)
    
    def validate(self) -> bool:
        """Validate portion specification"""
        return (self.min_grams <= self.grams <= self.max_grams and 
                self.grams > 0 and 
                self.max_grams <= 1000.0)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'grams': self.grams,
            'description': self.description,
            'min_grams': self.min_grams,
            'max_grams': self.max_grams
        }

class CatalogMenuItem:
    """Represents a menu item created from a catalog item with portion specification"""
    
    def __init__(self, catalog_item: CatalogItem, portion: PortionSpecification):
        self.catalog_item = catalog_item
        self.portion = portion
        
        # Validate the combination
        if not catalog_item.is_menu_eligible():
            raise ValueError(f"Catalog item '{catalog_item.name}' is not eligible for menu inclusion")
        
        if not portion.validate():
            raise ValueError(f"Invalid portion specification: {portion.grams}g")
    
    def to_menu_item(self) -> MenuItem:
        """Convert to MenuItem for use in menu generation"""
        food = self.catalog_item.to_food()
        return MenuItem(food, self.portion.grams)
    
    def get_nutrition(self) -> NutritionInfo:
        """Get nutrition information for this portion"""
        if not self.catalog_item.nutrition_per_100g:
            return NutritionInfo(0, 0, 0, 0)
        
        factor = self.portion.grams / 100.0
        return self.catalog_item.nutrition_per_100g.multiply(factor)
    
    def get_estimated_cost(self) -> Optional[float]:
        """Get estimated cost based on price stats and portion size"""
        if not self.catalog_item.price_stats or 'minPrice' not in self.catalog_item.price_stats:
            return None
        
        # Use minimum price per 100g as estimate
        price_per_100g = self.catalog_item.price_stats['minPrice']
        return (self.portion.grams / 100.0) * price_per_100g
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'catalog_item': self.catalog_item.to_dict(),
            'portion': self.portion.to_dict(),
            'nutrition': self.get_nutrition().to_dict(),
            'estimated_cost': self.get_estimated_cost()
        }
    
    def __str__(self):
        nutrition = self.get_nutrition()
        cost = self.get_estimated_cost()
        cost_str = f" (~₪{cost:.2f})" if cost else ""
        return f"{self.catalog_item.name} - {self.portion.description} ({nutrition.calories:.1f}cal{cost_str})" 