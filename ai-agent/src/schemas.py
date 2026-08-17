from datetime import datetime

from pydantic import BaseModel, Field


class EventoRelacionado(BaseModel):
    timestamp: datetime
    animales_detectados: int
    clase_principal: str | None = None
    confianza: float | None = Field(default=None, ge=0, le=1)


class ContextoHato(BaseModel):
    total_animales_registrados: int = 0
    especie_predominante: str = "bovino"


class SolicitudAnalisis(BaseModel):
    """Contrato de entrada del agente (spec-03 §4)."""

    alerta_id: int
    tipo_alerta: str | None = None
    descripcion_alerta: str | None = None
    nivel: str | None = None
    eventos_relacionados: list[EventoRelacionado] = Field(default_factory=list)
    contexto_hato: ContextoHato = Field(default_factory=ContextoHato)


class AnalisisIA(BaseModel):
    """Contrato de salida del agente (spec-03 §5)."""

    alerta_id: int
    resumen: str
    nivel_urgencia: str
    justificacion: str
    recomendacion: str
    disclaimer: str
    modelo_usado: str
    tokens_usados: int = 0
    timestamp: datetime


class MensajeChat(BaseModel):
    rol: str
    contenido: str


class SolicitudChat(BaseModel):
    """Contrato de entrada del chat (mensajes + contexto opcional del hato)."""

    mensajes: list[MensajeChat]
    contexto_hato: ContextoHato = Field(default_factory=ContextoHato)


class RespuestaChat(BaseModel):
    """Contrato de salida del chat."""

    respuesta: str
    modelo_usado: str
    tokens_usados: int = 0
    timestamp: datetime