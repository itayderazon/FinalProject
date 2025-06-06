from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import sys
import os
from contextlib import asynccontextmanager

# Add the PythonServer root to the path (go up 2 levels from src/api/server.py)
pythonserver_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
if pythonserver_root not in sys.path:
    sys.path.insert(0, pythonserver_root)

from src.api.routes.nutrition import nutrition_router
from src.api.routes.price import price_router
from src.api.routes.health import health_router
from src.api.services.app_service import app_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if not app_service.initialize():
        logger.error("Failed to initialize services")
    yield
    # Shutdown (if needed)
    pass

app = FastAPI(
    title="Nutrition Menu Generator API",
    description="API for generating nutrition-based meal menus",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router, tags=["health"])
app.include_router(nutrition_router, prefix="/api/nutrition", tags=["nutrition"])
app.include_router(price_router, prefix="/api/price", tags=["price"])

if __name__ == "__main__":
    uvicorn.run("src.api.server:app", host="0.0.0.0", port=8000, reload=True)