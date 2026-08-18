import logging

import cv2

logger = logging.getLogger(__name__)


class SourceReader:
    """Lee frames de una fuente: video, imagen o directorio de imágenes."""

    def __init__(self, source: str, samples_dir: str) -> None:
        self.source = source
        self.samples_dir = samples_dir

    def _resolver_ruta(self, ruta: str) -> str:
        if ruta.startswith("samples/"):
            ruta = f"{self.samples_dir}/{ruta[len('samples/'):]}"
        return ruta

    def leer_video(self, ruta: str, fps_sample: int):
        """Itera sobre el video muestreando N frames por segundo.

        Devuelve pares (frame, frame_id) de solo los frames a analizar.
        """
        cap = cv2.VideoCapture(self._resolver_ruta(ruta))
        if not cap.isOpened():
            raise RuntimeError(f"No se pudo abrir el video: {ruta}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        step = max(1, round(fps / max(1, fps_sample)))
        frame_id = 0
        try:
            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                frame_id += 1
                if frame_id % step == 0:
                    yield frame, frame_id
        finally:
            cap.release()

    def leer_imagen(self, ruta: str) -> tuple:
        """Devuelve (frame, frame_id=1) para una imagen estática."""
        frame = cv2.imread(self._resolver_ruta(ruta))
        if frame is None:
            raise RuntimeError(f"No se pudo leer la imagen: {ruta}")
        return frame, 1

    def leer_directorio(self, ruta: str):
        """Itera sobre imágenes de un directorio en orden."""
        import os

        base = self._resolver_ruta(ruta)
        if not os.path.isdir(base):
            raise RuntimeError(f"Directorio no encontrado: {ruta}")
        exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".gif"}
        archivos = sorted(
            os.path.join(base, f) for f in os.listdir(base) if os.path.splitext(f)[1].lower() in exts
        )
        if not archivos:
            raise RuntimeError(f"No hay imágenes en el directorio: {ruta}")
        for i, f in enumerate(archivos, start=1):
            frame = cv2.imread(f)
            if frame is not None:
                yield frame, i