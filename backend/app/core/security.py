from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.core.config import get_settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def validar_api_key(
    x_api_key: str | None = Security(api_key_header),
) -> str:
    """Valida el header X-API-Key (spec-02 §7). Lanza 401 si falta o es incorrecta.

    El scheme APIKeyHeader se registra en OpenAPI, por lo que Swagger UI
    muestra el botón Authorize para configurar la key una sola vez.
    """
    settings = get_settings()
    if x_api_key is None or x_api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key inválida o no proporcionada",
        )
    return x_api_key