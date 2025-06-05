from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class FoodNutrition(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float

class MenuItem(BaseModel):
    name: str
    portion_grams: float
    category: str
    subcategory: str
    nutrition: FoodNutrition
    item_code: Optional[str] = None

class MenuResponse(BaseModel):
    score: float
    total_nutrition: FoodNutrition
    items: List[MenuItem]

class MenuGenerationResponse(BaseModel):
    success: bool
    menus: List[MenuResponse]
    message: Optional[str] = None
    generation_time_ms: Optional[float] = None

class PriceComparisonResponse(BaseModel):
    success: bool
    price_comparison: Dict[str, Any]
    message: Optional[str] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[str] = None
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str = "2.0.0"
    components: Dict[str, str]