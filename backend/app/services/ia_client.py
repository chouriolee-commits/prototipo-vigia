import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def construir_solicitud(
    alerta,
    evento,
    total_animales: int = 0,
    especie_predominante: str = "bovino",
) -> dict:
    """Construye el payload de spec-03 §4 a partir de la alerta y su evento."""
    raw = (evento.datos_raw or {}) if evento is not None else {}
    animales = raw.get("animales_detectados", [])
    eventos_relacionados = []
    if evento is not None:
        primeros = animales[0] if animales else {}
        eventos_relacionados.append(
            {
                "timestamp": evento.timestamp_evento.isoformat(),
                "animales_detectados": len(animales),
                "clase_principal": primeros.get("clase"),
                "confianza": primeros.get("confianza"),
            }
        )
    return {
        "alerta_id": alerta.id,
        "tipo_alerta": alerta.tipo_alerta,
        "descripcion_alerta": alerta.descripcion,
        "nivel": alerta.nivel,
        "eventos_relacionados": eventos_relacionados,
        "contexto_hato": {
            "total_animales_registrados": total_animales,
            "especie_predominante": especie_predominante,
        },
    }


async def analizar_alerta(solicitud: dict) -> dict | None:
    """Invoca al agente IA. Devuelve None si no responde o falla (spec-02 §5.3)."""
    settings = get_settings()
    url = f"{settings.ai_agent_url.rstrip('/')}/analizar"
    try:
        async with httpx.AsyncClient(timeout=settings.ai_agent_timeout) as client:
            resp = await client.post(url, json=solicitud)
            resp.raise_for_status()
            return resp.json()
    except Exception:
        logger.exception("Fallo la invocación al agente IA para alerta %s", solicitud.get("alerta_id"))
        return None