# SPEC-01 — Módulo de Visión Artificial

**Proyecto:** VIGÍA — Visión Inteligente para la Gestión y Vigilancia Animal  
**Versión:** 1.0  
**Estado:** Borrador  
**Fecha:** 2026-08-16  
**Depende de:** [spec-00](spec-00-arquitectura-general.md)

---

## 1. Propósito

Este módulo es responsable de procesar imágenes o video pregrabado, detectar animales usando YOLOv8n y producir eventos estructurados que el backend puede consumir.

Es el único componente del sistema que trabaja con datos visuales crudos. Su output es siempre JSON estructurado, nunca interpretación semántica.

---

## 2. Responsabilidades

- Leer una fuente de datos (imagen estática, directorio de imágenes o archivo de video)
- Ejecutar inferencia con YOLOv8n preentrenado sobre COCO
- Filtrar detecciones por clases de interés ganadero
- Producir un `EventoDeteccion` por frame/imagen procesada
- Enviar el evento al backend vía HTTP POST
- Exponer un endpoint de estado (`/health`) para verificar que el servicio está activo

---

## 3. Fuente de datos (simulación)

Para el MVP no se requiere hardware físico. Se simulan tres modos:

| Modo | Descripción | Variable de entorno |
|------|-------------|-------------------|
| `image` | Procesa una imagen estática única | `VISION_SOURCE=samples/foto.jpg` |
| `directory` | Procesa todas las imágenes de una carpeta en orden | `VISION_SOURCE=samples/fotos/` |
| `video` | Procesa un archivo de video frame a frame | `VISION_SOURCE=samples/video_demo.mp4` |

El modo activo se detecta automáticamente por la extensión o tipo del path.

**Archivos de muestra incluidos en el repositorio:**  
Se incluirán en `vision/samples/` imágenes de libre uso con vacas y ovejas para que el sistema funcione sin configuración adicional.

---

## 4. Modelo YOLO

- **Modelo:** `yolov8n.pt` (YOLOv8 nano) de Ultralytics
- **Fuente:** Descarga automática desde Ultralytics al primer arranque
- **Dataset de entrenamiento:** COCO 2017
- **Clases de interés (filtradas):**

| Clase COCO | ID | Uso en VIGÍA |
|------------|-----|--------------|
| `cow`      | 19  | Ganado bovino |
| `horse`    | 17  | Equino |
| `sheep`    | 18  | Ovino |

Las demás clases COCO son descartadas del output.

- **Umbral de confianza mínimo:** `0.45` (configurable vía `VISION_CONF_THRESHOLD`)
- **Frecuencia de muestreo en video:** 1 frame por segundo (configurable vía `VISION_FPS_SAMPLE`)

---

## 5. Pipeline de procesamiento

```
Fuente (imagen/video)
        │
        ▼
    Lectura con OpenCV
        │
        ▼
    Preprocesamiento
    (resize, normalización manejada por Ultralytics)
        │
        ▼
    Inferencia YOLOv8n
        │
        ▼
    Filtro por clase de interés
    (cow, horse, sheep)
        │
        ▼
    Filtro por confianza mínima
        │
        ▼
    Construcción de EventoDeteccion (JSON)
        │
        ▼
    HTTP POST → Backend /api/v1/eventos/ingest
        │
        ▼
    Log del resultado (éxito / error)
```

---

## 6. Output: EventoDeteccion

Contrato definido en spec-00. El módulo de visión produce exactamente este JSON por cada frame donde se detecte al menos un animal de interés.

```json
{
  "timestamp": "2026-08-16T10:30:00Z",
  "fuente": "video_demo.mp4",
  "frame_id": 142,
  "animales_detectados": [
    {
      "id_temporal": "track_001",
      "clase": "cow",
      "confianza": 0.87,
      "bbox": [120, 45, 310, 280],
      "centro": [215, 162]
    }
  ],
  "conteo_total": 1,
  "metadata": {
    "resolucion": "1280x720",
    "fps_procesados": 1
  }
}
```

Si en un frame no se detecta ningún animal de interés, no se genera ni envía ningún evento (silencio por defecto, configurable).

---

## 7. Estructura del módulo

```
vision/
├── src/
│   ├── main.py              ← Punto de entrada, orquesta el pipeline
│   ├── detector.py          ← Clase Detector: carga modelo YOLO, ejecuta inferencia
│   ├── source_reader.py     ← Clase SourceReader: abstrae imagen/directorio/video
│   ├── event_builder.py     ← Construye el JSON EventoDeteccion
│   ├── backend_client.py    ← Envía eventos al backend vía HTTP POST
│   └── config.py            ← Lee variables de entorno
├── models/
│   └── .gitkeep             ← Los pesos YOLO NO se versionan
├── samples/
│   ├── foto_demo.jpg        ← Imagen de prueba con vacas
│   └── video_demo.mp4       ← Video de prueba (o enlace de descarga)
├── requirements.txt
└── Dockerfile
```

---

## 8. Variables de entorno

```env
VISION_SOURCE=samples/video_demo.mp4   # Fuente de datos
VISION_CONF_THRESHOLD=0.45             # Confianza mínima YOLO
VISION_FPS_SAMPLE=1                    # Frames por segundo a analizar en video
VISION_CLASSES=19,17,18                # IDs COCO a detectar (cow,horse,sheep)
BACKEND_URL=http://backend:8000        # URL del backend
BACKEND_INGEST_PATH=/api/v1/eventos/ingest
VISION_LOOP=false                      # Si true, reprocesa la fuente en bucle
```

---

## 9. Endpoint de estado

El módulo expone un servidor HTTP mínimo (FastAPI o servidor simple):

```
GET /health
→ 200 OK  {"status": "ok", "model": "yolov8n", "source": "video_demo.mp4"}
```

---

## 10. Manejo de errores

| Situación | Comportamiento |
|-----------|---------------|
| Backend no disponible | Reintentar 3 veces con backoff exponencial, luego loguear error y continuar |
| Fuente no encontrada | Error fatal al arranque con mensaje claro |
| Frame ilegible | Saltar frame, loguear advertencia, continuar |
| Modelo YOLO no descargado | Descargar automáticamente al primer arranque |
| Confianza por debajo del umbral | Descartar detección silenciosamente |

---

## 11. Limitaciones explícitas

- Este módulo detecta la presencia y posición de animales. **No interpreta comportamiento.**
- No diagnostica enfermedades ni estados de salud.
- La precisión depende de la calidad del video, iluminación y ángulo de la cámara.
- El modelo COCO no está optimizado para ganado específico. La confianza puede variar.
- No implementa tracking persistente entre sesiones (el `id_temporal` es por frame).

---

## 12. Dependencias Python

```
ultralytics>=8.0.0
opencv-python-headless>=4.8.0
httpx>=0.25.0
fastapi>=0.104.0
uvicorn>=0.24.0
python-dotenv>=1.0.0
```

---

## 13. Criterios de aceptación

- [ ] El módulo arranca con `docker compose up` sin intervención manual
- [ ] Procesa correctamente los tres modos de fuente (imagen, directorio, video)
- [ ] Detecta al menos una vaca en la imagen de prueba incluida en `samples/`
- [ ] Envía el `EventoDeteccion` al backend y recibe HTTP 200 o 201
- [ ] Si el backend no está disponible, reintenta sin crashear
- [ ] El endpoint `/health` responde correctamente

---

## 14. Referencia cruzada

- Contrato `EventoDeteccion` definido en: [spec-00 §5.1](spec-00-arquitectura-general.md)
- Endpoint receptor en backend: [spec-02 §4](spec-02-backend-api.md)
