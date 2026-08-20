import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

import cv2
from fastapi import FastAPI
from pydantic import BaseModel

from src.backend_client import BackendClient
from src.config import get_config
from src.detector import Detector
from src.event_builder import construir_evento
from src.source_reader import SourceReader

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("vision")

_PROCESSING = False


class HealthResponse(BaseModel):
    status: str
    model: str
    source: str


@asynccontextmanager
async def lifespan(_: FastAPI):
    task = asyncio.create_task(_procesar_fuente())
    yield
    task.cancel()


def _tipo_fuente(ruta: str) -> str:
    if ruta.endswith("/"):
        return "directory"
    ext = Path(ruta).suffix.lower()
    if ext in {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}:
        return "video"
    return "image"


def _resolucion(frame) -> str:
    h, w = frame.shape[:2]
    return f"{w}x{h}"


async def _procesar_fuente() -> None:
    """Orquesta el pipeline: leer fuente → detectar → enviar al backend."""
    global _PROCESSING
    config = get_config()
    if _PROCESSING:
        return
    _PROCESSING = True
    try:
        detector = Detector(modelo="yolov8m.pt", conf_threshold=config.vision_conf_threshold)
        reader = SourceReader(config.vision_source, config.vision_samples_dir)
        client = BackendClient(config.backend_url, config.backend_ingest_path)

        tipo = _tipo_fuente(config.vision_source)
        ruta = config.vision_source
        fuente_nombre = Path(ruta).name

        logger.info("Procesando fuente tipo=%s ruta=%s", tipo, ruta)

        while True:
            if tipo == "video":
                frames = reader.leer_video(ruta, config.vision_fps_sample)
            elif tipo == "directory":
                frames = reader.leer_directorio(ruta)
            else:
                frames = iter([reader.leer_imagen(ruta)])

            for frame, frame_id in frames:
                detecciones = detector.detectar(frame)
                if not detecciones:
                    continue
                evento = construir_evento(
                    fuente=fuente_nombre,
                    frame_id=frame_id,
                    detecciones=detecciones,
                    resolucion=_resolucion(frame),
                    fps_procesados=config.vision_fps_sample,
                )
                ok = await client.enviar(evento)
                logger.info(
                    "frame=%s detectados=%s enviado=%s",
                    frame_id,
                    len(detecciones),
                    ok,
                )

            if not config.vision_loop:
                logger.info("Procesamiento de la fuente finalizado (loop desactivado).")
                break
            logger.info("Bucle finalizado, reiniciando la fuente…")
            await asyncio.sleep(1)
    except Exception:
        logger.exception("Error en el pipeline de visión")
    finally:
        _PROCESSING = False


app = FastAPI(title="VIGÍA Visión", lifespan=lifespan)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    config = get_config()
    return HealthResponse(
        status="ok" if not _PROCESSING else "procesando",
        model="yolov8m",
        source=config.vision_source,
    )


def main() -> None:
    import uvicorn

    config = get_config()
    uvicorn.run(app, host="0.0.0.0", port=config.vision_port)


if __name__ == "__main__":
    sys.exit(main())