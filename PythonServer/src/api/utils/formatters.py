from fastapi import HTTPException
from api.models.responses import MenuGenerationResponse, MenuResponse, FoodNutrition, MenuItem
import logging

logger = logging.getLogger(__name__)

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
        raise HTTPException(status_code=500, detail=f"Failed to format response: {str(e)}")

def extract_menu_items_for_price_comparison(menu_response):
    return [{
        'item_code': item.item_code,
        'portion_grams': item.portion_grams,
        'name': item.name
    } for item in menu_response.items]