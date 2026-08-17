from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

NivelRelevancia = Literal["normal", "media", "alta"]


class EventoBase(BaseModel):
    animal_id: int | None = None
    tipo: str
    descripcion: str | None = None
    timestamp_evento: datetime
    nivel_relevancia: NivelRelevancia = "normal"
    fuente: str | None = None


class EventoCreate(EventoBase):
    datos_raw: dict | None = None


class EventoRead(EventoBase):
    id: int
    datos_raw: dict | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventoIngestResponse(BaseModel):
    evento_id: int
    alerta_generada: bool
    alerta_id: int | None = None


class EventoStats(BaseModel):
    total_eventos: int
    por_tipo: dict[str, int]
    por_nivel: dict[str, int]