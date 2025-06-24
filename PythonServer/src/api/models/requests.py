from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class NutritionRequest(BaseModel):
    calories: float = Field(..., gt=0, le=5000)
    protein: float = Field(..., ge=0, le=500)
    carbs: float = Field(..., ge=0, le=1000, alias='carbs')
    fat: float = Field(..., ge=0, le=300, alias='fat')
    
    # Option 1: Use meal template name
    meal_template: Optional[str] = Field(None)
    
    # Option 2: Use specific subcategories
    subcategories: Optional[List[str]] = Field(None)
    
    num_items: Optional[int] = Field(None, gt=0, le=20)
    include_prices: Optional[bool] = Field(False)
    
    class Config:
        populate_by_name = True

class PriceComparisonRequest(BaseModel):
    menu_items: List[Dict[str, Any]] = Field(..., description="List of menu items")