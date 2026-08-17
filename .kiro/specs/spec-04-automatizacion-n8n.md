# SPEC-04 — Automatización con n8n

**Proyecto:** VIGÍA — Visión Inteligente para la Gestión y Vigilancia Animal  
**Versión:** 1.1  
**Estado:** Borrador  
**Fecha:** 2026-08-16  
**Depende de:** [spec-00](spec-00-arquitectura-general.md), [spec-02](spec-02-backend-api.md)

---

## 1. Propósito

n8n es el motor de automatización de VIGÍA. Recibe notificaciones del backend cuando se genera una alerta y ejecuta flujos de trabajo automáticos: log interno, notificación por Telegram y notificación por email.

El uso de n8n mantiene la lógica de automatización completamente separada del backend. Si un canal cambia, no se toca el código Python.

**Decisión:** Se usa Telegram y Email como canales de notificación. WhatsApp queda fuera del MVP porque su API oficial requiere aprobación de Meta y no es gratuita para uso en desarrollo. Telegram tiene API completamente libre y n8n tiene nodo nativo. Si el jurado pregunta, se menciona que la arquitectura soporta WhatsApp vía Twilio como extensión futura.

---

## 2. Responsabilidades

- Recibir webhooks del backend cuando se genera una alerta
- Registrar la alerta en un log interno (siempre, sin dependencias externas)
- Enviar notificación por Telegram (para todos los niveles de alerta)
- Enviar notificación por email (solo para alertas de nivel `alta`)
- Retroalimentar al backend con confirmación de envío

n8n **no** tiene acceso directo a MySQL. Toda la información llega en el payload del webhook.

---

## 3. Integración con el backend

### 3.1 Flujo de activación

```
Backend detecta alerta
    │
    ▼
Backend llama al agente IA (si disponible)
    │
    ▼
Backend hace POST al webhook de n8n:
POST http://n8n:5678/webhook/vigia-alerta
```

### 3.2 Payload del webhook (enviado por el backend)

```json
{
  "alerta_id": 55,
  "tipo_alerta": "posible_aislamiento",
  "nivel": "media",
  "descripcion": "Animal detectado solo durante múltiples frames consecutivos",
  "timestamp": "2026-08-16T10:30:05Z",
  "analisis_ia": {
    "resumen": "Se observa un animal separado del grupo...",
    "nivel_urgencia": "media",
    "recomendacion": "Verificar estado del animal en 1-2 horas.",
    "disclaimer": "Este análisis es un apoyo a la toma de decisiones..."
  },
  "contexto": {
    "fuente": "video_demo.mp4",
    "animales_detectados": 1
  }
}
```

### 3.3 Retroalimentación al backend

Cuando n8n completa el flujo, notifica al backend con el resultado consolidado:

```
POST http://backend:8000/api/v1/webhooks/n8n
Body: {
  "tipo": "confirmacion_notificacion",
  "alerta_id": 55,
  "canales_notificados": ["telegram", "email"],
  "resultado": "enviado"
}
```

---

## 4. Flujos n8n del MVP

Los tres flujos comparten el mismo webhook de entrada. Internamente se encadenan en un único workflow para simplificar la configuración.

---

### Flujo 1: Registro y Log de Alerta (siempre se ejecuta)

**Trigger:** Webhook `POST /webhook/vigia-alerta`

**Acciones:**
1. Recibir payload
2. Formatear entrada de log:
   ```
   [2026-08-16T10:30:05Z] ALERTA#55 | nivel=media | tipo=posible_aislamiento
   Descripción: Animal detectado solo durante múltiples frames consecutivos
   IA: Verificar estado del animal en 1-2 horas.
   ```
3. Guardar en log interno del contenedor n8n
4. Continuar al Flujo 2 (Telegram)

**Propósito:** Garantizar trazabilidad sin depender de servicios externos. El sistema funciona aunque Telegram o el email fallen.

---

### Flujo 2: Notificación por Telegram (todos los niveles)

**Se ejecuta:** siempre, para alertas de cualquier nivel (`baja`, `media`, `alta`)

**Acciones:**
1. Construir mensaje Markdown:
   ```
   🐄 *VIGÍA — Alerta Ganadera*

   📋 *Tipo:* Posible aislamiento
   🔴 *Nivel:* Media
   📅 *Fecha:* 16/08/2026 10:30:05

   📝 *Descripción:*
   Animal detectado solo durante múltiples frames consecutivos

   🤖 *Análisis IA:*
   Se observa un animal separado del grupo...

   ✅ *Recomendación:*
   Verificar estado del animal en 1-2 horas.

   ⚠️ _Este análisis es un apoyo a la toma de decisiones. No constituye un diagnóstico veterinario._
   ```
2. Enviar al chat configurado vía Telegram Bot API
3. Si falla: loguear error, continuar al Flujo 3 sin interrumpir

**Credenciales requeridas:**
- Bot Token: obtenido desde `@BotFather` en Telegram (gratuito, tarda 2 minutos)
- Chat ID: el ID del chat o canal donde llegan las alertas

**Cómo crear el bot:**
```
1. Abrir Telegram → buscar @BotFather
2. Enviar /newbot → seguir instrucciones
3. Guardar el token recibido → va en N8N_TELEGRAM_BOT_TOKEN
4. Enviar un mensaje al bot → consultar chat_id en:
   https://api.telegram.org/bot<TOKEN>/getUpdates
5. Guardar el chat_id → va en N8N_TELEGRAM_CHAT_ID
```

---

### Flujo 3: Notificación por Email (solo nivel `alta`)

**Se ejecuta:** únicamente cuando `nivel == "alta"`

**Justificación del filtro:** el email tiene más fricción de lectura que Telegram. Se reserva para las alertas más urgentes para no generar ruido.

**Acciones:**
1. Verificar condición: `nivel == "alta"` → si no cumple, saltar
2. Componer email HTML:
   ```
   Asunto: ⚠️ VIGÍA — Alerta Alta: Posible aislamiento de animal

   Cuerpo (HTML):
   - Cabecera con logo VIGÍA
   - Datos de la alerta: tipo, nivel, fecha, descripción
   - Análisis del agente IA: resumen, recomendación
   - Disclaimer en bloque diferenciado
   - Pie: "Sistema VIGÍA — Monitoreo Ganadero"
   ```
3. Enviar vía SMTP configurado
4. Retroalimentar al backend con confirmación

**Configuración SMTP recomendada (Gmail):**

Para usar Gmail como SMTP se debe activar "Contraseñas de aplicación" en la cuenta de Google (no se usa la contraseña normal de la cuenta). Esto está disponible en cuentas con verificación en dos pasos activada.

```
Host: smtp.gmail.com
Puerto: 587
Seguridad: STARTTLS
Usuario: tu_correo@gmail.com
Contraseña: contraseña_de_aplicación_de_16_caracteres
```

**Variables requeridas:**
```env
N8N_EMAIL_HOST=smtp.gmail.com
N8N_EMAIL_PORT=587
N8N_EMAIL_USER=tu_correo@gmail.com
N8N_EMAIL_PASS=xxxx_xxxx_xxxx_xxxx
N8N_EMAIL_TO=productor@email.com
N8N_EMAIL_FROM=VIGÍA Alertas <tu_correo@gmail.com>
```

---

## 5. Diagrama del workflow unificado

```
Webhook POST /webhook/vigia-alerta
        │
        ▼
  [Flujo 1] Registrar en log
        │
        ▼
  [Flujo 2] Enviar Telegram
        │  (todos los niveles)
        │
        ▼
  [Flujo 3] ¿nivel == "alta"?
        │         │
       SÍ        NO
        │         │
        ▼         └──→ (saltar)
  Enviar Email
        │
        ▼
  POST confirmación → Backend
```

---

## 6. Configuración de n8n en Docker Compose

```yaml
n8n:
  image: n8nio/n8n:latest
  ports:
    - "${N8N_PORT:-5678}:5678"
  environment:
    - N8N_BASIC_AUTH_ACTIVE=true
    - N8N_BASIC_AUTH_USER=${N8N_USER}
    - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
    - WEBHOOK_URL=http://localhost:${N8N_PORT:-5678}
    - N8N_HOST=0.0.0.0
    - N8N_PORT=5678
    - DB_TYPE=sqlite
    - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
  volumes:
    - n8n_data:/home/node/.n8n
    - ./n8n/workflows:/workflows
  networks:
    - vigia_net
```

**Nota:** n8n usa su propia SQLite interna para almacenar flujos y credenciales cifradas. No comparte la MySQL del backend. Las credenciales de Telegram y email se configuran dentro de la interfaz de n8n, no en el `.env` directamente — el `.env` solo tiene los valores para que los puedas copiar fácilmente al configurar n8n.

---

## 7. Estructura del módulo

```
n8n/
├── workflows/
│   └── vigia-workflow-principal.json   ← Workflow unificado exportado desde n8n
│                                          (contiene los 3 flujos encadenados)
└── README.md                           ← Instrucciones paso a paso para:
                                           1. Crear el bot de Telegram
                                           2. Configurar Gmail SMTP
                                           3. Importar el workflow en n8n
                                           4. Configurar credenciales en n8n UI
```

---

## 8. Variables de entorno

```env
# n8n — servicio
N8N_PORT=5678
N8N_USER=admin
N8N_PASSWORD=<secreto>
N8N_ENCRYPTION_KEY=<clave_aleatoria_larga>

# URLs de comunicación entre servicios
N8N_WEBHOOK_URL=http://n8n:5678/webhook/vigia-alerta
BACKEND_CALLBACK_URL=http://backend:8000/api/v1/webhooks/n8n

# Telegram (se usan al configurar credenciales en la UI de n8n)
N8N_TELEGRAM_BOT_TOKEN=<token_del_bot>
N8N_TELEGRAM_CHAT_ID=<chat_id>

# Email SMTP (se usan al configurar credenciales en la UI de n8n)
N8N_EMAIL_HOST=smtp.gmail.com
N8N_EMAIL_PORT=587
N8N_EMAIL_USER=<correo>
N8N_EMAIL_PASS=<contraseña_de_aplicacion>
N8N_EMAIL_TO=<destinatario>
N8N_EMAIL_FROM=VIGÍA Alertas <correo>
```

---

## 9. Acceso a la interfaz n8n

```
http://localhost:5678
Usuario: valor de N8N_USER (default: admin)
Contraseña: valor de N8N_PASSWORD
```

Desde esta interfaz se importa el workflow, se configuran las credenciales de Telegram y Gmail, y se activa el webhook.

---

## 10. Criterios de aceptación

- [ ] n8n levanta correctamente con `docker compose up`
- [ ] El webhook `POST /webhook/vigia-alerta` recibe el payload del backend y responde HTTP 200
- [ ] El Flujo 1 registra la alerta en el log interno siempre
- [ ] El Flujo 2 envía el mensaje a Telegram con formato correcto incluyendo el disclaimer
- [ ] El Flujo 3 envía email únicamente cuando el nivel es `alta`
- [ ] Una alerta de nivel `alta` genera tanto mensaje Telegram como email
- [ ] Una alerta de nivel `media` o `baja` genera solo mensaje Telegram (no email)
- [ ] El backend recibe la confirmación de n8n y actualiza `notificado_n8n = true`
- [ ] Si Telegram o email fallan, el Flujo 1 (log) ya registró la alerta — no hay pérdida de datos
- [ ] El workflow exportado en `n8n/workflows/` es importable sin error

---

## 11. Referencia cruzada

- Backend que dispara el webhook: [spec-02 §5.2](spec-02-backend-api.md)
- Payload de la alerta: [spec-00 §5.4](spec-00-arquitectura-general.md)
- Infraestructura Docker: [spec-06](spec-06-infraestructura.md)
