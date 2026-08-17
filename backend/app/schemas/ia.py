from pydantic import BaseModel


class AnalizarRequest(BaseModel):
    alerta_id: int