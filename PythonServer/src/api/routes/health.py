from fastapi import APIRouter
from datetime import datetime

from src.api.models.responses import HealthResponse
from src.api.services.app_service import app_service

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    components = {
        "menu_generator": "healthy" if app_service.menu_generator else "unhealthy",
        "price_comparison": "healthy" if app_service.price_comparison else "unhealthy",
        "database": "healthy",
        "api_server": "healthy"
    }
    
    return HealthResponse(
        status="healthy" if (app_service.menu_generator and app_service.price_comparison) else "degraded",
        timestamp=datetime.now().isoformat(),
        components=components
    )

health_router = router