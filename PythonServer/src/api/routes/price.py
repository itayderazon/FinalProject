from fastapi import APIRouter, HTTPException
from datetime import datetime
import logging

from api.models.requests import PriceComparisonRequest
from api.models.responses import PriceComparisonResponse
from api.services.app_service import app_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/compare", response_model=PriceComparisonResponse)
async def compare_prices(request: PriceComparisonRequest):
    if not app_service.price_comparison:
        raise HTTPException(status_code=503, detail="Price comparison service not initialized")
    
    try:
        logger.info(f"🔄 Comparing prices for {len(request.menu_items)} items")
        price_data = app_service.price_comparison.compare_menu_prices(request.menu_items)
        return PriceComparisonResponse(success=True, price_comparison=price_data)
        
    except Exception as e:
        logger.error(f"Error in price comparison: {e}")
        raise HTTPException(status_code=500, detail=f"Price comparison failed: {str(e)}")

@router.post("/cheapest-combination")
async def get_cheapest_combination(request: PriceComparisonRequest):
    if not app_service.price_comparison:
        raise HTTPException(status_code=503, detail="Price comparison service not initialized")
    
    try:
        logger.info(f"🔄 Finding cheapest combination for {len(request.menu_items)} items")
        cheapest_data = app_service.price_comparison.get_cheapest_combination(request.menu_items)
        return {"success": True, "cheapest_combination": cheapest_data}
        
    except Exception as e:
        logger.error(f"Error finding cheapest combination: {e}")
        raise HTTPException(status_code=500, detail=f"Cheapest combination calculation failed: {str(e)}")

@router.get("/supermarkets")
async def get_available_supermarkets():
    if not app_service.price_comparison:
        raise HTTPException(status_code=503, detail="Price comparison service not initialized")
    
    try:
        return {
            "success": True,
            "supermarkets": app_service.price_comparison.supermarkets,
            "total_supermarkets": len(app_service.price_comparison.supermarkets)
        }
    except Exception as e:
        logger.error(f"Error getting supermarkets: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get supermarkets: {str(e)}")

price_router = router