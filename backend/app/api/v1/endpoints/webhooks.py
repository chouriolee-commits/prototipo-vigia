from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class WebhookN8N(BaseModel):
    tipo: str
    alerta_id: int
    resultado: str | None = None


@router.post("/n8n")
async def webhook_n8n(payload: WebhookN8N) -> dict[str, bool]:
    return {"ok": True}