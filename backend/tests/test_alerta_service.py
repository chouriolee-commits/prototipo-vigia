from datetime import datetime, timedelta

from app.schemas.vision import EventoDeteccion
from app.services.alerta_service import EvaluadorAlertas


def evento(
    conteo: int,
    confianzas: list[float],
    fuente: str = "fuente_test",
    ts: datetime | None = None,
) -> EventoDeteccion:
    animales = [
        {
            "id_temporal": f"track_{i}",
            "clase": "cow",
            "confianza": c,
            "bbox": [0, 0, 10, 10],
            "centro": [5, 5],
        }
        for i, c in enumerate(confianzas)
    ]
    return EventoDeteccion.model_validate(
        {
            "timestamp": ts or datetime.now(),
            "fuente": fuente,
            "frame_id": 1,
            "animales_detectados": animales,
            "conteo_total": conteo,
        }
    )


def test_sin_alerta_con_hato_normal() -> None:
    ev = EvaluadorAlertas()
    config = {}
    assert ev.evaluar(evento(3, [0.9, 0.8, 0.85]), config) == []


def test_conteo_bajo_genera_alerta_alta() -> None:
    ev = EvaluadorAlertas()
    config = {"animales_minimos_hato": "3"}
    alertas = ev.evaluar(evento(1, [0.9]), config)
    assert any(a["tipo_alerta"] == "conteo_bajo" and a["nivel"] == "alta" for a in alertas)


def test_aislamiento_requiere_n_frames_consecutivos() -> None:
    ev = EvaluadorAlertas()
    config = {"umbral_confianza_alerta": "0.75", "frames_aislamiento": "3"}
    for _ in range(2):
        assert not any(
            a["tipo_alerta"] == "posible_aislamiento"
            for a in ev.evaluar(evento(1, [0.9], fuente="cam_a"), config)
        )
    alertas = ev.evaluar(evento(1, [0.9], fuente="cam_a"), config)
    assert any(a["tipo_alerta"] == "posible_aislamiento" and a["nivel"] == "media" for a in alertas)


def test_aislamiento_se_resetea_si_hay_varios_animales() -> None:
    ev = EvaluadorAlertas()
    config = {"frames_aislamiento": "2"}
    ev.evaluar(evento(1, [0.9], fuente="cam_b"), config)
    ev.evaluar(evento(2, [0.9, 0.8], fuente="cam_b"), config)
    alertas = ev.evaluar(evento(1, [0.9], fuente="cam_b"), config)
    assert not any(a["tipo_alerta"] == "posible_aislamiento" for a in alertas)


def test_sin_actividad_tras_ventana_configurada() -> None:
    ev = EvaluadorAlertas()
    config = {"ventana_inactividad_min": "60"}
    t0 = datetime(2026, 8, 17, 10, 0, 0)
    ev.evaluar(evento(3, [0.9, 0.8, 0.85], fuente="cam_c", ts=t0), config)
    alertas = ev.evaluar(
        evento(3, [0.9, 0.8, 0.85], fuente="cam_c", ts=t0 + timedelta(hours=2)), config
    )
    assert any(a["tipo_alerta"] == "sin_actividad" and a["nivel"] == "alta" for a in alertas)


def test_calidad_video_baja_con_10_eventos_de_baja_confianza() -> None:
    ev = EvaluadorAlertas()
    config = {}
    ultimas = None
    for _ in range(10):
        ultimas = ev.evaluar(evento(3, [0.4, 0.45, 0.4], fuente="cam_d"), config)
    assert any(
        a["tipo_alerta"] == "calidad_video_baja" and a["nivel"] == "baja" for a in ultimas
    )