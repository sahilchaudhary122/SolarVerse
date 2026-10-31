"""Version 1 API router."""

from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.enquiries import router as enquiries_router
from app.api.v1.auth import router as auth_router
from app.api.v1.surveys import router as surveys_router
from app.api.v1.products import router as products_router
from app.api.v1.quotations import router as quotations_router
from app.api.v1.orders import router as orders_router
from app.api.v1.installations import router as installations_router
from app.api.v1.warranties import router as warranties_router
from app.api.v1.support import router as support_router
from app.api.v1.dashboard import router as dashboard_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(enquiries_router)
api_router.include_router(auth_router)
api_router.include_router(surveys_router)
api_router.include_router(products_router)
api_router.include_router(quotations_router)
api_router.include_router(orders_router)
api_router.include_router(installations_router)
api_router.include_router(warranties_router)
api_router.include_router(support_router)
api_router.include_router(dashboard_router)
