'use client'

import { useCallback, useEffect, useState } from 'react'
import { Video } from 'lucide-react'
import { FloatingAlerts } from '@/components/floating-alerts'
import { HeroVideoFeed } from '@/components/hero-video-feed'
import { LiveEventsPanel } from '@/components/live-events-panel'
import { createEvent, seedEvents, type DetectionEvent } from '@/lib/vigia-events'

export function MonitorFuente() {
  const [playing, setPlaying] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [events, setEvents] = useState<DetectionEvent[]>([])
  const [alerts, setAlerts] = useState<DetectionEvent[]>([])

  // Historial inicial en el cliente (evita desajustes de hidratación).
  useEffect(() => {
    setEvents(seedEvents())
  }, [])

  // Reloj del reproductor.
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [playing])

  // Nuevas detecciones mientras la fuente se procesa.
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const event = createEvent()
      setEvents((prev) => [event, ...prev].slice(0, 10))
      if (event.isAlert) setAlerts((prev) => [event, ...prev].slice(0, 3))
    }, 4000)
    return () => clearInterval(id)
  }, [playing])

  const dismissAlert = useCallback((id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const latest = events[0]
  const alertCount = events.filter((e) => e.isAlert).length

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col md:h-[calc(100svh-3.5rem)] md:flex-none md:overflow-hidden">
      <HeroVideoFeed
        playing={playing}
        elapsed={elapsed}
        detected={latest?.cows ?? 0}
        onToggle={() => setPlaying((p) => !p)}
        onRestart={() => setElapsed(0)}
      >
        <FloatingAlerts alerts={alerts} onDismiss={dismissAlert} />
      </HeroVideoFeed>

      {/* Ficha de la fuente */}
      <section
        aria-label="Información de la fuente"
        className="bg-background border-border flex flex-wrap items-center gap-x-6 gap-y-3 border-t px-4 py-3 lg:px-6"
      >
        <div className="flex items-center gap-3">
          <span className="bg-secondary text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Video className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-semibold">
              video_demo.mp4
            </p>
            <p className="text-muted-foreground text-[11px]">
              Fuente local · 42.8 MB
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-[10px] tracking-wide uppercase">
              Tipo
            </dt>
            <dd className="font-medium">Video</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-[10px] tracking-wide uppercase">
              Estado
            </dt>
            <dd
              className={`flex items-center gap-1.5 font-medium ${
                playing ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  playing ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
                }`}
              />
              {playing ? 'Procesando' : 'En pausa'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-[10px] tracking-wide uppercase">
              Modelo
            </dt>
            <dd className="font-medium">YOLOv8-cattle</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-[10px] tracking-wide uppercase">
              Alertas
            </dt>
            <dd
              className={`font-medium ${alertCount > 0 ? 'text-destructive' : ''}`}
            >
              {alertCount}
            </dd>
          </div>
        </dl>
      </section>

      <LiveEventsPanel events={events} live={playing} />
    </main>
  )
}
