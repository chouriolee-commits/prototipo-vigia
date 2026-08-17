export type DetectionEvent = {
  id: number
  /** Milisegundos desde época — se formatea en el cliente. */
  time: number
  cows: number
  isAlert: boolean
  reason?: string
}

const ALERT_REASONS = [
  'Movimiento fuera del perímetro',
  'Animal aislado del grupo',
  'Aglomeración inusual detectada',
  'Sin movimiento por más de 10 min',
]

let counter = 0

function nextId() {
  counter += 1
  return counter
}

/** Un evento pseudo-aleatorio; ~1 de cada 4 es una alerta. */
export function createEvent(time = Date.now()): DetectionEvent {
  const cows = 3 + Math.floor(Math.random() * 26)
  const isAlert = Math.random() < 0.25
  return {
    id: nextId(),
    time,
    cows,
    isAlert,
    reason: isAlert
      ? ALERT_REASONS[Math.floor(Math.random() * ALERT_REASONS.length)]
      : undefined,
  }
}

/** Historial inicial: 10 eventos separados por ~12 s hacia atrás. */
export function seedEvents(now = Date.now()): DetectionEvent[] {
  return Array.from({ length: 10 }, (_, i) =>
    createEvent(now - (9 - i) * 12_000),
  ).reverse()
}

export function formatTimestamp(time: number) {
  return new Date(time).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function formatTimecode(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
