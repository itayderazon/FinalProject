# server.py - Complete PostgreSQL-powered server

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
import uvicorn
import logging
from datetime import datetime
import traceback
import os

# Import your existing components
from config import get_config
from src import NutritionInfo, FoodClassifier, PortionCalculator, MealRulesFactory, MenuGenerator

# Import the new SQL providers
from data.sql_providers import SqlFoodProvider, SqlPriceComparison

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables for database
if os.path.exists('.env'):
    from dotenv import load_dotenv
    load_dotenv()

# ====================
# Pydantic Models
# ====================

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

# ====================
# FastAPI Application Setup
# ====================

app = FastAPI(
    title="Nutrition Menu Generator API with PostgreSQL",
    description="API for generating personalized nutrition-based meal menus with PostgreSQL backend",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
menu_generator = None
price_comparison = None

def initialize_services():
    global menu_generator, price_comparison
    try:
        config = get_config('default')
        
        # Initialize SQL-based providers
        food_provider = SqlFoodProvider()
        price_comparison = SqlPriceComparison()
        
        # Test connections
        stats = food_provider.get_provider_stats()
        logger.info(f"📊 Database: {stats['total_foods']} foods, {stats['total_categories']} categories")
        
        # Initialize menu generator
        food_classifier = FoodClassifier(config)
        portion_calculator = PortionCalculator(config)
        meal_rules_factory = MealRulesFactory()
        
        menu_generator = MenuGenerator(
            food_provider, 
            food_classifier, 
            portion_calculator, 
            meal_rules_factory, 
            config
        )
        
        logger.info("✅ All services initialized with PostgreSQL")
        return True
        
    except Exception as e:
        logger.error(f"❌ Service initialization failed: {e}")
        logger.error(traceback.format_exc())
        return False

# ====================
# Helper Functions
# ====================

def format_menu_response(menus, generation_time_ms=None):
    try:
        response_data = MenuGenerationResponse(
            success=True,
            menus=[],
            generation_time_ms=generation_time_ms
        )
        
        menu_list = menus if isinstance(menus, list) else [(menus, 0.0)]
        
        for menu, score in menu_list:
            total_nutrition = menu.get_total_nutrition()
            
            menu_data = MenuResponse(
                score=round(score, 3),
                total_nutrition=FoodNutrition(
                    calories=round(total_nutrition.calories, 1),
                    protein=round(total_nutrition.protein, 1),
                    carbs=round(total_nutrition.carbs, 1),
                    fat=round(total_nutrition.fat, 1)
                ),
                items=[]
            )
            
            for item in menu.items:
                item_nutrition = item.get_nutrition()
                menu_item = MenuItem(
                    name=item.food.name,
                    portion_grams=round(item.portion_grams, 1),
                    category=item.food.category,
                    subcategory=item.food.subcategory,
                    item_code=item.food.item_code,
                    nutrition=FoodNutrition(
                        calories=round(item_nutrition.calories, 1),
                        protein=round(item_nutrition.protein, 1),
                        carbs=round(item_nutrition.carbs, 1),
                        fat=round(item_nutrition.fat, 1)
                    )
                )
                menu_data.items.append(menu_item)
            
            response_data.menus.append(menu_data)
        
        return response_data
    except Exception as e:
        logger.error(f"Error formatting menu response: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to format menu response: {str(e)}")

def extract_menu_items_for_price_comparison(menu_response):
    menu_items = []
    for item in menu_response.items:
        menu_items.append({
            'item_code': item.item_code,
            'portion_grams': item.portion_grams,
            'name': item.name
        })
    return menu_items

def calculate_bmr(height, weight, age, gender):
    if gender.lower() == 'male':
        return 10 * weight + 6.25 * height - 5 * age + 5
    else:
        return 10 * weight + 6.25 * height - 5 * age - 161

def calculate_tdee(bmr, activity_level):
    multipliers = {
        'sedentary': 1.2,
        'lightly_active': 1.375,
        'moderately_active': 1.55,
        'very_active': 1.725,
        'extremely_active': 1.9
    }
    return bmr * multipliers.get(activity_level.lower(), 1.2)

# ====================
# API Endpoints
# ====================

@app.on_event("startup")
async def startup_event():
    if not initialize_services():
        logger.error("Failed to initialize services")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    components = {
        "menu_generator": "healthy" if menu_generator else "unhealthy",
        "price_comparison": "healthy" if price_comparison else "unhealthy",
        "database": "healthy",
        "api_server": "healthy"
    }
    
    return HealthResponse(
        status="healthy" if (menu_generator and price_comparison) else "degraded",
        timestamp=datetime.now().isoformat(),
        components=components
    )

@app.post("/api/nutrition/calculate", response_model=MenuGenerationResponse)
async def calculate_nutrition(request: NutritionRequest):
    if not menu_generator:
        raise HTTPException(status_code=503, detail="Menu generator not initialized")
    
    try:
        start_time = datetime.now()
        
        target_nutrition = NutritionInfo(
            float(request.calories),
            float(request.protein),
            float(request.carbs),
            float(request.fat)
        )
        
        logger.info(f"🔄 Generating menu: {target_nutrition.calories}cal, {request.meal_type or 'any meal'}")
        
        menus = menu_generator.generate_menu(
            target_nutrition,
            request.meal_type,
            request.num_items
        )
        
        generation_time = (datetime.now() - start_time).total_seconds() * 1000
        
        if menus:
            response = format_menu_response(menus, generation_time)
            
            if request.include_prices and price_comparison:
                try:
                    first_menu = response.menus[0]
                    menu_items = extract_menu_items_for_price_comparison(first_menu)
                    price_data = price_comparison.compare_menu_prices(menu_items)
                    
                    return {
                        "success": True,
                        "menus": [menu.dict() for menu in response.menus],
                        "price_comparison": price_data,
                        "generation_time_ms": generation_time
                    }
                except Exception as e:
                    logger.warning(f"Price comparison failed: {e}")
            
            logger.info(f"✅ Generated {len(response.menus)} menu(s)")
            return response
        else:
            raise HTTPException(status_code=404, detail="No valid menus could be generated")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in calculate_nutrition: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/price/compare", response_model=PriceComparisonResponse)
async def compare_prices(request: PriceComparisonRequest):
    if not price_comparison:
        raise HTTPException(status_code=503, detail="Price comparison service not initialized")
    
    try:
        logger.info(f"🔄 Comparing prices for {len(request.menu_items)} items")
        price_data = price_comparison.compare_menu_prices(request.menu_items)
        return PriceComparisonResponse(success=True, price_comparison=price_data)
        
    except Exception as e:
        logger.error(f"Error in price comparison: {e}")
        raise HTTPException(status_code=500, detail=f"Price comparison failed: {str(e)}")

@app.post("/api/price/cheapest-combination")
async def get_cheapest_combination(request: PriceComparisonRequest):
    if not price_comparison:
        raise HTTPException(status_code=503, detail="Price comparison service not initialized")
    
    try:
        logger.info(f"🔄 Finding cheapest combination for {len(request.menu_items)} items")
        cheapest_data = price_comparison.get_cheapest_combination(request.menu_items)
        return {"success": True, "cheapest_combination": cheapest_data}
        
    except Exception as e:
        logger.error(f"Error finding cheapest combination: {e}")
        raise HTTPException(status_code=500, detail=f"Cheapest combination calculation failed: {str(e)}")

@app.get("/api/price/supermarkets")
async def get_available_supermarkets():
    if not price_comparison:
        raise HTTPException(status_code=503, detail="Price comparison service not initialized")
    
    try:
        return {
            "success": True,
            "supermarkets": price_comparison.supermarkets,
            "total_supermarkets": len(price_comparison.supermarkets)
        }
    except Exception as e:
        logger.error(f"Error getting supermarkets: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get supermarkets: {str(e)}")

@app.post("/api/nutrition/metabolism")
async def calculate_metabolism(request: UserProfileRequest):
    try:
        bmr = calculate_bmr(request.height, request.weight, request.age, request.gender)
        tdee = calculate_tdee(bmr, request.activity_level)
        
        goal_calories = tdee
        if request.dietary_goal == 'lose':
            goal_calories = tdee - 500
        elif request.dietary_goal == 'gain':
            goal_calories = tdee + 500
        
        return {
            "success": True,
            "bmr": round(bmr, 1),
            "tdee": round(tdee, 1),
            "goal_calories": round(goal_calories, 1),
            "macro_recommendations": {
                "protein": round(request.weight * 2.2, 1),
                "fat": round(goal_calories * 0.25 / 9, 1),
                "carbs": round((goal_calories - (request.weight * 2.2 * 4) - (goal_calories * 0.25)) / 4, 1)
            }
        }
    except Exception as e:
        logger.error(f"Error calculating metabolism: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate metabolism: {str(e)}")

@app.get("/api/nutrition/food-categories")
async def get_food_categories():
    if not menu_generator:
        raise HTTPException(status_code=503, detail="Menu generator not initialized")
    
    try:
        stats = menu_generator.food_provider.get_provider_stats()
        return {
            "success": True,
            "categories": stats['categories'],
            "subcategories": stats['subcategories'],
            "total_foods": stats['total_foods'],
            "total_categories": stats['total_categories'],
            "total_subcategories": stats['total_subcategories']
        }
    except Exception as e:
        logger.error(f"Error getting food categories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get food categories: {str(e)}")

@app.get("/api/nutrition/search/{query}")
async def search_foods(query: str):
    if not menu_generator:
        raise HTTPException(status_code=503, detail="Menu generator not initialized")
    
    try:
        foods = menu_generator.food_provider.search_foods(query)
        
        results = []
        for food in foods[:50]:
            results.append({
                'item_code': food.item_code,
                'name': food.name,
                'category': food.category,
                'subcategory': food.subcategory,
                'nutrition': food.nutrition_per_100g.to_dict()
            })
        
        return {
            "success": True,
            "query": query,
            "results": results,
            "total_found": len(foods)
        }
    except Exception as e:
        logger.error(f"Error searching foods: {e}")
        raise HTTPException(status_code=500, detail=f"Food search failed: {str(e)}")

# ====================
# Error Handlers
# ====================

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content=ErrorResponse(
            error="Invalid input value",
            details=str(exc),
            timestamp=datetime.now().isoformat()
        ).dict()
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            details="An unexpected error occurred",
            timestamp=datetime.now().isoformat()
        ).dict()
    )

# ====================
# Main Application Runner
# ====================

if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )