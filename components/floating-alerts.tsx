'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { formatTimestamp, type DetectionEvent } from '@/lib/vigia-events'

type Props = {
  alerts: DetectionEvent[]
  onDismiss: (id: number) => void
}

/** Tarjetas flotantes sobre el video; se auto-descartan a los 9 s. */
export function FloatingAlerts({ alerts, onDismiss }: Props) {
  return (
    <div
      aria-live="assertive"
      aria-label="Alertas recientes"
      className="flex w-[min(19rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function AlertCard({
  alert,
  onDismiss,
}: {
  alert: DetectionEvent
  onDismiss: (id: number) => void
}) {
  useEffect(() => {
    const id = setTimeout(() => onDismiss(alert.id), 9000)
    return () => clearTimeout(id)
  }, [alert.id, onDismiss])

  return (
    <article className="border-destructive/60 bg-destructive/20 animate-in slide-in-from-right-4 fade-in flex gap-2.5 rounded-lg border p-3 shadow-lg backdrop-blur-md duration-300">
      <span aria-hidden="true" className="text-base leading-5">
        ⚠️
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h3 className="text-destructive text-sm font-semibold">
            Alerta de detección
          </h3>
          <time
            dateTime={new Date(alert.time).toISOString()}
            className="text-muted-foreground ml-auto shrink-0 font-mono text-[10px]"
          >
            {formatTimestamp(alert.time)}
          </time>
        </div>
        <p className="text-foreground mt-0.5 text-xs">
          {alert.cows} vacas detectadas
        </p>
        {alert.reason && (
          <p className="text-destructive/90 mt-0.5 text-xs">{alert.reason}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(alert.id)}
        className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 flex size-6 shrink-0 items-center justify-center rounded-full transition-colors"
      >
        <X className="size-3.5" aria-hidden="true" />
        <span className="sr-only">Descartar alerta</span>
      </button>
    </article>
  )
}
