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
from app.api.v1.customers import router as customers_router
from app.api.v1.sites import router as sites_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.dispatches import router as dispatches_router
from app.api.v1.payments import router as payments_router
from app.api.v1.files import router as files_router
from app.api.v1.customer_portal import router as customer_portal_router
from app.api.v1.reports import router as reports_router

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
api_router.include_router(customers_router)
api_router.include_router(sites_router)
api_router.include_router(inventory_router)
api_router.include_router(dispatches_router)
api_router.include_router(payments_router)
api_router.include_router(files_router)
api_router.include_router(customer_portal_router)
api_router.include_router(reports_router)
