# SPEC-02 — Backend y API REST

**Proyecto:** VIGÍA — Visión Inteligente para la Gestión y Vigilancia Animal  
**Versión:** 1.0  
**Estado:** Borrador  
**Fecha:** 2026-08-16  
**Depende de:** [spec-00](spec-00-arquitectura-general.md)

---

## 1. Propósito

El backend es el núcleo de la lógica de negocio del sistema. Es responsable de:

- Recibir eventos del módulo de visión artificial
- Persistir datos en MySQL
- Aplicar reglas de negocio para generar alertas
- Coordinar la invocación del agente IA
- Disparar webhooks a n8n cuando hay alertas
- Exponer la API REST que consume el dashboard

MySQL es accesible **únicamente** desde el backend. Ningún otro módulo conecta directamente a la base de datos.

---

## 2. Tecnologías

| Componente | Tecnología |
|------------|------------|
| Framework web | FastAPI |
| ORM | SQLAlchemy (async) |
| Driver MySQL | aiomysql |
| Migraciones | Alembic |
| Validación | Pydantic v2 |
| HTTP cliente (IA, n8n) | httpx |
| Servidor | Uvicorn |

---

## 3. Modelo de datos (MySQL)

### 3.1 Tabla `animales`

```sql
CREATE TABLE animales (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    identificador   VARCHAR(50) UNIQUE NOT NULL,   -- 'VAC-001'
    especie         ENUM('bovino','equino','ovino','otro') NOT NULL,
    sexo            ENUM('macho','hembra','desconocido') DEFAULT 'desconocido',
    fecha_registro  DATE NOT NULL,
    activo          BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.2 Tabla `eventos`

```sql
CREATE TABLE eventos (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    animal_id           INT,                              -- NULL si no se identifica individuo
    tipo                VARCHAR(50) NOT NULL,             -- 'deteccion', 'ausencia', 'anomalia'
    descripcion         TEXT,
    timestamp_evento    DATETIME NOT NULL,
    datos_raw           JSON,                             -- EventoDeteccion original
    nivel_relevancia    ENUM('normal','media','alta') DEFAULT 'normal',
    fuente              VARCHAR(255),                     -- nombre del archivo/cámara
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animales(id) ON DELETE SET NULL
);
```

### 3.3 Tabla `alertas`

```sql
CREATE TABLE alertas (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    evento_id       INT NOT NULL,
    tipo_alerta     VARCHAR(100) NOT NULL,
    descripcion     TEXT NOT NULL,
    nivel           ENUM('baja','media','alta') DEFAULT 'media',
    estado          ENUM('pendiente','revisada','descartada') DEFAULT 'pendiente',
    analisis_ia     JSON,                                 -- AnalisisIA del agente
    notificado_n8n  BOOLEAN DEFAULT FALSE,
    timestamp       DATETIME NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evento_id) REFERENCES eventos(id)
);
```

### 3.4 Tabla `configuracion`

```sql
CREATE TABLE configuracion (
    clave   VARCHAR(100) PRIMARY KEY,
    valor   TEXT NOT NULL,
    descripcion TEXT
);

-- Valores iniciales
INSERT INTO configuracion VALUES
('umbral_confianza_alerta', '0.75', 'Confianza mínima para generar alerta'),
('animales_minimos_hato', '3', 'Número mínimo esperado de animales en campo'),
('ventana_inactividad_min', '60', 'Minutos sin detección para considerar ausencia');
```

---

## 4. Endpoints de la API

**Prefijo base:** `/api/v1`

### 4.1 Ingesta de eventos (llamado por visión)

```
POST /api/v1/eventos/ingest
Body: EventoDeteccion (ver spec-00 §5.1)
Response 201: { "evento_id": 101, "alerta_generada": false }
Response 400: { "error": "payload inválido" }
```

### 4.2 Animales

```
GET    /api/v1/animales                → Lista de animales activos
GET    /api/v1/animales/{id}           → Detalle de un animal
POST   /api/v1/animales                → Crear animal
PUT    /api/v1/animales/{id}           → Actualizar animal
DELETE /api/v1/animales/{id}           → Desactivar animal (soft delete)
```

### 4.3 Eventos

```
GET /api/v1/eventos                    → Lista paginada (query: ?limit=50&offset=0&desde=ISO&hasta=ISO)
GET /api/v1/eventos/{id}               → Detalle de evento
GET /api/v1/eventos/stats              → Resumen: conteos por tipo y nivel en últimas 24h
```

### 4.4 Alertas

```
GET    /api/v1/alertas                 → Lista paginada (query: ?estado=pendiente&nivel=alta)
GET    /api/v1/alertas/{id}            → Detalle de alerta con análisis IA incluido
PUT    /api/v1/alertas/{id}/estado     → Actualizar estado (revisada / descartada)
```

### 4.5 Dashboard (agregados para frontend)

```
GET /api/v1/dashboard/resumen          → Conteos globales: animales activos, eventos hoy, alertas pendientes
GET /api/v1/dashboard/actividad        → Eventos de las últimas 24h agrupados por hora
GET /api/v1/dashboard/alertas-recientes → Últimas 10 alertas con análisis IA
```

### 4.6 IA (invocación interna, también expuesta)

```
POST /api/v1/ia/analizar
Body: { "alerta_id": 55 }
Response 200: AnalisisIA (ver spec-00 §5.5)
```

### 4.7 Webhook entrada desde n8n

```
POST /api/v1/webhooks/n8n
Body: { "tipo": "confirmacion_notificacion", "alerta_id": 55, "resultado": "enviado" }
Response 200: { "ok": true }
```

### 4.8 Monitor de fuente multimedia

Estos endpoints sirven la información del archivo que el módulo de visión está procesando, para que el frontend pueda mostrarlo en la Vista 6 (Monitor).

```
GET /api/v1/vision/fuente-activa
→ Tipo video:
  {
    "tipo": "video",
    "nombre": "video_demo.mp4",
    "url_media": "/media/video_demo.mp4"
  }
→ Tipo imagen:
  {
    "tipo": "image",
    "nombre": "foto_01.jpg",
    "url_media": "/media/foto_01.jpg"
  }
→ Tipo directorio:
  {
    "tipo": "directory",
    "imagenes": [
      { "nombre": "foto_01.jpg", "url_media": "/media/fotos/foto_01.jpg" },
      { "nombre": "foto_02.jpg", "url_media": "/media/fotos/foto_02.jpg" }
    ]
  }
```

```
GET /media/{path}   → Sirve el archivo multimedia estático (video o imagen)
```

El backend lee la variable `VISION_SOURCE` para determinar qué tipo de fuente está activa y construye las URLs de `/media/`. Los archivos físicos viven en el volumen compartido `vision/samples/` montado también en el backend como solo lectura.

### 4.9 Estado del servicio

```
GET /health → 200 { "status": "ok", "db": "connected", "version": "1.0.0" }
```

---

## 5. Reglas de negocio

### 5.1 Generación de alertas

El backend evalúa cada `EventoDeteccion` entrante y genera una `Alerta` cuando se cumple cualquiera de estas condiciones:

| Condición | Tipo de alerta | Nivel |
|-----------|---------------|-------|
| Confianza de detección ≥ umbral configurable Y animal detectado solo (conteo=1) por más de N frames | `posible_aislamiento` | media |
| Conteo de animales detectados es menor al mínimo configurado del hato | `conteo_bajo` | alta |
| No se detectan animales en la fuente por más de X minutos | `sin_actividad` | alta |
| Confianza promedio cae por debajo del 50% en los últimos 10 eventos | `calidad_video_baja` | baja |

Los umbrales provienen de la tabla `configuracion` y son modificables sin redeployar.

### 5.2 Flujo al recibir un EventoDeteccion

```
1. Validar payload (Pydantic)
2. Persistir en tabla eventos
3. Evaluar reglas de negocio
4. Si corresponde:
   a. Crear registro en tabla alertas
   b. Llamar al agente IA: POST http://ai-agent:8001/analizar
   c. Guardar AnalisisIA en alertas.analisis_ia
   d. Enviar webhook a n8n: POST N8N_WEBHOOK_URL
5. Retornar respuesta al módulo de visión
```

### 5.3 Invocación al agente IA

- Se invoca únicamente cuando se genera una nueva alerta (no en cada evento)
- Si el agente IA no responde en 10 segundos, la alerta se guarda sin análisis IA
- El análisis IA se puede solicitar manualmente después vía `POST /api/v1/ia/analizar`

---

## 6. Estructura del módulo

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── animales.py
│   │   │   │   ├── eventos.py
│   │   │   │   ├── alertas.py
│   │   │   │   ├── dashboard.py
│   │   │   │   ├── ia.py
│   │   │   │   └── webhooks.py
│   │   │   └── router.py
│   │   └── deps.py              ← Dependencias (sesión DB, auth)
│   ├── core/
│   │   ├── config.py            ← Settings desde variables de entorno
│   │   └── security.py          ← API key validation
│   ├── db/
│   │   ├── base.py              ← Base SQLAlchemy
│   │   ├── session.py           ← Engine y sesión async
│   │   └── models/
│   │       ├── animal.py
│   │       ├── evento.py
│   │       └── alerta.py
│   ├── schemas/                 ← Pydantic schemas (request/response)
│   │   ├── animal.py
│   │   ├── evento.py
│   │   ├── alerta.py
│   │   └── dashboard.py
│   ├── services/
│   │   ├── ingesta_service.py   ← Lógica de procesamiento de EventoDeteccion
│   │   ├── alerta_service.py    ← Reglas de negocio para alertas
│   │   ├── ia_client.py         ← Cliente HTTP para el agente IA
│   │   └── n8n_client.py        ← Cliente HTTP para n8n webhook
│   └── main.py                  ← App FastAPI, registro de routers
├── alembic/                     ← Migraciones de base de datos
│   └── versions/
├── requirements.txt
└── Dockerfile
```

---

## 7. Autenticación (MVP)

Para el MVP se usa **API Key** simple:

- El frontend y el módulo de visión deben incluir el header: `X-API-Key: <valor>`
- El valor se configura en la variable de entorno `API_KEY`
- Los endpoints `/health` y `POST /api/v1/eventos/ingest` están exentos de autenticación para facilitar la integración con visión

---

## 8. Variables de entorno

```env
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=vigia
MYSQL_PASSWORD=<secreto>
MYSQL_DATABASE=vigia_db

BACKEND_PORT=8000
API_KEY=<secreto>
SECRET_KEY=<secreto_jwt_si_se_usa_despues>

AI_AGENT_URL=http://ai-agent:8001
AI_AGENT_TIMEOUT=10

N8N_WEBHOOK_URL=http://n8n:5678/webhook/vigia-alerta
N8N_ENABLED=true
```

---

## 9. Dependencias Python

```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy[asyncio]>=2.0.0
aiomysql>=0.2.0
alembic>=1.12.0
pydantic>=2.4.0
pydantic-settings>=2.0.0
httpx>=0.25.0
python-dotenv>=1.0.0
```

---

## 10. Criterios de aceptación

- [ ] `POST /api/v1/eventos/ingest` recibe un `EventoDeteccion` válido y responde 201
- [ ] El evento queda persistido en la tabla `eventos` de MySQL
- [ ] Las reglas de negocio generan una alerta cuando corresponde
- [ ] La alerta queda persistida en la tabla `alertas`
- [ ] `GET /api/v1/dashboard/resumen` devuelve datos actualizados
- [ ] `GET /api/v1/alertas` devuelve alertas paginadas
- [ ] Si el agente IA no responde, la alerta se guarda igual sin análisis
- [ ] El endpoint `/health` reporta estado de conexión a la base de datos
- [ ] Ninguna credencial está hardcodeada en el código

---

## 11. Referencia cruzada

- Contrato `EventoDeteccion`: [spec-00 §5.1](spec-00-arquitectura-general.md)
- Contrato `AnalisisIA`: [spec-00 §5.5](spec-00-arquitectura-general.md)
- Módulo que envía eventos: [spec-01](spec-01-vision-artificial.md)
- Agente IA invocado por este backend: [spec-03](spec-03-agente-ia.md)
- n8n que recibe webhooks: [spec-04](spec-04-automatizacion-n8n.md)
- Frontend que consume esta API: [spec-05](spec-05-dashboard-frontend.md)
