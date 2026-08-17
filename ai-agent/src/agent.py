import asyncio
import logging
from pathlib import Path

from groq import AsyncGroq

from src.config import get_config
from src.prompt_builder import (
    analisis_fallback,
    cargar_system_prompt,
    construir_prompt_usuario,
)
from src.response_parser import (
    RespuestaInvalidaError,
    extraer_bloque_json,
    validar_respuesta,
)
from src.schemas import AnalisisIA, SolicitudAnalisis

logger = logging.getLogger(__name__)


class VigilAgent:
    """Orquesta la llamada a Groq con reintentos y fallback (spec-03 §6.3)."""

    def __init__(self) -> None:
        self.config = get_config()
        self._client: AsyncGroq | None = None
        system_path = Path(__file__).resolve().parents[1] / "prompts" / "system_prompt.txt"
        self._system_prompt = cargar_system_prompt(str(system_path))

    @property
    def client(self) -> AsyncGroq:
        if self._client is None:
            self._client = AsyncGroq(api_key=self.config.groq_api_key)
        return self._client

    async def _llamada(self, solicitud: SolicitudAnalisis) -> dict:
        resp = await asyncio.wait_for(
            self.client.chat.completions.create(
                model=self.config.groq_model,
                messages=[
                    {"role": "system", "content": self._system_prompt},
                    {"role": "user", "content": construir_prompt_usuario(solicitud)},
                ],
                temperature=self.config.groq_temperature,
                max_tokens=self.config.groq_max_tokens,
            ),
            timeout=self.config.ai_request_timeout,
        )
        content = resp.choices[0].message.content or ""
        tokens_usados = int(getattr(resp.usage, "total_tokens", 0))
        datos = extraer_bloque_json(content)
        analisis = validar_respuesta(solicitud.alerta_id, datos, self.config.groq_model)
        analisis.tokens_usados = tokens_usados or analisis.tokens_usados
        return analisis.model_dump(mode="json")

    async def analizar(self, solicitud: SolicitudAnalisis) -> dict:
        """Intenta 2 veces; si falla, retorna el análisis de fallback."""
        for intento in (1, 2):
            try:
                return await self._llamada(solicitud)
            except RespuestaInvalidaError:
                logger.warning("Respuesta LLM inválida (intento %s)", intento)
                if intento == 1:
                    await asyncio.sleep(2)
            except Exception:
                logger.exception("Fallo al llamar a Groq (intento %s)", intento)
                await asyncio.sleep(2)
        return analisis_fallback(solicitud.alerta_id, self.config.groq_model)