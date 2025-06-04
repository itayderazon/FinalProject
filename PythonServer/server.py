from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
import uvicorn
import logging
from datetime import datetime
import traceback

# Import your existing components
from config import get_config
from src import NutritionInfo, JsonFoodProvider, FoodClassifier, PortionCalculator, MealRulesFactory, MenuGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ====================
# Pydantic Models for Request/Response Validation
# ====================

class NutritionRequest(BaseModel):
    """Request model for nutrition-based menu generation"""
    calories: float = Field(..., gt=0, le=5000, description="Target calories")
    protein: float = Field(..., ge=0, le=500, description="Target protein in grams")
    carbs: float = Field(..., ge=0, le=1000, description="Target carbs in grams") 
    fat: float = Field(..., ge=0, le=300, description="Target fat in grams")
    meal_type: Optional[str] = Field(None, description="Type of meal (breakfast, lunch, dinner, snack)")
    num_items: Optional[int] = Field(None, gt=0, le=20, description="Number of items in menu")
    
    @validator('meal_type')
    def validate_meal_type(cls, v):
        if v is not None:
            allowed_types = ['breakfast', 'lunch', 'dinner', 'snack']
            if v.lower() not in allowed_types:
                raise ValueError(f'meal_type must be one of: {allowed_types}')
        return v.lower() if v else None

class UserProfileRequest(BaseModel):
    """Request model for user profile-based calculations"""
    height: float = Field(..., gt=100, le=250, description="Height in cm")
    weight: float = Field(..., gt=30, le=300, description="Weight in kg")
    age: int = Field(..., gt=13, le=120, description="Age in years")
    gender: str = Field(..., description="Gender (male, female, other)")
    activity_level: str = Field(..., description="Activity level")
    dietary_goal: str = Field(..., description="Dietary goal (maintain, lose, gain)")
    
    @validator('gender')
    def validate_gender(cls, v):
        allowed_genders = ['male', 'female', 'other']
        if v.lower() not in allowed_genders:
            raise ValueError(f'gender must be one of: {allowed_genders}')
        return v.lower()
    
    @validator('activity_level')
    def validate_activity_level(cls, v):
        allowed_levels = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']
        if v.lower() not in allowed_levels:
            raise ValueError(f'activity_level must be one of: {allowed_levels}')
        return v.lower()
    
    @validator('dietary_goal')
    def validate_dietary_goal(cls, v):
        allowed_goals = ['maintain', 'lose', 'gain']
        if v.lower() not in allowed_goals:
            raise ValueError(f'dietary_goal must be one of: {allowed_goals}')
        return v.lower()

class PersonalizedMenuRequest(BaseModel):
    """Request model combining user profile with menu preferences"""
    user_profile: UserProfileRequest
    meal_type: Optional[str] = None
    num_items: Optional[int] = Field(None, gt=0, le=20)
    dietary_restrictions: Optional[List[str]] = Field(default_factory=list)
    preferred_categories: Optional[List[str]] = Field(default_factory=list)

class FoodNutrition(BaseModel):
    """Nutrition information for a food item"""
    calories: float
    protein: float
    carbs: float
    fat: float

class MenuItem(BaseModel):
    """Individual menu item"""
    name: str
    portion_grams: float
    category: str
    subcategory: str
    nutrition: FoodNutrition

class MenuResponse(BaseModel):
    """Single menu response"""
    score: float
    total_nutrition: FoodNutrition
    items: List[MenuItem]

class MenuGenerationResponse(BaseModel):
    """Response model for menu generation"""
    success: bool
    menus: List[MenuResponse]
    message: Optional[str] = None
    generation_time_ms: Optional[float] = None

class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    error: str
    details: Optional[str] = None
    timestamp: str

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    version: str = "1.0.0"
    components: Dict[str, str]

# ====================
# FastAPI Application Setup
# ====================

app = FastAPI(
    title="Nutrition Menu Generator API",
    description="API for generating personalized nutrition-based meal menus",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Add your Node.js server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global menu generator instance
menu_generator = None

def initialize_menu_generator():
    """Initialize the menu generator on startup"""
    global menu_generator
    try:
        config = get_config('default')
        
        food_provider = JsonFoodProvider(config.NUTRITION_DATA_FILE)
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
        
        logger.info("✅ Menu generator initialized successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize menu generator: {e}")
        logger.error(traceback.format_exc())
        return False

# ====================
# Helper Functions
# ====================

def format_menu_response(menus, generation_time_ms: float = None) -> MenuGenerationResponse:
    """Format menu generation response"""
    try:
        response_data = MenuGenerationResponse(
            success=True,
            menus=[],
            generation_time_ms=generation_time_ms
        )
        
        # Handle both single menu and multiple menus
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
        raise HTTPException(
            status_code=500,
            detail=f"Failed to format menu response: {str(e)}"
        )

def calculate_bmr(height: float, weight: float, age: int, gender: str) -> float:
    """Calculate Basal Metabolic Rate using Mifflin-St Jeor equation"""
    if gender.lower() == 'male':
        return 10 * weight + 6.25 * height - 5 * age + 5
    else:  # female or other
        return 10 * weight + 6.25 * height - 5 * age - 161

def calculate_tdee(bmr: float, activity_level: str) -> float:
    """Calculate Total Daily Energy Expenditure"""
    activity_multipliers = {
        'sedentary': 1.2,
        'lightly_active': 1.375,
        'moderately_active': 1.55,
        'very_active': 1.725,
        'extremely_active': 1.9
    }
    return bmr * activity_multipliers.get(activity_level.lower(), 1.2)

# ====================
# API Endpoints
# ====================

@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    if not initialize_menu_generator():
        logger.error("Failed to initialize menu generator - API may not function correctly")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    components = {
        "menu_generator": "healthy" if menu_generator else "unhealthy",
        "api_server": "healthy"
    }
    
    return HealthResponse(
        status="healthy" if menu_generator else "degraded",
        timestamp=datetime.now().isoformat(),
        components=components
    )

@app.post("/api/nutrition/calculate", response_model=MenuGenerationResponse)
async def calculate_nutrition(request: NutritionRequest):
    """Generate menu based on specific nutrition targets"""
    if not menu_generator:
        raise HTTPException(
            status_code=503,
            detail="Menu generator not initialized"
        )
    
    try:
        start_time = datetime.now()
        
        # Create target nutrition
        target_nutrition = NutritionInfo(
            float(request.calories),
            float(request.protein),
            float(request.carbs),
            float(request.fat)
        )
        
        logger.info(f"🔄 Generating menu: {target_nutrition.calories}cal, {request.meal_type or 'any meal'}")
        
        # Generate menu
        menus = menu_generator.generate_menu(
            target_nutrition,
            request.meal_type,
            request.num_items
        )
        
        generation_time = (datetime.now() - start_time).total_seconds() * 1000
        
        if menus:
            response = format_menu_response(menus, generation_time)
            logger.info(f"✅ Successfully generated {len(response.menus)} menu(s)")
            return response
        else:
            raise HTTPException(
                status_code=404,
                detail="No valid menus could be generated with the given constraints"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in calculate_nutrition: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/api/nutrition/metabolism")
async def calculate_metabolism(request: UserProfileRequest):
    """Calculate BMR and TDEE for a user"""
    try:
        bmr = calculate_bmr(request.height, request.weight, request.age, request.gender)
        tdee = calculate_tdee(bmr, request.activity_level)
        
        # Calculate calorie targets based on goal
        goal_calories = tdee
        if request.dietary_goal == 'lose':
            goal_calories = tdee - 500  # 500 calorie deficit
        elif request.dietary_goal == 'gain':
            goal_calories = tdee + 500  # 500 calorie surplus
        
        return {
            "success": True,
            "bmr": round(bmr, 1),
            "tdee": round(tdee, 1),
            "goal_calories": round(goal_calories, 1),
            "macro_recommendations": {
                "protein": round(request.weight * 2.2, 1),  # 2.2g per kg body weight
                "fat": round(goal_calories * 0.25 / 9, 1),  # 25% of calories from fat
                "carbs": round((goal_calories - (request.weight * 2.2 * 4) - (goal_calories * 0.25)) / 4, 1)
            }
        }
    except Exception as e:
        logger.error(f"Error calculating metabolism: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate metabolism: {str(e)}"
        )

@app.post("/api/nutrition/personalized-menu", response_model=MenuGenerationResponse)
async def generate_personalized_menu(request: PersonalizedMenuRequest):
    """Generate personalized menu based on user profile"""
    if not menu_generator:
        raise HTTPException(
            status_code=503,
            detail="Menu generator not initialized"
        )
    
    try:
        start_time = datetime.now()
        
        # Calculate user's calorie needs
        bmr = calculate_bmr(
            request.user_profile.height,
            request.user_profile.weight, 
            request.user_profile.age,
            request.user_profile.gender
        )
        tdee = calculate_tdee(bmr, request.user_profile.activity_level)
        
        # Adjust for dietary goal
        target_calories = tdee
        if request.user_profile.dietary_goal == 'lose':
            target_calories = tdee - 500
        elif request.user_profile.dietary_goal == 'gain':
            target_calories = tdee + 500
        
        # Calculate macros (using standard ratios)
        protein = request.user_profile.weight * 2.2  # 2.2g per kg
        fat = target_calories * 0.25 / 9  # 25% calories from fat
        carbs = (target_calories - (protein * 4) - (fat * 9)) / 4  # Remaining calories from carbs
        
        # Create target nutrition
        target_nutrition = NutritionInfo(
            float(target_calories),
            float(protein),
            float(carbs),
            float(fat)
        )
        
        logger.info(f"🔄 Generating personalized menu for user: {target_calories}cal")
        
        # Generate menu
        menus = menu_generator.generate_menu(
            target_nutrition,
            request.meal_type,
            request.num_items
        )
        
        generation_time = (datetime.now() - start_time).total_seconds() * 1000
        
        if menus:
            response = format_menu_response(menus, generation_time)
            logger.info(f"✅ Successfully generated personalized menu")
            return response
        else:
            raise HTTPException(
                status_code=404,
                detail="No valid personalized menus could be generated"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_personalized_menu: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/api/nutrition/food-categories")
async def get_food_categories():
    """Get available food categories and subcategories"""
    if not menu_generator:
        raise HTTPException(
            status_code=503,
            detail="Menu generator not initialized"
        )
    
    try:
        # Get all foods from the provider
        all_foods = menu_generator.food_provider.get_all_foods()
        
        categories = {}
        for food in all_foods:
            if food.category not in categories:
                categories[food.category] = set()
            categories[food.category].add(food.subcategory)
        
        # Convert sets to lists for JSON serialization
        categories = {k: list(v) for k, v in categories.items()}
        
        return {
            "success": True,
            "categories": categories,
            "total_foods": len(all_foods)
        }
    except Exception as e:
        logger.error(f"Error getting food categories: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get food categories: {str(e)}"
        )

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