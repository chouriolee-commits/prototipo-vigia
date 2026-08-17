from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Especie = Literal["bovino", "equino", "ovino", "otro"]
Sexo = Literal["macho", "hembra", "desconocido"]


class AnimalBase(BaseModel):
    identificador: str = Field(min_length=1, max_length=50)
    especie: Especie
    sexo: Sexo = "desconocido"
    fecha_registro: date


class AnimalCreate(AnimalBase):
    pass


class AnimalUpdate(BaseModel):
    identificador: str | None = Field(default=None, min_length=1, max_length=50)
    especie: Especie | None = None
    sexo: Sexo | None = None
    fecha_registro: date | None = None
    activo: bool | None = None


class AnimalRead(AnimalBase):
    id: int
    activo: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)