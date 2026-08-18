'use client'

import { Activity } from 'lucide-react'
import type { Evento } from '@/lib/api'

function conteoDe(evento: Evento): number | null {
  const raw = evento.datos_raw
  if (raw && typeof raw === 'object' && 'conteo_total' in raw) {
    const valor = raw.conteo_total
    if (typeof valor === 'number') return valor
  }
  return null
}

type Props = {
  events: Evento[]
  live: boolean
}

/** Panel inferior: registro desplazable de los últimos eventos reales. */
export function LiveEventsPanel({ events, live }: Props) {
  const alerts = events.filter((e) => e.nivel_relevancia === 'alta').length

  return (
    <section
      aria-label="Eventos en vivo"
      className="bg-card border-border flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border"
    >
      <div className="border-border flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3 lg:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="text-primary size-4" aria-hidden="true" />
          Eventos en Vivo
        </h2>
        <span
          className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${
            live ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              live ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
            }`}
          />
          {live ? 'EN VIVO' : 'PAUSADO'}
        </span>
        <p className="text-muted-foreground ml-auto font-mono text-[11px]">
          {events.length} eventos ·{' '}
          <span className={alerts > 0 ? 'text-destructive' : ''}>
            {alerts} alertas
          </span>
        </p>
      </div>

      <ul
        aria-live="polite"
        className="divide-border min-h-0 flex-1 divide-y overflow-y-auto"
      >
        {events.length === 0 && (
          <li className="text-muted-foreground p-4 text-sm lg:px-5">
            Esperando detecciones...
          </li>
        )}
        {events.map((event) => {
          const esAlerta = event.nivel_relevancia === 'alta'
          const conteo = conteoDe(event)
          return (
            <li
              key={event.id}
              className={`flex items-center gap-3 px-4 py-2.5 lg:px-5 ${
                esAlerta ? 'bg-destructive/10 border-destructive border-l-2' : ''
              }`}
            >
              <span
                aria-hidden="true"
                className={`shrink-0 text-center text-sm ${
                  esAlerta ? 'w-4' : 'text-primary w-4'
                }`}
              >
                {esAlerta ? '⚠️' : '●'}
              </span>
              <time
                dateTime={event.timestamp_evento}
                className="text-muted-foreground shrink-0 font-mono text-xs"
              >
                {new Date(event.timestamp_evento).toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </time>
              <p
                className={`text-sm font-medium ${
                  esAlerta ? 'text-destructive' : 'text-foreground'
                }`}
              >
                {conteo !== null
                  ? `${conteo} animales detectados`
                  : event.tipo ?? 'Detección'}
              </p>
              {event.descripcion && (
                <p className="text-destructive/80 truncate text-xs">
                  {event.descripcion}
                </p>
              )}
              <span className="text-muted-foreground ml-auto hidden shrink-0 font-mono text-[11px] sm:inline">
                {event.fuente ?? `#${event.id}`}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}