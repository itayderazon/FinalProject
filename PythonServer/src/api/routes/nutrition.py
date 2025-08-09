from fastapi import APIRouter, HTTPException
from datetime import datetime
import logging

from src.api.models.requests import NutritionRequest
from src.api.models.responses import MenuGenerationResponse
from src.api.services.app_service import app_service
from src.api.utils.formatters import format_menu_response, extract_menu_items_for_price_comparison
from src.models.nutrition import NutritionInfo
from config import get_config

router = APIRouter()
logger = logging.getLogger(__name__)

def _log_nutrition_request(request: NutritionRequest):
    """Log the complete request data in a structured format"""
    logger.info("=" * 50)
    logger.info("🍽️ NUTRITION REQUEST RECEIVED")
    logger.info("=" * 50)
    logger.info(f"📊 Calories: {request.calories}")
    logger.info(f"🥩 Protein: {request.protein}g")
    logger.info(f"🍞 Carbs: {request.carbs}g")
    logger.info(f"🥑 Fat: {request.fat}g")
    logger.info(f"🍽️ Meal Template: {request.meal_template}")
    logger.info(f"🏷️ Subcategories: {request.subcategories}")
    logger.info(f"🚫 Excluded Allergens: {request.excluded_allergens}")
    logger.info(f"📝 Number of Items: {request.num_items}")
    logger.info(f"💰 Include Prices: {request.include_prices}")
    logger.info(f"🎯 Required Products: {request.requiredProducts}")
    
    if request.requiredProducts:
        logger.info("📋 Required Products Details:")
        for product in request.requiredProducts:
            logger.info(f"   - Item ID: {product.item_id}, Portion: {product.portion_grams}g")
    
    logger.info("=" * 50)

def _parse_request_parameters(request: NutritionRequest, config):
    """Parse and validate request parameters with config defaults"""
    target_nutrition = NutritionInfo(
        float(request.calories),
        float(request.protein),
        float(request.carbs),
        float(request.fat)
    )
    
    logger.info(f"Generating menu: {target_nutrition.calories}cal")
    
    # Extract required items and portions if provided
    required_items_with_portions = None
    if request.requiredProducts:
        required_items_with_portions = {
            item.item_id: item.portion_grams 
            for item in request.requiredProducts
        }
        logger.info(f"Required items with portions: {required_items_with_portions}")
    
    # Use default num_items if not provided
    num_items = request.num_items if request.num_items is not None else config.DEFAULT_NUM_ITEMS
    
    # Use subcategories if provided
    subcategories = request.subcategories if request.subcategories else None
    
    # Get excluded allergens if provided
    excluded_allergens = request.excluded_allergens if request.excluded_allergens else None
    
    # Log allergen filtering information
    if excluded_allergens:
        logger.info(f"🚫 Excluding allergens with IDs: {excluded_allergens}")
    
    return {
        'target_nutrition': target_nutrition,
        'required_items_with_portions': required_items_with_portions,
        'num_items': num_items,
        'subcategories': subcategories,
        'excluded_allergens': excluded_allergens
    }

def _generate_menu_with_params(target_nutrition, subcategories, num_items, attempts, required_items_with_portions, excluded_allergens=None):
    """Generate menu using the menu generator service"""
    if not app_service.menu_generator:
        raise HTTPException(
            status_code=503, 
            detail="Menu generation service is not initialized. Please check server configuration and database connectivity."
        )
    
    menus = app_service.menu_generator.generate_menu(
        target_nutrition=target_nutrition,
        subcategories=subcategories,
        num_items=num_items,
        attempts=attempts,
        required_items_with_portions=required_items_with_portions,
        excluded_allergens=excluded_allergens
    )
    
    if not menus:
        raise HTTPException(
            status_code=404, 
            detail=f"Unable to generate valid menus for the specified nutrition targets ({target_nutrition.calories}cal, {target_nutrition.protein}g protein). Try adjusting your requirements or increasing the number of items."
        )
    
    return menus

def _add_price_comparison_to_menus(response, request):
    """Add price comparison data to menu response if requested"""
    if not request.include_prices or not app_service.price_comparison:
        return response
    
    try:
        logger.info(f"Starting price comparison for {len(response.menus)} menus")
        
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
        
        return {
            "success": True,
            "menus": enhanced_menus,
            "generation_time_ms": response.generation_time_ms if hasattr(response, 'generation_time_ms') else None
        }
        
    except Exception as e:
        logger.error(f"Price comparison service failed: {e}")
        return response  # Fall back to menus without prices

@router.post("/calculate")
async def calculate_nutrition(request: NutritionRequest):
    """Generate nutrition-optimized menus based on user requirements"""
    try:
        start_time = datetime.now()
        
        # Step 1: Log request details
        _log_nutrition_request(request)
        
        # Step 2: Get configuration and parse parameters
        config = get_config('default')
        params = _parse_request_parameters(request, config)
        
        # Step 3: Generate menus
        menus = _generate_menu_with_params(
            target_nutrition=params['target_nutrition'],
            subcategories=params['subcategories'],
            num_items=params['num_items'],
            attempts=config.API_DEFAULT_ATTEMPTS,
            required_items_with_portions=params['required_items_with_portions'],
            excluded_allergens=params['excluded_allergens']
        )
        
        # Step 4: Format response
        generation_time = (datetime.now() - start_time).total_seconds() * 1000
        response = format_menu_response(menus, generation_time)
        
        # Step 5: Add price comparison if requested
        final_response = _add_price_comparison_to_menus(response, request)
        
        logger.info(f"Successfully generated {len(final_response.get('menus', response.menus))} menu(s)")
        return final_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Menu generation failed unexpectedly: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Menu generation encountered an unexpected error. Please check your input parameters and try again. Error: {str(e)}"
        )

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