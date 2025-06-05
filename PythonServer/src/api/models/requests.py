from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any

class NutritionRequest(BaseModel):
    calories: float = Field(..., gt=0, le=5000)
    protein: float = Field(..., ge=0, le=500)
    carbs: float = Field(..., ge=0, le=1000)
    fat: float = Field(..., ge=0, le=300)
    meal_type: Optional[str] = Field(None)
    num_items: Optional[int] = Field(None, gt=0, le=20)
    include_prices: Optional[bool] = Field(False)
    
    @validator('meal_type')
    def validate_meal_type(cls, v):
        if v is not None:
            allowed_types = ['breakfast', 'lunch', 'dinner', 'snack']
            if v.lower() not in allowed_types:
                raise ValueError(f'meal_type must be one of: {allowed_types}')
        return v.lower() if v else None

class PriceComparisonRequest(BaseModel):
    menu_items: List[Dict[str, Any]] = Field(..., description="List of menu items")

class UserProfileRequest(BaseModel):
    height: float = Field(..., gt=100, le=250)
    weight: float = Field(..., gt=30, le=300)
    age: int = Field(..., gt=13, le=120)
    gender: str
    activity_level: str
    dietary_goal: str
    
    @validator('gender')
    def validate_gender(cls, v):
        allowed = ['male', 'female', 'other']
        if v.lower() not in allowed:
            raise ValueError(f'gender must be one of: {allowed}')
        return v.lower()
    
    @validator('activity_level')
    def validate_activity_level(cls, v):
        allowed = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']
        if v.lower() not in allowed:
            raise ValueError(f'activity_level must be one of: {allowed}')
        return v.lower()
    
    @validator('dietary_goal')
    def validate_dietary_goal(cls, v):
        allowed = ['maintain', 'lose', 'gain']
        if v.lower() not in allowed:
            raise ValueError(f'dietary_goal must be one of: {allowed}')
        return v.lower()