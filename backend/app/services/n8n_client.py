import logging
from datetime import datetime, timezone

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def notificar_alerta(
    alerta_id: int,
    tipo_alerta: str,
    nivel: str,
    descripcion: str,
    timestamp: datetime | None = None,
    analisis_ia: dict | None = None,
    contexto: dict | None = None,
) -> bool:
    """Dispara el webhook a n8n (spec-04 §3.2). Devuelve True solo si se envió correctamente."""
    settings = get_settings()
    if not settings.n8n_enabled:
        return False

    payload = {
        "alerta_id": alerta_id,
        "tipo_alerta": tipo_alerta,
        "nivel": nivel,
        "descripcion": descripcion,
        "timestamp": (timestamp or datetime.now(timezone.utc)).isoformat(),
        "analisis_ia": analisis_ia,
        "contexto": contexto,
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(settings.n8n_webhook_url, json=payload)
            resp.raise_for_status()
        return True
    except Exception:
        logger.exception("Fallo el webhook a n8n para alerta %s", alerta_id)
        return False