# SPEC-03 — Agente de IA

**Proyecto:** VIGÍA — Visión Inteligente para la Gestión y Vigilancia Animal  
**Versión:** 1.0  
**Estado:** Borrador  
**Fecha:** 2026-08-16  
**Depende de:** [spec-00](spec-00-arquitectura-general.md), [spec-02](spec-02-backend-api.md)

---

## 1. Propósito

El Agente de IA es un microservicio que recibe información estructurada sobre alertas ganaderas y utiliza un LLM para generar análisis en lenguaje natural. Su objetivo es ayudar al productor a entender qué ocurrió y qué podría justificar una inspección.

**El agente NUNCA diagnostica enfermedades veterinarias.**  
Habla de patrones, comportamientos anómalos, cambios de actividad y eventos potencialmente relevantes. Toda respuesta incluye un disclaimer explícito.

---

## 2. Tecnologías

| Componente | Tecnología |
|------------|------------|
| Framework web | FastAPI |
| LLM API | Groq Cloud |
| Modelo LLM | `llama-3.1-8b-instant` |
| Cliente Groq | `groq` Python SDK |
| Servidor | Uvicorn |

**Justificación del modelo:**  
`llama-3.1-8b-instant` es suficiente para el problema. No se requiere un modelo de 70B para interpretar eventos estructurados y generar texto descriptivo en español. El tier gratuito de Groq (30 RPM, 250K TPM) es adecuado para un simulacro de hackathon.

---

## 3. Responsabilidades

- Recibir una solicitud de análisis del backend con datos de la alerta y contexto
- Construir un prompt estructurado con el contexto ganadero
- Llamar a la API de Groq
- Parsear y validar la respuesta del LLM
- Devolver un `AnalisisIA` JSON al backend
- Exponer `/health` para verificación de estado

---

## 4. Contrato de entrada

El backend llama al agente con:

```
POST /analizar
Content-Type: application/json
```

```json
{
  "alerta_id": 55,
  "tipo_alerta": "posible_aislamiento",
  "descripcion_alerta": "Animal detectado solo durante múltiples frames consecutivos",
  "nivel": "media",
  "eventos_relacionados": [
    {
      "timestamp": "2026-08-16T10:28:00Z",
      "animales_detectados": 1,
      "clase_principal": "cow",
      "confianza": 0.87
    },
    {
      "timestamp": "2026-08-16T10:29:00Z",
      "animales_detectados": 1,
      "clase_principal": "cow",
      "confianza": 0.85
    }
  ],
  "contexto_hato": {
    "total_animales_registrados": 12,
    "especie_predominante": "bovino"
  }
}
```

---

## 5. Contrato de salida

El agente devuelve exactamente este JSON:

```json
{
  "alerta_id": 55,
  "resumen": "Se observa un animal separado del grupo durante al menos 2 minutos consecutivos. El conteo registrado (1 animal) está por debajo del total del hato (12).",
  "nivel_urgencia": "media",
  "justificacion": "El patrón de separación sostenida puede estar asociado a malestar, inicio de parto, o simplemente exploración del área. La confianza de detección es alta (0.87), lo que reduce la posibilidad de un falso positivo.",
  "recomendacion": "Se sugiere verificar visualmente el estado del animal en las próximas 1-2 horas.",
  "disclaimer": "Este análisis es un apoyo a la toma de decisiones del productor. No constituye un diagnóstico veterinario. Ante cualquier duda, consulte a un médico veterinario.",
  "modelo_usado": "llama-3.1-8b-instant",
  "tokens_usados": 312,
  "timestamp": "2026-08-16T10:30:08Z"
}
```

---

## 6. Diseño del prompt

### 6.1 System prompt (instrucción del sistema)

```
Eres un asistente especializado en monitoreo ganadero. Tu función es analizar eventos 
detectados por un sistema de visión artificial y ayudar al productor a tomar decisiones 
informadas.

REGLAS ESTRICTAS:
1. NUNCA diagnostiques enfermedades veterinarias. No tienes la autorización ni los datos 
   para hacerlo.
2. Habla siempre de PATRONES, COMPORTAMIENTOS ANÓMALOS y CAMBIOS DE ACTIVIDAD.
3. Usa lenguaje claro, directo y útil para un productor ganadero.
4. Tus respuestas deben ser concisas: máximo 3-4 oraciones por sección.
5. Siempre termina con una recomendación práctica.
6. SIEMPRE incluye el disclaimer al final.

IMPORTANTE: El disclaimer es obligatorio y debe ser literal:
"Este análisis es un apoyo a la toma de decisiones del productor. No constituye un 
diagnóstico veterinario. Ante cualquier duda, consulte a un médico veterinario."
```

### 6.2 User prompt (construido dinámicamente)

```
Analiza la siguiente situación detectada en el campo:

TIPO DE ALERTA: {tipo_alerta}
DESCRIPCIÓN: {descripcion_alerta}
NIVEL: {nivel}

EVENTOS RECIENTES:
{eventos_relacionados_formateados}

CONTEXTO DEL HATO:
- Animales registrados: {total_animales_registrados}
- Especie predominante: {especie_predominante}

Proporciona tu análisis en formato JSON con estos campos exactos:
- resumen: descripción objetiva de lo observado (máx. 2 oraciones)
- nivel_urgencia: "baja", "media" o "alta"
- justificacion: razón del nivel de urgencia (máx. 2 oraciones)
- recomendacion: acción sugerida al productor (máx. 1 oración)
- disclaimer: texto obligatorio de no-diagnóstico

Responde ÚNICAMENTE con el JSON, sin texto adicional.
```

### 6.3 Estrategia de parsing

El LLM instruido a responder con JSON puro. El agente:
1. Extrae el bloque JSON de la respuesta
2. Valida con Pydantic que los campos requeridos estén presentes
3. Si la validación falla, reintenta la llamada máximo 1 vez
4. Si falla de nuevo, retorna un análisis de fallback genérico

---

## 7. Estructura del módulo

```
ai-agent/
├── src/
│   ├── main.py              ← App FastAPI, endpoint /analizar y /health
│   ├── agent.py             ← Clase VigilAgent: orquesta llamada a Groq
│   ├── prompt_builder.py    ← Construye el prompt dinámicamente
│   ├── response_parser.py   ← Parsea y valida respuesta JSON del LLM
│   ├── schemas.py           ← Pydantic: SolicitudAnalisis, AnalisisIA
│   └── config.py            ← Variables de entorno
├── prompts/
│   └── system_prompt.txt    ← System prompt separado para fácil edición
├── requirements.txt
└── Dockerfile
```

---

## 8. Manejo de errores

| Situación | Comportamiento |
|-----------|---------------|
| Groq API no disponible | Retornar fallback con mensaje de no disponibilidad |
| Rate limit alcanzado (HTTP 429) | Esperar 2 segundos y reintentar 1 vez |
| Respuesta LLM sin JSON válido | Reintentar 1 vez; si falla, usar análisis de fallback |
| Timeout (>10 segundos) | Retornar fallback inmediatamente |
| API Key inválida | Error 500 con log, el backend guarda la alerta sin análisis |

### Análisis de fallback

```json
{
  "resumen": "No fue posible completar el análisis automático en este momento.",
  "nivel_urgencia": "media",
  "justificacion": "El servicio de análisis IA no pudo procesar la solicitud.",
  "recomendacion": "Revisar manualmente la alerta generada.",
  "disclaimer": "Este análisis es un apoyo a la toma de decisiones del productor. No constituye un diagnóstico veterinario. Ante cualquier duda, consulte a un médico veterinario.",
  "modelo_usado": "fallback",
  "tokens_usados": 0
}
```

---

## 9. Variables de entorno

```env
AI_AGENT_PORT=8001
GROQ_API_KEY=<tu_api_key_de_groq>
GROQ_MODEL=llama-3.1-8b-instant
GROQ_MAX_TOKENS=512
GROQ_TEMPERATURE=0.3
AI_REQUEST_TIMEOUT=10
```

**Nota:** `GROQ_TEMPERATURE=0.3` mantiene las respuestas consistentes y evita que el modelo invente datos. No se usa temperatura alta para este problema.

---

## 10. Dependencias Python

```
fastapi>=0.104.0
uvicorn>=0.24.0
groq>=0.4.0
pydantic>=2.4.0
pydantic-settings>=2.0.0
python-dotenv>=1.0.0
```

---

## 11. Criterios de aceptación

- [ ] `POST /analizar` recibe una `SolicitudAnalisis` válida y retorna un `AnalisisIA`
- [ ] La respuesta siempre incluye el campo `disclaimer` con el texto correcto
- [ ] El agente nunca usa términos diagnósticos (enfermedad, síntoma, patología)
- [ ] Si Groq no responde, retorna el análisis de fallback sin crashear
- [ ] La temperatura está fijada en 0.3 (respuestas consistentes)
- [ ] El endpoint `/health` incluye verificación de que la API Key está configurada
- [ ] Las respuestas están en español

---

## 12. Referencia cruzada

- Contrato `AnalisisIA`: [spec-00 §5.5](spec-00-arquitectura-general.md)
- Backend que invoca este agente: [spec-02 §5.3](spec-02-backend-api.md)
