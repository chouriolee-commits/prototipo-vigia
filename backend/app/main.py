from pathlib import Path

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.session import engine

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

_MEDIA_BASE = (
    Path(settings.vision_samples_dir)
    if Path(settings.vision_samples_dir).is_absolute()
    else next(
        candidato
        for candidato in [
            (Path.cwd() / settings.vision_samples_dir),
            (Path(__file__).resolve().parents[1] / settings.vision_samples_dir),
        ]
        if candidato.is_dir()
    )
).resolve()


@app.get("/media/{path:path}")
async def servir_media(path: str) -> FileResponse:
    destino = (_MEDIA_BASE / path).resolve()
    if not destino.is_relative_to(_MEDIA_BASE) or not destino.is_file():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(destino)


@app.get("/health")
async def health(response: Response) -> dict[str, str]:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
        response.status_code = 503
    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "db": db_status,
        "version": settings.version,
    }