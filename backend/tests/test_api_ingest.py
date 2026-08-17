from datetime import datetime

import httpx
import pytest


def payload_deteccion(fuente: str, conteo: int = 3) -> dict:
    return {
        "timestamp": datetime.now().isoformat(),
        "fuente": fuente,
        "frame_id": 1,
        "animales_detectados": [
            {
                "id_temporal": f"track_{i}",
                "clase": "cow",
                "confianza": 0.9,
                "bbox": [0, 0, 10, 10],
                "centro": [5, 5],
            }
            for i in range(conteo)
        ],
        "conteo_total": conteo,
        "metadata": {"resolucion": "1280x720", "fps_procesados": 1},
    }


@pytest.mark.parametrize("conteo", [3, 4, 5])
async def test_ingest_persiste_evento(
    client: httpx.AsyncClient, limpieza, conteo: int
) -> None:
    fuente = f"test_ingest_{conteo}"
    resp = await client.post("/api/v1/eventos/ingest", json=payload_deteccion(fuente, conteo))
    assert resp.status_code == 201
    body = resp.json()
    assert body["evento_id"] > 0
    assert body["alerta_generada"] is False
    limpieza.registrar("eventos", body["evento_id"])

    detalle = await client.get(f"/api/v1/eventos/{body['evento_id']}")
    assert detalle.status_code == 200
    assert detalle.json()["fuente"] == fuente
    assert detalle.json()["tipo"] == "deteccion"


async def test_ingest_payload_invalido_rechazado(client: httpx.AsyncClient) -> None:
    resp = await client.post("/api/v1/eventos/ingest", json={"conteo_total": 1})
    assert resp.status_code == 422


async def test_ingest_genera_alerta_conteo_bajo(
    client: httpx.AsyncClient, limpieza
) -> None:
    fuente = "test_ingest_alerta"
    resp = await client.post("/api/v1/eventos/ingest", json=payload_deteccion(fuente, 1))
    assert resp.status_code == 201
    body = resp.json()
    assert body["alerta_generada"] is True
    assert body["alerta_id"] is not None
    limpieza.registrar("alertas", body["alerta_id"])
    limpieza.registrar("eventos", body["evento_id"])

    alerta = await client.get(f"/api/v1/alertas/{body['alerta_id']}")
    assert alerta.status_code == 200
    assert alerta.json()["tipo_alerta"] == "conteo_bajo"


async def test_eventos_lista_paginada_y_stats(client: httpx.AsyncClient, limpieza) -> None:
    fuente = "test_ingest_stats"
    resp = await client.post("/api/v1/eventos/ingest", json=payload_deteccion(fuente))
    evento_id = resp.json()["evento_id"]
    limpieza.registrar("eventos", evento_id)

    lista = await client.get("/api/v1/eventos?limit=5&offset=0")
    assert lista.status_code == 200
    assert isinstance(lista.json(), list)

    stats = await client.get("/api/v1/eventos/stats")
    assert stats.status_code == 200
    body = stats.json()
    assert body["total_eventos"] >= 1
    assert body["por_tipo"].get("deteccion", 0) >= 1
    assert body["por_nivel"].get("normal", 0) >= 1


async def test_evento_inexistente_404(client: httpx.AsyncClient) -> None:
    resp = await client.get("/api/v1/eventos/99999999")
    assert resp.status_code == 404