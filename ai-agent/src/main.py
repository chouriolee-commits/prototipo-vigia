import logging

from fastapi import FastAPI, HTTPException, Response
from pydantic import ValidationError

from src.agent import VigilAgent
from src.config import get_config
from src.prompt_builder import DISCLAIMER
from src.schemas import AnalisisIA, RespuestaChat, SolicitudAnalisis, SolicitudChat

logging.basicConfig(level=logging.INFO)

config = get_config()
agent = VigilAgent()

app = FastAPI(title="VIGÍA Agente IA", version="1.0.0")


@app.post("/analizar", response_model=AnalisisIA)
async def analizar(payload: SolicitudAnalisis) -> dict:
    try:
        return await agent.analizar(payload)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc


@app.post("/chat", response_model=RespuestaChat)
async def chat(payload: SolicitudChat) -> dict:
    try:
        return await agent.charlar(payload)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc


@app.get("/health")
async def health(response: Response) -> dict[str, str | bool]:
    status = "ok" if config.groq_api_key else "degraded"
    if not config.groq_api_key:
        response.status_code = 503
    return {
        "status": status,
        "modelo": config.groq_model,
        "groq_api_key_configured": bool(config.groq_api_key),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=config.ai_agent_port)