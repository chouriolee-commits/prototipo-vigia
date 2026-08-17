from datetime import datetime

import httpx
import pytest

from tests.test_api_ingest import payload_deteccion


async def test_webhook_n8n_ok(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/webhooks/n8n",
        json={"tipo": "confirmacion_notificacion", "alerta_id": 1, "resultado": "enviado"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


async def test_webhook_n8n_payload_invalido_422(client: httpx.AsyncClient) -> None:
    resp = await client.post("/api/v1/webhooks/n8n", json={"tipo": "x"})
    assert resp.status_code == 422


async def test_ia_analizar_alerta_inexistente_404(client: httpx.AsyncClient) -> None:
    resp = await client.post("/api/v1/ia/analizar", json={"alerta_id": 99999999})
    assert resp.status_code == 404


async def test_ia_analizar_agente_no_disponible_502(
    client: httpx.AsyncClient, limpieza, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def _agente_caido(solicitud: dict) -> None:
        return None

    monkeypatch.setattr("app.api.v1.endpoints.ia.analizar_alerta", _agente_caido)

    resp = await client.post(
        "/api/v1/eventos/ingest",
        json=payload_deteccion(f"test_ia_{datetime.now().timestamp()}", 1),
    )
    assert resp.status_code == 201
    alerta_id = resp.json()["alerta_id"]
    limpieza.registrar("alertas", alerta_id)
    limpieza.registrar("eventos", resp.json()["evento_id"])

    analisis = await client.post("/api/v1/ia/analizar", json={"alerta_id": alerta_id})
    assert analisis.status_code == 502


async def test_ia_analizar_respuesta_invalida_502(
    client: httpx.AsyncClient, limpieza, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def _respuesta_invalida(solicitud: dict) -> dict:
        return {"foo": "bar"}

    monkeypatch.setattr("app.api.v1.endpoints.ia.analizar_alerta", _respuesta_invalida)

    resp = await client.post(
        "/api/v1/eventos/ingest",
        json=payload_deteccion(f"test_ia_inv_{datetime.now().timestamp()}", 1),
    )
    assert resp.status_code == 201
    alerta_id = resp.json()["alerta_id"]
    limpieza.registrar("alertas", alerta_id)
    limpieza.registrar("eventos", resp.json()["evento_id"])

    analisis = await client.post("/api/v1/ia/analizar", json={"alerta_id": alerta_id})
    assert analisis.status_code == 502