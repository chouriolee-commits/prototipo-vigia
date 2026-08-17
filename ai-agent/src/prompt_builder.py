from datetime import datetime, timezone

from src.schemas import SolicitudAnalisis

DISCLAIMER = (
    "Este análisis es un apoyo a la toma de decisiones del productor. "
    "No constituye un diagnóstico veterinario. Ante cualquier duda, "
    "consulte a un médico veterinario."
)


def construir_prompt_usuario(solicitud: SolicitudAnalisis) -> str:
    """Construye el user prompt dinámicamente (spec-03 §6.2)."""

    eventos = "\n".join(
        f"- {e.timestamp.isoformat()}: {e.animales_detectados} animal(es), "
        f"clase={e.clase_principal or 'desconocida'}, "
        f"confianza={f'{e.confianza:.2f}' if e.confianza is not None else 'N/A'}"
        for e in solicitud.eventos_relacionados
    ) or "- Sin eventos relacionados disponibles."

    return f"""Analiza la siguiente situación detectada en el campo:

TIPO DE ALERTA: {solicitud.tipo_alerta or 'no especificado'}
DESCRIPCIÓN: {solicitud.descripcion_alerta or 'no disponible'}
NIVEL: {solicitud.nivel or 'no especificado'}

EVENTOS RECIENTES:
{eventos}

CONTEXTO DEL HATO:
- Animales registrados: {solicitud.contexto_hato.total_animales_registrados}
- Especie predominante: {solicitud.contexto_hato.especie_predominante}

Proporciona tu análisis en formato JSON con estos campos exactos:
- resumen: descripción objetiva de lo observado (máx. 2 oraciones)
- nivel_urgencia: "baja", "media" o "alta"
- justificacion: razón del nivel de urgencia (máx. 2 oraciones)
- recomendacion: acción sugerida al productor (máx. 1 oración)
- disclaimer: texto obligatorio de no-diagnóstico

Responde ÚNICAMENTE con el JSON, sin texto adicional.
"""


def cargar_system_prompt(ruta: str) -> str:
    with open(ruta, encoding="utf-8") as f:
        return f.read()


def analisis_fallback(alerta_id: int, modelo: str) -> dict:
    """Análisis de fallback cuando Groq no responde (spec-03 §8)."""
    return {
        "alerta_id": alerta_id,
        "resumen": "No fue posible completar el análisis automático en este momento.",
        "nivel_urgencia": "media",
        "justificacion": "El servicio de análisis IA no pudo procesar la solicitud.",
        "recomendacion": "Revisar manualmente la alerta generada.",
        "disclaimer": DISCLAIMER,
        "modelo_usado": "fallback",
        "tokens_usados": 0,
        "timestamp": datetime.now(timezone.utc),
    }


def construir_contexto_hato(contexto) -> str:
    return (
        f"- Animales registrados: {contexto.total_animales_registrados}\n"
        f"- Especie predominante: {contexto.especie_predominante}"
    )


def chat_fallback(modelo: str) -> str:
    return (
        "No fue posible conectar con el modelo de IA en este momento. "
        "Intenta nuevamente en unos segundos."
    )