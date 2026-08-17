from fastapi import APIRouter

from app.api.v1.endpoints import (
    alertas,
    animales,
    dashboard,
    eventos,
    ia,
    webhooks,
)

api_router = APIRouter()

api_router.include_router(animales.router, prefix="/animales", tags=["animales"])
api_router.include_router(eventos.router, prefix="/eventos", tags=["eventos"])
api_router.include_router(alertas.router, prefix="/alertas", tags=["alertas"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(ia.router, prefix="/ia", tags=["ia"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])