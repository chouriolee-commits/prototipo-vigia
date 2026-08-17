import httpx

from tests.test_api_ingest import payload_deteccion


async def test_ruta_protegida_sin_key_401(client_sin_auth: httpx.AsyncClient) -> None:
    resp = await client_sin_auth.get("/api/v1/animales")
    assert resp.status_code == 401


async def test_ruta_protegida_key_incorrecta_401(client_sin_auth: httpx.AsyncClient) -> None:
    resp = await client_sin_auth.get(
        "/api/v1/animales", headers={"X-API-Key": "clave-incorrecta"}
    )
    assert resp.status_code == 401


async def test_ruta_protegida_con_key_ok(client: httpx.AsyncClient) -> None:
    resp = await client.get("/api/v1/animales")
    assert resp.status_code == 200


async def test_health_exento_sin_key(client_sin_auth: httpx.AsyncClient) -> None:
    resp = await client_sin_auth.get("/health")
    assert resp.status_code == 200


async def test_ingest_exento_sin_key(client_sin_auth: httpx.AsyncClient, limpieza) -> None:
    resp = await client_sin_auth.post(
        "/api/v1/eventos/ingest", json=payload_deteccion("test_auth_ingest", 3)
    )
    assert resp.status_code == 201
    limpieza.registrar("eventos", resp.json()["evento_id"])


async def test_eventos_stats_requiere_key(client_sin_auth: httpx.AsyncClient) -> None:
    resp = await client_sin_auth.get("/api/v1/eventos/stats")
    assert resp.status_code == 401