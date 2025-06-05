from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

from api.routes.nutrition import nutrition_router
from api.routes.price import price_router
from api.routes.health import health_router
from api.services.app_service import AppService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Nutrition Menu Generator API",
    description="API for generating nutrition-based meal menus",
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

# Initialize services
app_service = AppService()

@app.on_event("startup")
async def startup_event():
    if not app_service.initialize():
        logger.error("Failed to initialize services")

# Include routers
app.include_router(health_router, tags=["health"])
app.include_router(nutrition_router, prefix="/api/nutrition", tags=["nutrition"])
app.include_router(price_router, prefix="/api/price", tags=["price"])

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)