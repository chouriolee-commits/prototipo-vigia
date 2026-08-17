from datetime import datetime

from app.db.models.alerta import Alerta
from app.db.models.evento import Evento
from app.services.ia_client import construir_solicitud


def test_construir_solicitud_payload_completo() -> None:
    alerta = Alerta(
        id=7,
        evento_id=3,
        tipo_alerta="conteo_bajo",
        descripcion="Conteo (1) por debajo del mínimo del hato (3)",
        nivel="alta",
        estado="pendiente",
        timestamp=datetime(2026, 8, 17, 10, 0),
    )
    evento = Evento(
        id=3,
        tipo="deteccion",
        timestamp_evento=datetime(2026, 8, 17, 10, 0),
        datos_raw={
            "fuente": "cam-01",
            "animales_detectados": [
                {"id_temporal": "a1", "clase": "cow", "confianza": 0.9}
            ],
        },
    )

    solicitud = construir_solicitud(alerta, evento, total_animales=12, especie_predominante="bovino")

    assert solicitud["alerta_id"] == 7
    assert solicitud["tipo_alerta"] == "conteo_bajo"
    assert solicitud["nivel"] == "alta"
    assert solicitud["contexto_hato"] == {
        "total_animales_registrados": 12,
        "especie_predominante": "bovino",
    }
    assert solicitud["eventos_relacionados"][0]["animales_detectados"] == 1
    assert solicitud["eventos_relacionados"][0]["clase_principal"] == "cow"
    assert solicitud["eventos_relacionados"][0]["confianza"] == 0.9


def test_construir_solicitud_sin_evento() -> None:
    alerta = Alerta(
        id=9,
        evento_id=None,
        tipo_alerta="sin_actividad",
        descripcion="Sin detecciones",
        nivel="alta",
        estado="pendiente",
        timestamp=datetime(2026, 8, 17, 10, 0),
    )

    solicitud = construir_solicitud(alerta, None)

    assert solicitud["eventos_relacionados"] == []
    assert solicitud["contexto_hato"] == {
        "total_animales_registrados": 0,
        "especie_predominante": "bovino",
    }