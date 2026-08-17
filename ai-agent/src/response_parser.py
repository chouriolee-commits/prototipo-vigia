import json
import logging
import re
from datetime import datetime, timezone

from src.schemas import AnalisisIA

logger = logging.getLogger(__name__)


class RespuestaInvalidaError(Exception):
    """La respuesta del LLM no pudo ser parseada/validada."""


def extraer_bloque_json(texto: str) -> dict:
    """Extrae el primer objeto JSON de la respuesta del LLM."""
    if not texto:
        raise RespuestaInvalidaError("Respuesta vacía")

    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        pass

    # Busca un bloque JSON dentro de la respuesta (puede venir con código/backticks)
    match = re.search(r"\{.*\}", texto, re.DOTALL)
    if not match:
        raise RespuestaInvalidaError("No se encontró JSON en la respuesta")
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError as exc:
        raise RespuestaInvalidaError(f"JSON malformado: {exc}") from exc


def validar_respuesta(alerta_id: int, datos: dict, modelo: str) -> AnalisisIA:
    """Valida y normaliza la respuesta contra el contrato de salida.

    El LLM solo genera los campos de análisis; el agente inyecta
    alerta_id, modelo_usado y timestamp (spec-03 §5).
    """
    datos.setdefault("alerta_id", alerta_id)
    datos.setdefault("modelo_usado", modelo)
    datos.setdefault("timestamp", datetime.now(timezone.utc))
    try:
        return AnalisisIA.model_validate(datos)
    except Exception as exc:
        raise RespuestaInvalidaError(f"Validación fallida: {exc}") from exc