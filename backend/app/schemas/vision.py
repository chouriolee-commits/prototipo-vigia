from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class AnimalDetectado(BaseModel):
    """Un animal detectado en un frame (spec-00 §5.1)."""

    id_temporal: str
    clase: str = "cow"
    confianza: float = Field(ge=0, le=1)
    bbox: list[float] = Field(min_length=4, max_length=4)
    centro: list[float] = Field(min_length=2, max_length=2)


class MetadataVision(BaseModel):
    resolucion: str = "1280x720"
    fps_procesados: int = 1


class EventoDeteccion(BaseModel):
    """Payload que envía el módulo de visión (spec-00 §5.1)."""

    timestamp: datetime
    fuente: str
    frame_id: int
    animales_detectados: list[AnimalDetectado]
    conteo_total: int
    metadata: MetadataVision = Field(default_factory=MetadataVision)

    @model_validator(mode="after")
    def _validar_conteo(self) -> "EventoDeteccion":
        if self.conteo_total != len(self.animales_detectados):
            raise ValueError(
                f"conteo_total ({self.conteo_total}) no coincide con "
                f"la cantidad de animales_detectados ({len(self.animales_detectados)})"
            )
        return self