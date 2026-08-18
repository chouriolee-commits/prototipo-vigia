import logging

from ultralytics import YOLO

logger = logging.getLogger(__name__)

# Clases COCO de interés ganadero (spec-01 §4).
CLASES_INTERES = {
    19: "cow",
    17: "horse",
    18: "sheep",
}


class Detector:
    """Envuelve el modelo YOLOv8n y filtra por clases de interés ganadero."""

    def __init__(self, modelo: str = "yolov8n.pt", conf_threshold: float = 0.45) -> None:
        self.conf_threshold = conf_threshold
        self.modelo = YOLO(modelo)

    def detectar(self, frame) -> list[dict]:
        """Ejecuta inferencia y devuelve las detecciones de interés.

        Cada detección: {clase, confianza, bbox, centro}
        """
        resultados = self.modelo(frame, conf=self.conf_threshold, verbose=False)
        detecciones: list[dict] = []
        if not resultados:
            return detecciones

        cajas = resultados[0].boxes
        if cajas is None or len(cajas) == 0:
            return detecciones

        for box in cajas:
            cls_id = int(box.cls.item())
            clase = CLASES_INTERES.get(cls_id)
            if clase is None:
                continue
            confianza = float(box.conf.item())
            x1, y1, x2, y2 = (float(v) for v in box.xyxy[0].tolist())
            centro = [(x1 + x2) / 2, (y1 + y2) / 2]
            detecciones.append(
                {
                    "clase": clase,
                    "confianza": confianza,
                    "bbox": [x1, y1, x2, y2],
                    "centro": centro,
                }
            )
        return detecciones