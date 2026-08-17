from fastapi import APIRouter, Depends

from app.api.v1.endpoints import (
    alertas,
    animales,
    auth,
    dashboard,
    eventos,
    ia,
    vision,
    webhooks,
)
from app.core.security import validar_credencial

api_router = APIRouter()

# Rutas EXENTAS de autenticación (spec-02 §7): login y módulo de visión.
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(eventos.ingest_router, prefix="/eventos", tags=["eventos"])

# Rutas protegidas: aceptan X-API-Key (máquina) o Bearer JWT (frontend).
_protegidas = dict(dependencies=[Depends(validar_credencial)])
api_router.include_router(auth.me_router, prefix="/auth", tags=["auth"], **_protegidas)
api_router.include_router(animales.router, prefix="/animales", tags=["animales"], **_protegidas)
api_router.include_router(eventos.router, prefix="/eventos", tags=["eventos"], **_protegidas)
api_router.include_router(alertas.router, prefix="/alertas", tags=["alertas"], **_protegidas)
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"], **_protegidas)
api_router.include_router(ia.router, prefix="/ia", tags=["ia"], **_protegidas)
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"], **_protegidas)
api_router.include_router(vision.router, prefix="/vision", tags=["vision"], **_protegidas)