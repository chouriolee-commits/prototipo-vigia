# SPEC-05 — Dashboard Web (Frontend)

**Proyecto:** VIGÍA — Visión Inteligente para la Gestión y Vigilancia Animal  
**Versión:** 1.1  
**Estado:** Borrador  
**Fecha:** 2026-08-16  
**Depende de:** [spec-00](spec-00-arquitectura-general.md), [spec-02](spec-02-backend-api.md)

---

## 1. Propósito

El dashboard es la interfaz que el productor ganadero usa para monitorear el estado de su hato. Consume únicamente la API REST del backend. No contiene lógica de negocio: toda regla, cálculo y validación ocurre en el backend.

---

## 2. Tecnologías

| Componente | Tecnología |
|------------|------------|
| Framework UI | React 18 |
| Build tool | Vite |
| Lenguaje | JavaScript (JSX) |
| HTTP cliente | Axios |
| Estilos | CSS modules o Tailwind CSS |
| Routing | React Router v6 |

No se utiliza Redux ni estado global complejo. El estado se maneja localmente por componente con `useState` y `useEffect`. Para el MVP no se justifica una solución de estado más elaborada.

---

## 3. Vistas del MVP

### Vista 1 — Dashboard Principal (`/`)

Panel de resumen general. Se actualiza con polling cada 30 segundos.

**Componentes:**
- `ResumenCard`: 3 tarjetas — Animales activos / Eventos hoy / Alertas pendientes
- `AlertasRecientes`: Lista de las últimas 5 alertas con nivel y descripción breve
- `ActividadChart`: Gráfico de barras simple con eventos por hora (últimas 24h)

**API consumida:**
```
GET /api/v1/dashboard/resumen
GET /api/v1/dashboard/actividad
GET /api/v1/dashboard/alertas-recientes
```

---

### Vista 2 — Alertas (`/alertas`)

Lista completa de alertas con filtros por estado y nivel.

**Componentes:**
- `FiltrosAlerta`: Selector de estado (pendiente / revisada / descartada) y nivel (baja/media/alta)
- `TablaAlertas`: Tabla paginada con columnas: Fecha, Tipo, Nivel, Estado, Acciones
- `BotonVerDetalle`: Navega a `/alertas/:id`

**API consumida:**
```
GET /api/v1/alertas?estado=pendiente&nivel=alta
```

---

### Vista 3 — Detalle de Alerta (`/alertas/:id`)

Vista completa de una alerta específica, incluyendo el análisis del agente IA.

**Componentes:**
- `CabeceraAlerta`: Tipo, nivel, timestamp, estado actual
- `AnalisisIACard`: Muestra el análisis del agente IA con:
  - Resumen
  - Nivel de urgencia
  - Justificación
  - Recomendación
  - **Disclaimer siempre visible** (en estilo diferenciado, no se puede ocultar)
- `BotonesAccion`: Marcar como "Revisada" o "Descartada"
- `EventosRelacionados`: Lista de eventos que originaron la alerta

**API consumida:**
```
GET /api/v1/alertas/:id
PUT /api/v1/alertas/:id/estado
```

---

### Vista 4 — Animales (`/animales`)

Lista de animales registrados en el sistema.

**Componentes:**
- `TablaAnimales`: ID, Especie, Sexo, Fecha de registro, Estado (activo/inactivo)
- `FormularioAnimal`: Formulario simple para agregar un animal nuevo
- `BotonesAccion`: Editar / Desactivar

**API consumida:**
```
GET  /api/v1/animales
POST /api/v1/animales
PUT  /api/v1/animales/:id
```

---

### Vista 5 — Eventos (`/eventos`)

Historial de todos los eventos de detección.

**Componentes:**
- `TablaEventos`: Timestamp, Fuente, Animales detectados, Nivel de relevancia
- `FiltroFecha`: Rango de fechas para filtrar eventos

**API consumida:**
```
GET /api/v1/eventos?desde=ISO&hasta=ISO&limit=50&offset=0
```

---

### Vista 6 — Monitor de Fuente (`/monitor`)

Vista dedicada a mostrar el archivo multimedia que el módulo de visión está procesando. Útil para demos y presentaciones: el jurado puede ver el video o imágenes originales mientras observa cómo el sistema genera eventos y alertas en tiempo real.

**Comportamiento según tipo de fuente:**

El componente consulta al backend qué tipo de fuente está activa (`video`, `image`, `directory`) y renderiza el visor correspondiente.

```
GET /api/v1/vision/fuente-activa
→ { "tipo": "video", "nombre": "video_demo.mp4", "url_media": "/media/video_demo.mp4" }
→ { "tipo": "image", "nombre": "foto_01.jpg",    "url_media": "/media/foto_01.jpg" }
→ { "tipo": "directory", "imagenes": [
     { "nombre": "foto_01.jpg", "url_media": "/media/fotos/foto_01.jpg" },
     { "nombre": "foto_02.jpg", "url_media": "/media/fotos/foto_02.jpg" }
   ]}
```

**Componente `MediaViewer` — lógica de renderizado:**

```jsx
function MediaViewer({ fuente }) {
  if (fuente.tipo === 'video') {
    return (
      <video controls autoPlay muted loop src={fuente.url_media}>
        Tu navegador no soporta reproducción de video.
      </video>
    );
  }

  if (fuente.tipo === 'image') {
    return <img src={fuente.url_media} alt={fuente.nombre} />;
  }

  if (fuente.tipo === 'directory') {
    return (
      <div className="image-gallery">
        {fuente.imagenes.map((img) => (
          <img key={img.nombre} src={img.url_media} alt={img.nombre} />
        ))}
      </div>
    );
  }
}
```

**Componentes de la vista:**
- `MediaViewer`: renderiza video o imagen según el tipo detectado (lógica arriba)
- `InfoFuente`: nombre del archivo, tipo, estado del procesamiento (activo/inactivo)
- `EventosEnVivo`: panel lateral con los últimos 10 eventos recibidos, actualizándose con polling cada 5 segundos mientras esta vista está activa

**Diseño de la vista para demo:**

```
┌─────────────────────────────────────────────────────┐
│  MONITOR DE FUENTE                                  │
├──────────────────────────┬──────────────────────────┤
│                          │  Fuente: video_demo.mp4  │
│   [Video o imagen        │  Tipo: video             │
│    del campo aquí]       │  Estado: procesando...   │
│                          ├──────────────────────────┤
│                          │  EVENTOS EN VIVO         │
│                          │  ─────────────────────── │
│                          │  10:30:05 — 4 vacas      │
│                          │  10:30:06 — 3 vacas      │
│                          │  10:30:08 — ⚠ ALERTA     │
│                          │  10:30:09 — 4 vacas      │
└──────────────────────────┴──────────────────────────┘
```

**API consumida:**
```
GET /api/v1/vision/fuente-activa
GET /api/v1/eventos?limit=10&offset=0   (polling cada 5s)
```

---

## 4. Estructura del módulo

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx          ← Barra de navegación principal
│   │   │   └── Layout.jsx          ← Wrapper de página con navbar
│   │   ├── dashboard/
│   │   │   ├── ResumenCard.jsx
│   │   │   ├── AlertasRecientes.jsx
│   │   │   └── ActividadChart.jsx
│   │   ├── alertas/
│   │   │   ├── TablaAlertas.jsx
│   │   │   ├── FiltrosAlerta.jsx
│   │   │   ├── AnalisisIACard.jsx  ← Muestra análisis IA con disclaimer
│   │   │   └── BotonesAccion.jsx
│   │   ├── animales/
│   │   │   ├── TablaAnimales.jsx
│   │   │   └── FormularioAnimal.jsx
│   │   ├── eventos/
│   │   │   └── TablaEventos.jsx
│   │   ├── monitor/
│   │   │   ├── MediaViewer.jsx     ← Renderiza video o imagen según tipo
│   │   │   ├── InfoFuente.jsx      ← Nombre, tipo y estado del procesamiento
│   │   │   └── EventosEnVivo.jsx   ← Últimos 10 eventos con polling 5s
│   │   └── ui/
│   │       ├── LoadingSpinner.jsx
│   │       ├── ErrorMessage.jsx
│   │       └── Badge.jsx           ← Indicador de nivel (baja/media/alta)
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── AlertasPage.jsx
│   │   ├── AlertaDetallePage.jsx
│   │   ├── AnimalesPage.jsx
│   │   ├── EventosPage.jsx
│   │   └── MonitorPage.jsx         ← Vista 6: visor de medios + eventos en vivo
│   ├── services/
│   │   ├── api.js                  ← Instancia Axios con baseURL y headers
│   │   ├── dashboardService.js
│   │   ├── alertasService.js
│   │   ├── animalesService.js
│   │   ├── eventosService.js
│   │   └── monitorService.js       ← Consulta fuente activa y eventos en vivo
│   ├── hooks/
│   │   └── usePolling.js           ← Hook reutilizable para polling con intervalo
│   ├── App.jsx                     ← Router principal
│   └── main.jsx                    ← Punto de entrada React
├── public/
│   └── vigia-logo.svg
├── index.html
├── vite.config.js
├── package.json
└── Dockerfile
```

---

## 5. Configuración Axios

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export default api;
```

---

## 6. Estrategia de actualización de datos

| Vista | Estrategia | Intervalo |
|-------|-----------|-----------|
| Dashboard Principal | Polling activo | 30 segundos |
| Lista de Alertas | Polling activo | 60 segundos |
| Detalle de Alerta | Carga única + botón refresh manual | — |
| Animales | Carga única | — |
| Eventos | Carga única + paginación manual | — |
| Monitor de Fuente | Polling activo (eventos en vivo) | 5 segundos |

No se implementa WebSocket en el MVP. El polling es suficiente para un hackathon.

---

## 7. Manejo de errores en UI

- Toda llamada a API envuelta en try/catch
- Si el backend no responde: mostrar componente `ErrorMessage` con mensaje amigable
- Si hay loading: mostrar `LoadingSpinner`
- No mostrar stack traces al usuario nunca

---

## 8. Disclaimer del agente IA

El componente `AnalisisIACard` siempre muestra el disclaimer en un bloque diferenciado visualmente:

```jsx
<div className="disclaimer-box">
  <span className="disclaimer-icon">⚠️</span>
  <p>{analisis.disclaimer}</p>
</div>
```

El estilo CSS del `disclaimer-box` debe ser claramente diferente del resto del contenido (borde, color de fondo). No se puede condicionar ni ocultar este bloque.

---

## 9. Variables de entorno

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_KEY=<misma_api_key_del_backend>
VITE_APP_TITLE=VIGÍA — Monitoreo Ganadero
VITE_POLLING_INTERVAL_MS=30000
```

---

## 10. Dependencias

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "recharts": "^2.9.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

`recharts` para el gráfico de actividad. Es la librería de charts más simple y sin dependencias pesadas.

---

## 11. Criterios de aceptación

- [ ] La Vista 1 (Dashboard) muestra datos reales del backend al cargar
- [ ] El polling actualiza los datos cada 30 segundos sin recargar la página
- [ ] La Vista 2 (Alertas) permite filtrar por estado y nivel
- [ ] La Vista 3 (Detalle) muestra el análisis del agente IA con el disclaimer siempre visible
- [ ] El disclaimer nunca puede ser ocultado o removido de la UI
- [ ] La Vista 4 permite agregar un animal nuevo
- [ ] La Vista 6 (Monitor) muestra el video reproduciéndose cuando la fuente es un archivo de video
- [ ] La Vista 6 muestra la imagen cuando la fuente es una imagen estática
- [ ] La Vista 6 muestra una galería cuando la fuente es un directorio de imágenes
- [ ] El panel de eventos en vivo de la Vista 6 se actualiza cada 5 segundos automáticamente
- [ ] Si el backend no responde, la UI muestra un mensaje de error, no pantalla en blanco
- [ ] No hay lógica de negocio en el frontend (cálculos, reglas, umbrales)
- [ ] La API Key está en variables de entorno, no en el código

---

## 12. Referencia cruzada

- API consumida: [spec-02 §4](spec-02-backend-api.md)
- Contrato `AnalisisIA` mostrado: [spec-00 §5.5](spec-00-arquitectura-general.md)
- Infraestructura Docker: [spec-06](spec-06-infraestructura.md)
