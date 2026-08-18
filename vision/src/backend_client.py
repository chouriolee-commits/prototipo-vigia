import asyncio
import logging

import httpx

logger = logging.getLogger(__name__)


class BackendClient:
    """Envía eventos al backend con reintentos y backoff (spec-01 §10)."""

    def __init__(self, base_url: str, ingest_path: str) -> None:
        self.url = f"{base_url.rstrip('/')}{ingest_path}"

    async def enviar(self, evento: dict, reintentos: int = 3) -> bool:
        for intento in range(1, reintentos + 1):
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    resp = await client.post(self.url, json=evento)
                    if resp.status_code in (200, 201):
                        return True
                    logger.warning(
                        "Backend respondió %s en evento frame %s",
                        resp.status_code,
                        evento.get("frame_id"),
                    )
            except Exception:
                logger.exception("Fallo al enviar evento frame %s", evento.get("frame_id"))
            await asyncio.sleep(2**intento)
        logger.error("Se agotaron los reintentos para el frame %s", evento.get("frame_id"))
        return False