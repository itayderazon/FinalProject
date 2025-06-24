# src/api/models/catalog_responses.py - Response models for catalog API

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class NutritionResponse(BaseModel):
    """Nutrition information response"""
    calories: float
    protein: float
    carbs: float
    fat: float

class PriceStatsResponse(BaseModel):
    """Price statistics response"""
    minPrice: Optional[float] = None
    maxPrice: Optional[float] = None
    avgPrice: Optional[float] = None
    storeCount: int = 0

class CatalogItemResponse(BaseModel):
    """Catalog item response"""
    item_code: str
    name: str
    category: str
    subcategory: str
    brand: str = ""
    description: str = ""
    nutrition_per_100g: Optional[NutritionResponse] = None
    price_stats: Optional[PriceStatsResponse] = None
    allergens: List[str] = []
    is_menu_eligible: bool = False
    has_nutrition_info: bool = False

class PortionSpecificationResponse(BaseModel):
    """Portion specification response"""
    grams: float
    description: str
    min_grams: float
    max_grams: float

class CatalogMenuItemResponse(BaseModel):
    """Catalog menu item response"""
    catalog_item: CatalogItemResponse
    portion: PortionSpecificationResponse
    nutrition: NutritionResponse
    estimated_cost: Optional[float] = None

class CatalogSearchResponse(BaseModel):
    """Catalog search response"""
    success: bool = True
    query: str
    items: List[CatalogItemResponse]
    total_found: int
    menu_eligible_count: int
    categories: List[str] = []

class RecommendedPortionsResponse(BaseModel):
    """Recommended portions response"""
    success: bool = True
    item_code: str
    item_name: str
    portions: List[PortionSpecificationResponse]

class CatalogCategoriesResponse(BaseModel):
    """Catalog categories response"""
    success: bool = True
    categories: Dict[str, List[str]]

class MenuFromCatalogResponse(BaseModel):
    """Menu created from catalog items response"""
    success: bool = True
    menu_items: List[CatalogMenuItemResponse]
    total_nutrition: NutritionResponse
    total_estimated_cost: Optional[float] = None
    target_calories_met: Optional[bool] = None
    calories_difference: Optional[float] = None
    portion_adjustments_made: bool = False
    price_comparison: Optional[Dict[str, Any]] = None

class AddItemToMenuResponse(BaseModel):
    """Add item to menu response"""
    success: bool = True
    message: str
    menu_item: CatalogMenuItemResponse
    validation_warnings: List[str] = []

class BulkAddItemsResponse(BaseModel):
    """Bulk add items response"""
    success: bool = True
    message: str
    added_items: List[CatalogMenuItemResponse]
    failed_items: List[Dict[str, str]] = []
    total_nutrition: NutritionResponse
    total_estimated_cost: Optional[float] = None

class CatalogErrorResponse(BaseModel):
    """Error response for catalog operations"""
    success: bool = False
    error: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None 