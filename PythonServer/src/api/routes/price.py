from fastapi import APIRouter, HTTPException
from datetime import datetime
import logging

from src.api.models.requests import PriceComparisonRequest
from src.api.models.responses import PriceComparisonResponse
from src.api.services.app_service import app_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/compare", response_model=PriceComparisonResponse)
async def compare_prices(request: PriceComparisonRequest):
    if not app_service.price_comparison:
        raise HTTPException(
            status_code=503, 
            detail="Price comparison service is not available. Please check database connectivity and ensure price data is loaded."
        )
    
    try:
        logger.info(f"🔄 Comparing prices for {len(request.menu_items)} items")
        
        if not request.menu_items:
            raise HTTPException(
                status_code=400,
                detail="No menu items provided for price comparison. Please include at least one item."
            )
        
        price_data = app_service.price_comparison.compare_menu_prices(request.menu_items)
        return PriceComparisonResponse(success=True, price_comparison=price_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Price comparison operation failed: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to compare prices for {len(request.menu_items)} items. The price comparison service encountered an error: {str(e)}"
        )

@router.post("/cheapest-combination")
async def get_cheapest_combination(request: PriceComparisonRequest):
    if not app_service.price_comparison:
        raise HTTPException(
            status_code=503, 
            detail="Price comparison service is not available. Cannot calculate cheapest combination without price data access."
        )
    
    try:
        logger.info(f"🔄 Finding cheapest combination for {len(request.menu_items)} items")
        
        if not request.menu_items:
            raise HTTPException(
                status_code=400,
                detail="No menu items provided for cheapest combination calculation. Please include at least one item."
            )
        
        cheapest_data = app_service.price_comparison.get_cheapest_combination(request.menu_items)
        return {"success": True, "cheapest_combination": cheapest_data}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cheapest combination calculation failed: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to calculate cheapest combination for {len(request.menu_items)} items. The optimization algorithm encountered an error: {str(e)}"
        )

@router.get("/supermarkets")
async def get_available_supermarkets():
    if not app_service.price_comparison:
        raise HTTPException(
            status_code=503, 
            detail="Price comparison service is not available. Cannot retrieve supermarket information without service initialization."
        )
    
    try:
        supermarkets = app_service.price_comparison.supermarkets
        if not supermarkets:
            raise HTTPException(
                status_code=404,
                detail="No supermarket data is currently available. Please check if price data has been loaded correctly."
            )
        
        return {
            "success": True,
            "supermarkets": supermarkets,
            "total_supermarkets": len(supermarkets)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Supermarket data retrieval failed: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to retrieve supermarket information. The price comparison service encountered an error: {str(e)}"
        )

price_router = router