# SPEC-00 — Arquitectura General y Contratos de Integración

**Proyecto:** VIGÍA — Visión Inteligente para la Gestión y Vigilancia Animal  
**Versión:** 1.0  
**Estado:** Borrador  
**Fecha:** 2026-08-16

---

## 1. Propósito de este documento

Este Spec es el documento fundacional del proyecto. Define la visión de conjunto, los contratos entre módulos y las decisiones arquitectónicas que guían a todos los demás Specs. Ningún módulo debe implementarse sin leer este documento primero.

---

## 2. Visión del sistema

VIGÍA es un prototipo de plataforma de monitoreo ganadero que combina visión artificial, análisis de comportamiento y agentes de IA para apoyar la toma de decisiones del productor.

**El sistema NO diagnostica enfermedades veterinarias.**  
Detecta patrones, comportamientos anómalos y cambios de actividad que justifican una inspección humana.

---

## 3. Flujo de datos de extremo a extremo

```
[Fuente simulada: imagen/video pregrabado]
        │
        ▼
[Módulo de Visión Artificial]          ← YOLO v8n preentrenado (COCO) + OpenCV
        │  Produce: EventoDeteccion (JSON)
        ▼
[Backend API REST]                     ← FastAPI + Python
        │  Persiste en MySQL
        │  Invoca al Agente IA si es necesario
        │  Dispara webhook a n8n si hay alerta
        ▼
[Base de datos]                        ← MySQL
        │
        ├──────────────────────────────►[Agente IA]   ← Groq API / openai/gpt-oss-20b
        │                                     │  Produce: AnalisisIA (JSON)
        │◄─────────────────────────────────────
        │
        ├──────────────────────────────►[n8n]         ← Automatización / notificaciones
        │
        ▼
[Dashboard Web]                        ← React + Vite (consume API REST)
        │
        ▼
[Productor ganadero]
```

---

## 4. Estructura del repositorio (monorepo)

```
prototipo-vigia/
├── .kiro/
│   └── specs/                  ← Documentos Spec-Driven Development
├── vision/                     ← Módulo de visión artificial (Python)
│   ├── src/
│   ├── models/                 ← Pesos YOLO (no versionar archivos grandes)
│   ├── samples/                ← Imágenes/video de prueba
│   ├── requirements.txt
│   └── Dockerfile
├── backend/                    ← API REST (FastAPI)
│   ├── app/
│   │   ├── api/                ← Routers (endpoints)
│   │   ├── core/               ← Configuración, settings
│   │   ├── db/                 ← Modelos SQLAlchemy, migraciones
│   │   ├── services/           ← Lógica de negocio
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── ai-agent/                   ← Agente de IA (Python)
│   ├── src/
│   ├── prompts/                ← Templates de prompts
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   ← Dashboard React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/           ← Llamadas a la API REST
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
├── n8n/
│   └── workflows/              ← Exportaciones de flujos n8n (.json)
├── infra/
│   └── mysql/
│       └── init.sql            ← Script de inicialización de la BD
├── docker-compose.yml          ← Levanta todos los servicios
├── .env.example                ← Variables de entorno de ejemplo
├── .gitignore
└── README.md
```

---

## 5. Modelos de datos compartidos (lenguaje común)

Estos son los objetos que fluyen entre módulos. Todos deben respetarlos.

### 5.1 EventoDeteccion

Producido por el módulo de visión. Enviado al backend vía HTTP POST.

```json
{
  "timestamp": "2026-08-16T10:30:00Z",
  "fuente": "video_simulado_01.mp4",
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

### 5.2 Animal

Entidad persistida en la base de datos.

```json
{
  "id": 1,
  "identificador": "VAC-001",
  "especie": "bovino",
  "sexo": "hembra",
  "fecha_registro": "2026-08-01",
  "activo": true
}
```

### 5.3 Evento

Evento procesado y persistido en la base de datos.

```json
{
  "id": 101,
  "animal_id": 1,
  "tipo": "deteccion",
  "descripcion": "Animal detectado en zona norte",
  "timestamp": "2026-08-16T10:30:00Z",
  "datos_raw": { ... },
  "nivel_relevancia": "normal"
}
```

### 5.4 Alerta

Generada por el backend cuando un evento supera umbrales configurados.

```json
{
  "id": 55,
  "evento_id": 101,
  "tipo_alerta": "comportamiento_anomalo",
  "descripcion": "Se detectó posible aislamiento de animal",
  "nivel": "media",
  "estado": "pendiente",
  "timestamp": "2026-08-16T10:30:05Z",
  "analisis_ia": null
}
```

### 5.5 AnalisisIA

Producido por el Agente IA. Se almacena en la base de datos asociado a una alerta.

```json
{
  "alerta_id": 55,
  "resumen": "Se observa un patrón de separación del grupo. El animal lleva más de 2 horas con actividad reducida.",
  "nivel_urgencia": "media",
  "justificacion": "El comportamiento es consistente con malestar o inicio de parto. Se recomienda inspección visual.",
  "recomendacion": "Verificar estado del animal en las próximas 2 horas.",
  "disclaimer": "Este análisis es apoyo a la toma de decisiones. No constituye un diagnóstico veterinario.",
  "modelo_usado": "openai/gpt-oss-20b",
  "timestamp": "2026-08-16T10:30:08Z"
}
```

---

## 6. Contratos de comunicación entre módulos

| Origen | Destino | Mecanismo | Endpoint / Canal |
|--------|---------|-----------|-----------------|
| Visión Artificial | Backend | HTTP POST | `POST /api/v1/eventos/ingest` |
| Backend | Agente IA | HTTP POST interno | `POST /api/v1/ia/analizar` |
| Backend | n8n | HTTP POST (webhook) | URL configurable en `.env` |
| Frontend | Backend | HTTP GET/POST REST | `GET /api/v1/*` |
| n8n | Backend (opcional) | HTTP POST | `POST /api/v1/webhooks/n8n` |

---

## 7. Decisiones arquitectónicas

### 7.1 Monorepo
**Decisión:** Un solo repositorio con carpetas por módulo.  
**Justificación:** Simulacro individual. Facilita la coordinación y el Docker Compose compartido.

### 7.2 YOLOv8n preentrenado (COCO)
**Decisión:** Usar el modelo `yolov8n.pt` de Ultralytics sin fine-tuning.  
**Justificación:** COCO incluye clases `cow`, `horse`, `sheep`. Suficiente para el MVP. Evita el costo de preparar un dataset personalizado. El modelo nano es el más rápido y ligero.

### 7.3 Groq API — openai/gpt-oss-20b
**Decisión:** Usar la API de Groq con el modelo `openai/gpt-oss-20b`.  
**Justificación:** Tier gratuito funcional (30 RPM, 250K TPM). Latencia muy baja (~100ms). Suficiente capacidad para interpretar eventos estructurados y generar análisis de comportamiento en lenguaje natural. No se requiere un modelo más grande para este problema.

### 7.4 Agente IA como servicio separado
**Decisión:** El agente IA vive en su propio módulo `ai-agent/` con su propio Dockerfile.  
**Justificación:** Permite cambiarlo o escalarlo independientemente del backend. El backend lo llama como servicio HTTP interno.

### 7.5 n8n para automatización
**Decisión:** n8n recibe webhooks del backend cuando se genera una alerta.  
**Justificación:** Evita escribir integraciones de notificación (email, WhatsApp, Telegram) directamente en el backend. Mantiene la lógica de negocio separada de la automatización.

### 7.6 MySQL como única base de datos
**Decisión:** Un solo servicio MySQL para todo el backend.  
**Justificación:** MVP. No se justifica Redis ni otra base. Todas las consultas del dashboard son asíncronas y toleran latencia normal de SQL.

### 7.7 Frontend sin lógica de negocio
**Decisión:** React solo consume la API REST. No hace cálculos, no maneja reglas.  
**Justificación:** Principio de separación. Si el backend cambia la regla de una alerta, el frontend no necesita actualizarse.

### 7.8 Credenciales por variables de entorno
**Decisión:** Todas las credenciales se leen desde `.env`. Nunca hardcodeadas.  
**Justificación:** Seguridad básica. Permite que cada desarrollador tenga su `.env` local sin afectar el repositorio.

---

## 8. Variables de entorno globales

```env
# Base de datos
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=vigia
MYSQL_PASSWORD=<secreto>
MYSQL_DATABASE=vigia_db

# Backend
BACKEND_PORT=8000
SECRET_KEY=<secreto>

# Agente IA
AI_AGENT_PORT=8001
GROQ_API_KEY=<tu_api_key_de_groq>
GROQ_MODEL=openai/gpt-oss-20b

# Visión
VISION_PORT=8002
VISION_SOURCE=samples/video_demo.mp4

# n8n
N8N_PORT=5678
N8N_WEBHOOK_URL=http://n8n:5678/webhook/vigia-alerta

# Frontend
VITE_API_BASE_URL=http://localhost:8000
```

---

## 9. Criterios de aceptación del MVP

El MVP se considera funcional cuando:

- [ ] El módulo de visión procesa un video de prueba y detecta animales (vaca, caballo u oveja)
- [ ] Los eventos de detección llegan al backend y se persisten en MySQL
- [ ] El backend genera una alerta cuando se cumplen condiciones configurables
- [ ] El agente IA analiza la alerta y devuelve un análisis con disclaimer visible
- [ ] n8n recibe el webhook de la alerta y ejecuta al menos una automatización (log o notificación simple)
- [ ] El dashboard muestra eventos recientes, alertas activas y el análisis del agente IA
- [ ] Todo el sistema se levanta con `docker compose up`
- [ ] No hay credenciales hardcodeadas en el código

---

## 10. Specs relacionados

- [spec-01](spec-01-vision-artificial.md) — Módulo de Visión Artificial
- [spec-02](spec-02-backend-api.md) — Backend y API REST
- [spec-03](spec-03-agente-ia.md) — Agente de IA
- [spec-04](spec-04-automatizacion-n8n.md) — Automatización con n8n
- [spec-05](spec-05-dashboard-frontend.md) — Dashboard Web
- [spec-06](spec-06-infraestructura.md) — Infraestructura y Despliegue Local
