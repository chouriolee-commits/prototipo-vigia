from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.core.config import get_settings

router = APIRouter()

_EXT_VIDEO = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}
_EXT_IMAGEN = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".gif"}


def _normalizar_fuente(source: str) -> str:
    """Quita el prefijo 'samples/' si está presente."""
    source = source.strip()
    if source.startswith("samples/"):
        source = source[len("samples/"):]
    return source


def _tipo_fuente(ruta: str) -> str:
    if ruta.endswith("/"):
        return "directory"
    ext = Path(ruta).suffix.lower()
    if ext in _EXT_VIDEO:
        return "video"
    return "image"


@router.get("/fuente-activa")
async def fuente_activa() -> dict:
    settings = get_settings()
    ruta = _normalizar_fuente(settings.vision_source)
    tipo = _tipo_fuente(ruta)

    if tipo == "directory":
        base = Path(settings.vision_samples_dir).resolve()
        directorio = (base / ruta).resolve()
        if not directorio.is_dir():
            raise HTTPException(status_code=404, detail="Directorio de fuente no encontrado")
        imagenes = [
            {"nombre": p.name, "url_media": f"/media/{ruta.rstrip('/')}/{p.name}"}
            for p in sorted(directorio.iterdir())
            if p.suffix.lower() in _EXT_IMAGEN
        ]
        return {"tipo": "directory", "imagenes": imagenes}

    nombre = Path(ruta).name
    return {"tipo": tipo, "nombre": nombre, "url_media": f"/media/{ruta}"}