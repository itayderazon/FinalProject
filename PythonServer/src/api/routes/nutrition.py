from fastapi import APIRouter, HTTPException
from datetime import datetime
import logging

from src.api.models.requests import NutritionRequest, UserProfileRequest
from src.api.models.responses import MenuGenerationResponse
from src.api.services.app_service import app_service
from src.api.utils.formatters import format_menu_response, extract_menu_items_for_price_comparison
from src.api.utils.calculations import calculate_bmr, calculate_tdee
from src.models.nutrition import NutritionInfo

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/calculate")
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
        
        logger.info(f"Generating menu: {target_nutrition.calories}cal")
        
        menus = app_service.menu_generator.generate_menu(
            target_nutrition,
            request.meal_type,
            request.num_items
        )
        
        generation_time = (datetime.now() - start_time).total_seconds() * 1000
        
        if menus:
            response = format_menu_response(menus, generation_time)
            
            # Add price comparison for ALL menus if requested
            if request.include_prices and app_service.price_comparison:
                try:
                    logger.info(f"Starting price comparison for {len(response.menus)} menus")
                    
                    # Add price comparison to each menu
                    enhanced_menus = []
                    for i, menu_response in enumerate(response.menus):
                        try:
                            # Extract menu items for price comparison
                            menu_items = extract_menu_items_for_price_comparison(menu_response)
                            
                            # Get price data for this specific menu
                            price_data = app_service.price_comparison.compare_menu_prices(menu_items)
                            
                            # Create enhanced menu response with prices
                            enhanced_menu = {
                                "score": menu_response.score,
                                "total_nutrition": menu_response.total_nutrition.dict(),
                                "items": [item.dict() for item in menu_response.items],
                                "price_comparison": price_data
                            }
                            enhanced_menus.append(enhanced_menu)
                            
                        except Exception as menu_price_error:
                            logger.error(f"Price comparison failed for menu {i+1}: {menu_price_error}")
                            # Add menu without price data if price comparison fails
                            enhanced_menu = {
                                "score": menu_response.score,
                                "total_nutrition": menu_response.total_nutrition.dict(),
                                "items": [item.dict() for item in menu_response.items],
                                "price_comparison": {"error": f"Price data unavailable: {str(menu_price_error)}"}
                            }
                            enhanced_menus.append(enhanced_menu)
                    
                    logger.info(f"Price comparison completed for {len(enhanced_menus)} menus")
                    
                    enhanced_response = {
                        "success": True,
                        "menus": enhanced_menus,
                        "generation_time_ms": generation_time
                    }
                    
                    return enhanced_response
                    
                except Exception as e:
                    logger.error(f"Price comparison failed: {e}")
                    # Fall back to menus without prices
            
            logger.info(f"Generated {len(response.menus)} menu(s)")
            return response
        else:
            raise HTTPException(status_code=404, detail="No valid menus could be generated")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in calculate_nutrition: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

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