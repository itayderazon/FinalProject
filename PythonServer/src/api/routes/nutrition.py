from fastapi import APIRouter, HTTPException
from datetime import datetime
import logging

from api.models.requests import NutritionRequest, UserProfileRequest
from api.models.responses import MenuGenerationResponse
from api.services.app_service import app_service
from api.utils.formatters import format_menu_response, extract_menu_items_for_price_comparison
from api.utils.calculations import calculate_bmr, calculate_tdee
from src.models.nutrition import NutritionInfo

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/calculate", response_model=MenuGenerationResponse)
async def calculate_nutrition(request: NutritionRequest):
    if not app_service.menu_generator:
        raise HTTPException(status_code=503, detail="Menu generator not initialized")
    
    try:
        start_time = datetime.now()
        
        target_nutrition = NutritionInfo(
            float(request.calories),
            float(request.protein),
            float(request.carbs),
            float(request.fat)
        )
        
        logger.info(f"🔄 Generating menu: {target_nutrition.calories}cal")
        
        menus = app_service.menu_generator.generate_menu(
            target_nutrition,
            request.meal_type,
            request.num_items
        )
        
        generation_time = (datetime.now() - start_time).total_seconds() * 1000
        
        if menus:
            response = format_menu_response(menus, generation_time)
            
            if request.include_prices and app_service.price_comparison:
                try:
                    first_menu = response.menus[0]
                    menu_items = extract_menu_items_for_price_comparison(first_menu)
                    price_data = app_service.price_comparison.compare_menu_prices(menu_items)
                    
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

@router.post("/metabolism")
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

@router.get("/food-categories")
async def get_food_categories():
    if not app_service.menu_generator:
        raise HTTPException(status_code=503, detail="Menu generator not initialized")
    
    try:
        stats = app_service.menu_generator.food_provider.get_provider_stats()
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

@router.get("/search/{query}")
async def search_foods(query: str):
    if not app_service.menu_generator:
        raise HTTPException(status_code=503, detail="Menu generator not initialized")
    
    try:
        foods = app_service.menu_generator.food_provider.search_foods(query)
        
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

nutrition_router = router