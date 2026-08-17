from datetime import datetime

import httpx

from tests.test_api_ingest import payload_deteccion


async def test_dashboard_resumen_y_actividad(client: httpx.AsyncClient, limpieza) -> None:
    evento_resp = await client.post(
        "/api/v1/eventos/ingest", json=payload_deteccion("test_dash_1")
    )
    alerta_resp = await client.post(
        "/api/v1/eventos/ingest",
        json=payload_deteccion(f"test_dash_alerta_{datetime.now().timestamp()}", 1),
    )
    assert evento_resp.status_code == 201 and alerta_resp.status_code == 201
    limpieza.registrar("alertas", alerta_resp.json()["alerta_id"])
    limpieza.registrar("eventos", evento_resp.json()["evento_id"])
    limpieza.registrar("eventos", alerta_resp.json()["evento_id"])

    resumen = await client.get("/api/v1/dashboard/resumen")
    assert resumen.status_code == 200
    body = resumen.json()
    assert body["eventos_hoy"] >= 2
    assert body["alertas_pendientes"] >= 1

    actividad = await client.get("/api/v1/dashboard/actividad")
    assert actividad.status_code == 200
    horas = actividad.json()["horas"]
    assert len(horas) == 24
    assert sum(h["eventos"] for h in horas) >= 2

    recientes = await client.get("/api/v1/dashboard/alertas-recientes")
    assert recientes.status_code == 200
    assert any(a["tipo_alerta"] == "conteo_bajo" for a in recientes.json())