import httpx

from app.core.config import get_settings
from app.core.security import crear_token_jwt, hash_password


async def test_login_ok_devuelve_token(client_sin_auth: httpx.AsyncClient) -> None:
    settings = get_settings()
    resp = await client_sin_auth.post(
        "/api/v1/auth/login",
        json={"email": settings.auth_email, "password": settings.auth_password},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["email"] == settings.auth_email
    assert body["expires_in"] == settings.token_expire_minutes * 60


async def test_login_contraseña_incorrecta_401(client_sin_auth: httpx.AsyncClient) -> None:
    settings = get_settings()
    resp = await client_sin_auth.post(
        "/api/v1/auth/login",
        json={"email": settings.auth_email, "password": "clave-equivocada"},
    )
    assert resp.status_code == 401


async def test_login_email_incorrecto_401(client_sin_auth: httpx.AsyncClient) -> None:
    resp = await client_sin_auth.post(
        "/api/v1/auth/login",
        json={"email": "otro@vigia.co", "password": "Vigia123!"},
    )
    assert resp.status_code == 401


async def test_login_email_invalido_422(client_sin_auth: httpx.AsyncClient) -> None:
    resp = await client_sin_auth.post(
        "/api/v1/auth/login",
        json={"email": "no-es-un-email", "password": "Vigia123!"},
    )
    assert resp.status_code == 422


async def test_me_con_token_ok(client_sin_auth: httpx.AsyncClient) -> None:
    token = crear_token_jwt("admin@vigia.co")
    resp = await client_sin_auth.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@vigia.co"


async def test_me_sin_token_401(client_sin_auth: httpx.AsyncClient) -> None:
    resp = await client_sin_auth.get("/api/v1/auth/me")
    assert resp.status_code == 401


async def test_me_token_forjado_401(client_sin_auth: httpx.AsyncClient) -> None:
    resp = await client_sin_auth.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer token.forjado.x"}
    )
    assert resp.status_code == 401


async def test_me_con_api_key_401(client: httpx.AsyncClient) -> None:
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


async def test_ruta_protegida_con_jwt_ok(
    client_sin_auth: httpx.AsyncClient, limpieza
) -> None:
    from tests.test_api_ingest import payload_deteccion

    token = crear_token_jwt("admin@vigia.co")
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client_sin_auth.get("/api/v1/animales", headers=headers)
    assert resp.status_code == 200

    resp_ingest = await client_sin_auth.post(
        "/api/v1/eventos/ingest", json=payload_deteccion("auth_jwt", 3)
    )
    assert resp_ingest.status_code == 201
    assert resp_ingest.json()["alerta_generada"] is False
    limpieza.registrar("eventos", resp_ingest.json()["evento_id"])

    resp_stats = await client_sin_auth.get("/api/v1/eventos/stats", headers=headers)
    assert resp_stats.status_code == 200


async def test_login_con_hash_pbkdf2(
    monkeypatch, client_sin_auth: httpx.AsyncClient
) -> None:
    settings = get_settings()
    monkeypatch.setattr(
        settings, "auth_password_hash", hash_password("ClaveSegura#2026")
    )
    resp = await client_sin_auth.post(
        "/api/v1/auth/login",
        json={"email": settings.auth_email, "password": "ClaveSegura#2026"},
    )
    assert resp.status_code == 200

    resp_mal = await client_sin_auth.post(
        "/api/v1/auth/login",
        json={"email": settings.auth_email, "password": "otra"},
    )
    assert resp_mal.status_code == 401


async def test_login_exento_sin_api_key(client_sin_auth: httpx.AsyncClient) -> None:
    """El login no requiere X-API-Key (es el punto de entrada)."""
    settings = get_settings()
    resp = await client_sin_auth.post(
        "/api/v1/auth/login",
        json={"email": settings.auth_email, "password": settings.auth_password},
    )
    assert resp.status_code == 200