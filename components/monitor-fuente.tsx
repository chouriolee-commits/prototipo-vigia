'use client'

import { useEffect, useState } from 'react'
import { Bell, Video } from 'lucide-react'
import { HeroVideoFeed } from '@/components/hero-video-feed'
import { LiveEventsPanel } from '@/components/live-events-panel'
import { AnalisisIaPanel } from '@/components/analisis-ia-panel'
import { getAlertas, getEventos, videoUrl, type Alerta, type Evento } from '@/lib/api'

function conteoDe(evento: Evento): number {
  const raw = evento.datos_raw
  if (raw && typeof raw === 'object' && 'conteo_total' in raw) {
    const valor = raw.conteo_total
    if (typeof valor === 'number') return valor
  }
  return 0
}

export function MonitorFuente() {
  const [events, setEvents] = useState<Evento[]>([])
  const [alerts, setAlerts] = useState<Alerta[]>([])
  const fuenteNombre = 'video_demo.mp4'

  // Carga inicial + polling de eventos reales y alertas pendientes.
  useEffect(() => {
    let activo = true
    const cargar = () => {
      getEventos(10)
        .then((data) => {
          if (activo) setEvents(data)
        })
        .catch(() => {})
      getAlertas({ estado: 'pendiente', limit: 10 })
        .then((data) => {
          if (activo) setAlerts(data)
        })
        .catch(() => {})
    }
    cargar()
    const id = setInterval(cargar, 5000)
    return () => {
      activo = false
      clearInterval(id)
    }
  }, [])

  const latest = events[0]
  const detected = latest ? conteoDe(latest) : 0
  const alertCount = events.filter((e) => e.nivel_relevancia === 'alta').length
  const pending = alerts.filter((a) => a.estado === 'pendiente').length

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col md:h-[calc(100svh-3.5rem)] md:flex-none md:overflow-hidden">
      <HeroVideoFeed src={videoUrl(fuenteNombre)} detected={detected} pendingAlerts={pending} />

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
            <p className="truncate font-mono text-sm font-semibold">{fuenteNombre}</p>
            <p className="text-muted-foreground text-[11px]">
              Fuente del backend · streaming vía /media
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
            <dd className="text-primary flex items-center gap-1.5 font-medium">
              <span className="bg-primary size-1.5 animate-pulse rounded-full" />
              Procesando
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
            <dd className={`font-medium ${alertCount > 0 ? 'text-destructive' : ''}`}>
              {alertCount}
            </dd>
          </div>
        </dl>
      </section>

      {/* Módulo de alertas pendientes */}
      <section
        aria-label="Alertas pendientes"
        className="bg-card border-border flex max-h-[40svh] min-h-0 flex-1 flex-col overflow-hidden border-t md:max-h-none"
      >
        <div className="border-border flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3 lg:px-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="text-destructive size-4" aria-hidden="true" />
            Alertas pendientes
          </h2>
          <p className="text-muted-foreground ml-auto font-mono text-[11px]">
            {pending} sin revisar
          </p>
        </div>
        <ul className="divide-border min-h-0 flex-1 divide-y overflow-y-auto">
          {alerts.length === 0 && (
            <li className="text-muted-foreground p-4 text-sm lg:px-6">
              Sin alertas pendientes.
            </li>
          )}
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`flex flex-wrap items-center gap-3 px-4 py-2.5 lg:px-6 ${
                alert.nivel === 'alta' ? 'bg-destructive/10 border-destructive border-l-2' : ''
              }`}
            >
              <span aria-hidden="true" className="text-sm">
                {alert.nivel === 'alta' ? '⚠️' : alert.nivel === 'media' ? '🟠' : '🟢'}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${alert.nivel === 'alta' ? 'text-destructive' : ''}`}>
                  {alert.tipo_alerta.replaceAll('_', ' ')}
                </p>
                {alert.descripcion && (
                  <p className="text-muted-foreground truncate text-xs">{alert.descripcion}</p>
                )}
              </div>
              <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                ALT-{String(alert.id).padStart(4, '0')}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <LiveEventsPanel events={events} live />

      <AnalisisIaPanel />
    </main>
  )
}