from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import get_settings
from app.core.security import (
    autenticar_usuario,
    crear_token_jwt,
    validar_credencial,
)
from app.schemas.auth import LoginRequest, TokenResponse, UsuarioInfo

router = APIRouter()
me_router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    settings = get_settings()
    email = autenticar_usuario(payload.email, payload.password)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    token = crear_token_jwt(email)
    return TokenResponse(
        access_token=token,
        expires_in=settings.token_expire_minutes * 60,
        email=email,
    )


@me_router.get("/me", response_model=UsuarioInfo)
async def me(usuario: str = Depends(validar_credencial)) -> UsuarioInfo:
    if usuario == "api-key":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticación con API Key no permite /me",
        )
    return UsuarioInfo(email=usuario)