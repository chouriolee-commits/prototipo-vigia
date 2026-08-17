from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

Nivel = Literal["baja", "media", "alta"]
Estado = Literal["pendiente", "revisada", "descartada"]


class AlertaBase(BaseModel):
    evento_id: int
    tipo_alerta: str
    descripcion: str
    nivel: Nivel = "media"
    estado: Estado = "pendiente"


class AlertaRead(AlertaBase):
    id: int
    analisis_ia: dict | None
    notificado_n8n: bool
    timestamp: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertaEstadoUpdate(BaseModel):
    estado: Estado


class AnalisisIA(BaseModel):
    """Respuesta del agente IA (spec-00 §5.5)."""

    alerta_id: int
    resumen: str
    nivel_urgencia: str
    justificacion: str
    recomendacion: str
    disclaimer: str
    modelo_usado: str
    timestamp: datetime