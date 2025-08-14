# Simple API-wide constants (no complex syntax)

NODE_BASE_URL = "http://localhost:3001"
HTTP_TIMEOUT_SECONDS = 10

# Allowed origins for CORS middleware
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",  # Vite dev server
    "http://localhost:5174",  # Vite dev server (alternative)
    "http://localhost:80",    # Containerized frontend
    "http://127.0.0.1:80",    # Containerized frontend (alternative)
    "http://localhost",       # Containerized frontend (without port)
    "http://127.0.0.1:5173",  # Alternative local dev
    "http://127.0.0.1:5174"   # Alternative local dev
]


