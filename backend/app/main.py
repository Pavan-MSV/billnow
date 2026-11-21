"""BillNow FastAPI application entrypoint.

Business logic lives here (not in the React frontend) so the same REST API can
later serve a React Native mobile client.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import (
    auth,
    dashboard,
    insights,
    invoices,
    notifications,
    products,
    services,
    warranties,
)
from app.api.routes import settings as settings_routes
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.core.ratelimit import limiter

configure_logging()
logger = get_logger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    description="Products, invoices, warranties and service history — all in one place.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
    openapi_url="/openapi.json",
)

# --- Rate limiting ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Log the full error server-side, return a generic message to the client."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on our end. Please try again."},
    )


@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "app": settings.APP_NAME, "environment": settings.ENVIRONMENT}


# --- Routers (all under /api) ---
for router in (
    auth.router,
    products.router,
    invoices.router,
    warranties.router,
    services.products_router,
    services.services_router,
    notifications.router,
    dashboard.router,
    insights.router,
    settings_routes.router,
):
    app.include_router(router, prefix=settings.API_PREFIX)
