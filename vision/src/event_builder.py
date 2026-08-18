from datetime import datetime


def construir_evento(
    fuente: str,
    frame_id: int,
    detecciones: list[dict],
    resolucion: str,
    fps_procesados: int,
) -> dict:
    """Construye el EventoDeteccion (spec-00 §5.1 / spec-01 §6)."""
    animales = []
    for i, d in enumerate(detecciones, start=1):
        animales.append(
            {
                "id_temporal": f"track_{i:03d}",
                "clase": d["clase"],
                "confianza": round(d["confianza"], 4),
                "bbox": [round(v, 2) for v in d["bbox"]],
                "centro": [round(v, 2) for v in d["centro"]],
            }
        )
    return {
        "timestamp": datetime.now().isoformat(timespec="milliseconds"),
        "fuente": fuente,
        "frame_id": frame_id,
        "animales_detectados": animales,
        "conteo_total": len(animales),
        "metadata": {
            "resolucion": resolucion,
            "fps_procesados": fps_procesados,
        },
    }