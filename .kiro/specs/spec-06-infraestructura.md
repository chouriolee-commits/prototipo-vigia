# SPEC-06 — Infraestructura y Despliegue Local

**Proyecto:** VIGÍA — Visión Inteligente para la Gestión y Vigilancia Animal  
**Versión:** 1.0  
**Estado:** Borrador  
**Fecha:** 2026-08-16  
**Depende de:** todos los specs anteriores

---

## 1. Propósito

Este Spec define todo lo necesario para que cualquier persona pueda ejecutar VIGÍA completo en su máquina local con un solo comando. La infraestructura se gestiona con Docker Compose.

---

## 2. Servicios del sistema

| Servicio | Imagen base | Puerto host | Puerto interno | Descripción |
|----------|-------------|------------|----------------|-------------|
| `mysql` | `mysql:8.0` | 3306 | 3306 | Base de datos |
| `backend` | `python:3.11-slim` (Dockerfile) | 8000 | 8000 | API REST FastAPI |
| `ai-agent` | `python:3.11-slim` (Dockerfile) | 8001 | 8001 | Agente IA Groq |
| `vision` | `python:3.11-slim` (Dockerfile) | 8002 | 8002 | Módulo YOLO/OpenCV |
| `frontend` | `node:20-alpine` (Dockerfile) | 3000 | 80 | Dashboard React |
| `n8n` | `n8nio/n8n:latest` | 5678 | 5678 | Motor de automatización |

---

## 3. Red y dependencias

Todos los servicios comparten la red `vigia_net` (bridge).

Orden de arranque y dependencias:

```
mysql
  └── backend (espera a que MySQL esté healthy)
        └── ai-agent (independiente, pero se comunica con backend)
        └── vision   (espera a que backend esté listo)
frontend             (independiente, solo consume API)
n8n                  (independiente, recibe webhooks del backend)
```

---

## 4. docker-compose.yml (estructura)

```yaml
version: '3.8'

services:

  mysql:
    image: mysql:8.0
    container_name: vigia_mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "${MYSQL_PORT:-3306}:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./infra/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "${MYSQL_USER}", "-p${MYSQL_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - vigia_net

  backend:
    build: ./backend
    container_name: vigia_backend
    ports:
      - "${BACKEND_PORT:-8000}:8000"
    environment:
      - MYSQL_HOST=mysql
      - MYSQL_PORT=3306
      - MYSQL_USER=${MYSQL_USER}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - API_KEY=${API_KEY}
      - AI_AGENT_URL=http://ai-agent:8001
      - N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL}
      - N8N_ENABLED=${N8N_ENABLED:-true}
      - VISION_SOURCE=${VISION_SOURCE}
    volumes:
      - ./vision/samples:/app/media:ro    # mismo volumen que visión, solo lectura
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - vigia_net
    restart: unless-stopped

  ai-agent:
    build: ./ai-agent
    container_name: vigia_ai_agent
    ports:
      - "${AI_AGENT_PORT:-8001}:8001"
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - GROQ_MODEL=${GROQ_MODEL:-llama-3.1-8b-instant}
      - GROQ_TEMPERATURE=${GROQ_TEMPERATURE:-0.3}
      - GROQ_MAX_TOKENS=${GROQ_MAX_TOKENS:-512}
    networks:
      - vigia_net
    restart: unless-stopped

  vision:
    build: ./vision
    container_name: vigia_vision
    ports:
      - "${VISION_PORT:-8002}:8002"
    environment:
      - VISION_SOURCE=${VISION_SOURCE:-samples/video_demo.mp4}
      - VISION_CONF_THRESHOLD=${VISION_CONF_THRESHOLD:-0.45}
      - VISION_FPS_SAMPLE=${VISION_FPS_SAMPLE:-1}
      - BACKEND_URL=http://backend:8000
      - VISION_LOOP=${VISION_LOOP:-false}
    volumes:
      - ./vision/samples:/app/samples:ro
      - vision_models:/app/models
    depends_on:
      - backend
    networks:
      - vigia_net
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: vigia_frontend
    ports:
      - "${FRONTEND_PORT:-3000}:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:${BACKEND_PORT:-8000}
      - VITE_API_KEY=${API_KEY}
    networks:
      - vigia_net
    restart: unless-stopped

  n8n:
    image: n8nio/n8n:latest
    container_name: vigia_n8n
    ports:
      - "${N8N_PORT:-5678}:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER:-admin}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - WEBHOOK_URL=http://localhost:${N8N_PORT:-5678}
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - vigia_net
    restart: unless-stopped

volumes:
  mysql_data:
  n8n_data:
  vision_models:

networks:
  vigia_net:
    driver: bridge
```

---

## 5. Archivo .env.example

```env
# ============================================================
# VIGÍA — Variables de entorno
# Copiar este archivo como .env y completar los valores
# NUNCA subir .env al repositorio
# ============================================================

# --- Base de datos ---
MYSQL_ROOT_PASSWORD=root_password_aqui
MYSQL_DATABASE=vigia_db
MYSQL_USER=vigia
MYSQL_PASSWORD=vigia_password_aqui
MYSQL_PORT=3306

# --- Backend ---
BACKEND_PORT=8000
API_KEY=cambia_esta_api_key_segura

# --- Agente IA ---
AI_AGENT_PORT=8001
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.1-8b-instant
GROQ_TEMPERATURE=0.3
GROQ_MAX_TOKENS=512

# --- Visión Artificial ---
VISION_PORT=8002
VISION_SOURCE=samples/video_demo.mp4
VISION_CONF_THRESHOLD=0.45
VISION_FPS_SAMPLE=1
VISION_LOOP=false

# --- n8n ---
N8N_PORT=5678
N8N_USER=admin
N8N_PASSWORD=n8n_password_aqui
N8N_ENCRYPTION_KEY=clave_encriptacion_aleatoria
N8N_WEBHOOK_URL=http://n8n:5678/webhook/vigia-alerta
N8N_ENABLED=true

# --- Frontend ---
FRONTEND_PORT=3000
```

---

## 6. Script de inicialización de MySQL

```sql
-- infra/mysql/init.sql
-- Se ejecuta automáticamente al crear el contenedor MySQL por primera vez

CREATE DATABASE IF NOT EXISTS vigia_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vigia_db;

-- Las tablas se crean vía Alembic al arrancar el backend.
-- Este script solo garantiza la existencia de la base de datos.

-- Datos de prueba para desarrollo
INSERT IGNORE INTO animales (identificador, especie, sexo, fecha_registro) VALUES
('VAC-001', 'bovino', 'hembra', '2026-01-15'),
('VAC-002', 'bovino', 'hembra', '2026-01-15'),
('VAC-003', 'bovino', 'macho',  '2026-01-20'),
('OVE-001', 'ovino',  'hembra', '2026-02-01'),
('OVE-002', 'ovino',  'hembra', '2026-02-01');
```

---

## 7. .gitignore

```gitignore
# Variables de entorno (NUNCA versionar)
.env
.env.local
.env.*.local

# Python
__pycache__/
*.pyc
*.pyo
.venv/
venv/
*.egg-info/

# Node
node_modules/
dist/
build/

# Modelos YOLO (archivos grandes)
vision/models/*.pt

# Docker
*.log

# IDE
.vscode/
.idea/

# macOS
.DS_Store
```

---

## 8. Dockerfiles

### backend/Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### ai-agent/Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### vision/Dockerfile

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "src/main.py"]
```

### frontend/Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

---

## 9. Comandos de uso

```bash
# 1. Clonar el repositorio
git clone https://github.com/<usuario>/prototipo-vigia.git
cd prototipo-vigia

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales reales (especialmente GROQ_API_KEY)

# 3. Levantar todos los servicios
docker compose up --build

# 4. Verificar que todo esté funcionando
curl http://localhost:8000/health    # Backend
curl http://localhost:8001/health    # Agente IA
curl http://localhost:8002/health    # Visión
open http://localhost:3000           # Dashboard
open http://localhost:5678           # n8n

# 5. Detener todos los servicios
docker compose down

# 6. Limpiar datos (volúmenes incluidos)
docker compose down -v
```

---

## 10. Estrategia: qué corre en Docker vs. en host

Para el MVP todos los servicios corren en Docker. Si se necesita desarrollo activo en un módulo específico:

- El módulo en desarrollo puede correr directamente en el host (`uvicorn app.main:app --reload`)
- El resto de servicios siguen en Docker
- La red host puede acceder a los contenedores por `localhost:<puerto>`

---

## 11. Criterios de aceptación

- [ ] `docker compose up --build` levanta todos los servicios sin errores manuales
- [ ] MySQL está disponible y el backend conecta correctamente
- [ ] El frontend en `http://localhost:3000` carga el dashboard
- [ ] El backend en `http://localhost:8000/health` responde `{"status": "ok"}`
- [ ] n8n en `http://localhost:5678` muestra la interfaz de login
- [ ] El archivo `.env` no existe en el repositorio; solo `.env.example`
- [ ] Los modelos YOLO no se versionan (solo `models/.gitkeep`)
- [ ] `docker compose down -v` limpia todo sin rastros

---

## 12. Referencia cruzada

- Módulo de visión: [spec-01](spec-01-vision-artificial.md)
- Backend: [spec-02](spec-02-backend-api.md)
- Agente IA: [spec-03](spec-03-agente-ia.md)
- n8n: [spec-04](spec-04-automatizacion-n8n.md)
- Frontend: [spec-05](spec-05-dashboard-frontend.md)
