from fastapi import APIRouter, Depends

from app.api.v1.endpoints import (
    alertas,
    animales,
    dashboard,
    eventos,
    ia,
    vision,
    webhooks,
)
from app.core.security import validar_api_key

api_router = APIRouter()

# Ruta EXENTA de autenticación (spec-02 §7): la consume el módulo de visión.
api_router.include_router(eventos.ingest_router, prefix="/eventos", tags=["eventos"])

# Rutas protegidas con API Key (header X-API-Key).
_protegidas = dict(dependencies=[Depends(validar_api_key)])
api_router.include_router(animales.router, prefix="/animales", tags=["animales"], **_protegidas)
api_router.include_router(eventos.router, prefix="/eventos", tags=["eventos"], **_protegidas)
api_router.include_router(alertas.router, prefix="/alertas", tags=["alertas"], **_protegidas)
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"], **_protegidas)
api_router.include_router(ia.router, prefix="/ia", tags=["ia"], **_protegidas)
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"], **_protegidas)
api_router.include_router(vision.router, prefix="/vision", tags=["vision"], **_protegidas)