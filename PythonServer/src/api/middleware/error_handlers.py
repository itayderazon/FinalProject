from fastapi import Request
from fastapi.responses import JSONResponse
from datetime import datetime

from api.models.responses import ErrorResponse

async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content=ErrorResponse(
            error="Invalid input value",
            details=str(exc),
            timestamp=datetime.now().isoformat()
        ).dict()
    )

async def internal_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            details="An unexpected error occurred",
            timestamp=datetime.now().isoformat()
        ).dict()
    )