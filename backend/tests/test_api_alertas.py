from datetime import datetime

import httpx

from tests.test_api_ingest import payload_deteccion


async def _crear_alerta(client: httpx.AsyncClient) -> tuple[int, int]:
    resp = await client.post(
        "/api/v1/eventos/ingest",
        json=payload_deteccion(f"test_alertas_{datetime.now().timestamp()}", 1),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["alerta_generada"] is True
    return body["evento_id"], body["alerta_id"]


async def test_listar_alertas_paginado_y_filtrado(client: httpx.AsyncClient, limpieza) -> None:
    evento_id, alerta_id = await _crear_alerta(client)
    limpieza.registrar("alertas", alerta_id)
    limpieza.registrar("eventos", evento_id)

    lista = await client.get("/api/v1/alertas?estado=pendiente&nivel=alta")
    assert lista.status_code == 200
    assert any(a["id"] == alerta_id for a in lista.json())


async def test_actualizar_estado_alerta(client: httpx.AsyncClient, limpieza) -> None:
    evento_id, alerta_id = await _crear_alerta(client)
    limpieza.registrar("alertas", alerta_id)
    limpieza.registrar("eventos", evento_id)

    resp = await client.put(
        f"/api/v1/alertas/{alerta_id}/estado", json={"estado": "revisada"}
    )
    assert resp.status_code == 200
    assert resp.json()["estado"] == "revisada"

    lista = await client.get("/api/v1/alertas?estado=revisada")
    assert any(a["id"] == alerta_id for a in lista.json())


async def test_alerta_inexistente_404(client: httpx.AsyncClient) -> None:
    resp = await client.get("/api/v1/alertas/99999999")
    assert resp.status_code == 404
    resp_estado = await client.put(
        "/api/v1/alertas/99999999/estado", json={"estado": "descartada"}
    )
    assert resp_estado.status_code == 404