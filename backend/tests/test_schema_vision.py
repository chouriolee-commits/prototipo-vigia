import pytest
from pydantic import ValidationError

from app.schemas.vision import EventoDeteccion


# Ejemplo literal de spec-00 §5.1
def payload_vision() -> dict:
    return {
        "timestamp": "2026-08-16T10:30:00Z",
        "fuente": "video_simulado_01.mp4",
        "frame_id": 142,
        "animales_detectados": [
            {
                "id_temporal": "track_001",
                "clase": "cow",
                "confianza": 0.87,
                "bbox": [120, 45, 310, 280],
                "centro": [215, 162],
            }
        ],
        "conteo_total": 1,
        "metadata": {"resolucion": "1280x720", "fps_procesados": 1},
    }


def test_evento_deteccion_valido_del_spec() -> None:
    evento = EventoDeteccion.model_validate(payload_vision())
    assert evento.conteo_total == 1
    assert evento.animales_detectados[0].clase == "cow"
    assert evento.metadata.resolucion == "1280x720"


def test_conteo_total_requerido_igual_a_animales() -> None:
    data = payload_vision()
    data["conteo_total"] = 5
    with pytest.raises(ValidationError, match="conteo_total"):
        EventoDeteccion.model_validate(data)


def test_confianza_fuera_de_rango_rechazada() -> None:
    data = payload_vision()
    data["animales_detectados"][0]["confianza"] = 1.5
    with pytest.raises(ValidationError):
        EventoDeteccion.model_validate(data)


def test_timestamp_obligatorio() -> None:
    data = payload_vision()
    del data["timestamp"]
    with pytest.raises(ValidationError):
        EventoDeteccion.model_validate(data)


def test_bbox_debe_tener_4_valores() -> None:
    data = payload_vision()
    data["animales_detectados"][0]["bbox"] = [1, 2, 3]
    with pytest.raises(ValidationError):
        EventoDeteccion.model_validate(data)