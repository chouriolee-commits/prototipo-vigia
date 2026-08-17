from pydantic import BaseModel, Field


class AnalizarRequest(BaseModel):
    alerta_id: int


class MensajeChat(BaseModel):
    rol: str
    contenido: str


class ChatRequest(BaseModel):
    mensajes: list[MensajeChat]
    contexto_hato: dict = Field(default_factory=dict)


class ChatResponse(BaseModel):
    respuesta: str
    modelo_usado: str = ""
    tokens_usados: int = 0
    timestamp: str = ""