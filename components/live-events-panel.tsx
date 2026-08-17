'use client'

import { Activity } from 'lucide-react'
import { formatTimestamp, type DetectionEvent } from '@/lib/vigia-events'

type Props = {
  events: DetectionEvent[]
  live: boolean
}

/** Panel inferior: registro desplazable de los últimos 10 eventos. */
export function LiveEventsPanel({ events, live }: Props) {
  const alerts = events.filter((e) => e.isAlert).length

  return (
    <section
      aria-label="Eventos en vivo"
      className="bg-card border-border flex max-h-[55svh] min-h-0 flex-1 flex-col overflow-hidden border-t md:max-h-none"
    >
      <div className="border-border flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3 lg:px-6">
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
          <li className="text-muted-foreground p-4 text-sm lg:px-6">
            Esperando detecciones...
          </li>
        )}
        {events.map((event) => (
          <li
            key={event.id}
            className={`flex items-center gap-3 px-4 py-2.5 lg:px-6 ${
              event.isAlert
                ? 'bg-destructive/10 border-destructive border-l-2'
                : ''
            }`}
          >
            <span
              aria-hidden="true"
              className={`shrink-0 text-center text-sm ${
                event.isAlert ? 'w-4' : 'text-primary w-4'
              }`}
            >
              {event.isAlert ? '⚠️' : '●'}
            </span>
            <time
              dateTime={new Date(event.time).toISOString()}
              className="text-muted-foreground shrink-0 font-mono text-xs"
            >
              {formatTimestamp(event.time)}
            </time>
            <p
              className={`text-sm font-medium ${
                event.isAlert ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {event.cows} vacas detectadas
            </p>
            {event.reason && (
              <p className="text-destructive/80 truncate text-xs">
                {event.reason}
              </p>
            )}
            <span className="text-muted-foreground ml-auto hidden shrink-0 font-mono text-[11px] sm:inline">
              DRONE-01
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
