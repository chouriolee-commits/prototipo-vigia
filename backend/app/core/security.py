import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)

_ALGORITMO = "HS256"
_ITERACIONES = 200_000


def hash_password(password: str) -> str:
    """Genera un hash PBKDF2-SHA256 (sal aleatoria por llamada)."""
    sal = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), sal, _ITERACIONES
    )
    return f"pbkdf2${_ITERACIONES}${sal.hex()}${digest.hex()}"


def verificar_password(password: str, almacenado: str) -> bool:
    """Compara en tiempo constante contra un hash pbkdf2$it$sal$digest."""
    try:
        _, iteraciones, sal_hex, digest_hex = almacenado.split("$")
        sal = bytes.fromhex(sal_hex)
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), sal, int(iteraciones)
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def crear_token_jwt(email: str) -> str:
    settings = get_settings()
    ahora = datetime.now(UTC)
    payload = {
        "sub": email,
        "iat": ahora,
        "exp": ahora + timedelta(minutes=settings.token_expire_minutes),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=_ALGORITMO)


def validar_token_jwt(token: str) -> dict:
    """Decodifica y valida un JWT. Lanza 401 si es inválido o expiró."""
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[_ALGORITMO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión expiró",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )


def autenticar_usuario(email: str, password: str) -> str | None:
    """Valida credenciales del usuario admin. Devuelve email si son válidas."""
    settings = get_settings()
    if not hmac.compare_digest(email.lower(), settings.auth_email.lower()):
        return None
    if settings.auth_password_hash:
        if not verificar_password(password, settings.auth_password_hash):
            return None
    elif not hmac.compare_digest(password, settings.auth_password):
        return None
    return email


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


def validar_credencial(
    x_api_key: str | None = Security(api_key_header),
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
) -> str:
    """Acepta X-API-Key (integración máquina/visión) o Bearer JWT (frontend)."""
    if x_api_key is not None and x_api_key == get_settings().api_key:
        return "api-key"
    if credentials is not None and credentials.scheme.lower() == "bearer":
        payload = validar_token_jwt(credentials.credentials)
        return str(payload.get("sub"))
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o no proporcionadas",
        headers={"WWW-Authenticate": "Bearer"},
    )