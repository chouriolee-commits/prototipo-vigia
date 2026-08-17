export type Usuario = {
  email: string
  rol: string
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export function videoUrl(nombre: string): string {
  return `${API_URL}/media/${encodeURIComponent(nombre)}`
}

export type Alerta = {
  id: number
  evento_id: number
  tipo_alerta: string
  descripcion: string
  nivel: 'baja' | 'media' | 'alta'
  estado: 'pendiente' | 'revisada' | 'descartada'
  analisis_ia: Record<string, unknown> | null
  timestamp: string
  created_at: string
}

export type Animal = {
  id: number
  identificador: string
  especie: string
  sexo: string
  fecha_registro: string
  activo: boolean
  created_at: string
  updated_at: string
}

export type DashboardResumen = {
  animales_activos: number
  eventos_hoy: number
  alertas_pendientes: number
}

export type ActividadHora = {
  hora: number
  eventos: number
}

export type DashboardActividad = {
  horas: ActividadHora[]
}

export type AlertaReciente = {
  id: number
  tipo_alerta: string
  nivel: string
  estado: string
  timestamp: string
  descripcion: string
}

export type AnalisisIA = {
  alerta_id: number
  resumen: string
  nivel_urgencia: string
  justificacion: string
  recomendacion: string
  disclaimer: string
  modelo_usado: string
  timestamp: string
}

export type FuenteActiva = {
  tipo: 'video' | 'image' | 'directory'
  nombre?: string
  url_media?: string
}

type ApiError = {
  detail?: string
}

function errorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as ApiError).detail
    if (typeof detail === 'string' && detail) return detail
  }
  return fallback
}

export async function login(
  email: string,
  password: string,
): Promise<{ email: string }> {
  const resp = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const payload = await resp.json().catch(() => null)
  if (!resp.ok) {
    throw new Error(errorMessage(payload, 'Credenciales incorrectas'))
  }
  return payload
}

export async function fetchMe(): Promise<Usuario | null> {
  const resp = await fetch('/api/auth/me', { cache: 'no-store' })
  if (resp.status === 401) return null
  if (!resp.ok) return null
  return resp.json()
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`/api/v1/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
  const payload = await resp.json().catch(() => null)
  if (!resp.ok) {
    throw new Error(errorMessage(payload, `Error al consultar ${path}`))
  }
  return payload as T
}

export function getResumen() {
  return apiFetch<DashboardResumen>('dashboard/resumen')
}

export function getActividad() {
  return apiFetch<DashboardActividad>('dashboard/actividad')
}

export function getAlertasRecientes() {
  return apiFetch<AlertaReciente[]>('dashboard/alertas-recientes')
}

export function getAlertas(params?: { estado?: string; limit?: number }) {
  const q = new URLSearchParams()
  if (params?.estado) q.set('estado', params.estado)
  q.set('limit', String(params?.limit ?? 50))
  return apiFetch<Alerta[]>(`alertas?${q.toString()}`)
}

export function getAnimales() {
  return apiFetch<Animal[]>('animales')
}

export type Evento = {
  id: number
  animal_id: number | null
  tipo: string
  descripcion: string | null
  timestamp_evento: string
  nivel_relevancia: 'normal' | 'media' | 'alta'
  fuente: string | null
  datos_raw: Record<string, unknown> | null
  created_at: string
}

export function getEventos(limit = 50) {
  return apiFetch<Evento[]>(`eventos?limit=${limit}`)
}

export function getFuenteActiva() {
  return apiFetch<FuenteActiva>('vision/fuente-activa')
}

export function analizarAlerta(alertaId: number) {
  return apiFetch<AnalisisIA>('ia/analizar', {
    method: 'POST',
    body: JSON.stringify({ alerta_id: alertaId }),
  })
}

export type MensajeChat = {
  rol: 'user' | 'assistant'
  contenido: string
}

export type RespuestaChat = {
  respuesta: string
  modelo_usado: string
  tokens_usados: number
  timestamp: string
}

export function charlarIa(mensajes: MensajeChat[]) {
  return apiFetch<RespuestaChat>('ia/chat', {
    method: 'POST',
    body: JSON.stringify({ mensajes }),
  })
}