# src/api/models/catalog_requests.py - Request models for catalog API

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class CatalogSearchRequest(BaseModel):
    """Request model for catalog search"""
    query: str = Field(..., min_length=0, max_length=200, description="Search query")
    category: Optional[str] = Field(None, description="Filter by category")
    subcategory: Optional[str] = Field(None, description="Filter by subcategory")
    has_nutrition: Optional[bool] = Field(True, description="Filter items with nutrition info")
    menu_eligible_only: Optional[bool] = Field(True, description="Return only menu-eligible items")
    limit: Optional[int] = Field(50, ge=1, le=100, description="Maximum number of results")
    
    class Config:
        populate_by_name = True

class PortionSpecificationRequest(BaseModel):
    """Request model for portion specification"""
    grams: float = Field(..., gt=0, le=1000, description="Portion size in grams")
    description: Optional[str] = Field(None, max_length=100, description="Portion description")
    min_grams: Optional[float] = Field(None, gt=0, description="Minimum allowed grams")
    max_grams: Optional[float] = Field(None, gt=0, le=1000, description="Maximum allowed grams")
    
    class Config:
        populate_by_name = True

class AddCatalogItemToMenuRequest(BaseModel):
    """Request model for adding catalog item to menu"""
    item_code: str = Field(..., min_length=1, description="Catalog item code")
    portion: PortionSpecificationRequest = Field(..., description="Portion specification")
    
    class Config:
        populate_by_name = True

class BulkAddCatalogItemsRequest(BaseModel):
    """Request model for adding multiple catalog items to menu"""
    items: List[AddCatalogItemToMenuRequest] = Field(..., min_items=1, max_items=20, description="List of items to add")
    validate_nutrition: Optional[bool] = Field(True, description="Validate nutrition requirements")
    
    class Config:
        populate_by_name = True

class MenuFromCatalogRequest(BaseModel):
    """Request model for creating a menu from catalog items"""
    catalog_items: List[AddCatalogItemToMenuRequest] = Field(..., min_items=1, max_items=20)
    target_calories: Optional[float] = Field(None, gt=0, le=5000, description="Target calories for menu")
    adjust_portions: Optional[bool] = Field(False, description="Automatically adjust portions to meet target")
    include_prices: Optional[bool] = Field(False, description="Include price comparison")
    
    class Config:
        populate_by_name = True 