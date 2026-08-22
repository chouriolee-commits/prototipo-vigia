'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PageShell } from '@/components/page-shell'
import { getEventos, type Evento } from '@/lib/api'

function conteoDe(evento: Evento): number | null {
  const raw = evento.datos_raw
  if (raw && typeof raw === 'object' && 'conteo_total' in raw) {
    const valor = raw.conteo_total
    if (typeof valor === 'number') return valor
  }
  return null
}

function nivelLabel(nivel: Evento['nivel_relevancia']): string {
  if (nivel === 'alta') return '⚠️'
  if (nivel === 'media') return '▲'
  return '●'
}

export function EventosContent() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    getEventos()
      .then((data) => {
        if (activo) setEventos(data)
      })
      .catch(() => {
        if (activo) setError('No se pudieron cargar los eventos.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  return (
    <PageShell
      title="Eventos"
      subtitle="Historial de detecciones de todas las fuentes"
      meta={cargando ? 'Cargando…' : `Últimos ${eventos.length} registros`}
    >
      <p className="text-muted-foreground text-xs">
        Para el flujo en tiempo real, abre el{' '}
        <Link href="/monitor" className="text-primary hover:underline">
          Monitor de Fuente
        </Link>
        .
      </p>

      {cargando ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Cargando eventos…</p>
      ) : error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-6 text-center text-sm text-rose-300">
          {error}
        </p>
      ) : (
        <section className="bg-card border-border overflow-hidden rounded-xl border">
          <ul className="divide-border divide-y">
            {eventos.map((event) => {
              const conteo = conteoDe(event)
              const esAlerta = event.nivel_relevancia === 'alta'
              return (
                <li
                  key={event.id}
                  className={`flex items-center gap-3 px-4 py-2.5 lg:px-5 ${
                    esAlerta ? 'bg-destructive/10 border-destructive border-l-2' : ''
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-4 shrink-0 text-center text-sm ${
                      esAlerta ? '' : 'text-primary'
                    }`}
                  >
                    {nivelLabel(event.nivel_relevancia)}
                  </span>
                  <span className="text-muted-foreground shrink-0 font-mono text-xs">
                    {new Date(event.timestamp_evento).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <p
                    className={`text-sm font-medium ${
                      esAlerta ? 'text-destructive' : ''
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
                  <span className="text-muted-foreground ml-auto shrink-0 font-mono text-[11px]">
                    {event.fuente ?? `#${event.id}`}
                  </span>
                </li>
              )
            })}
            {eventos.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                Sin eventos registrados.
              </li>
            )}
          </ul>
        </section>
      )}
    </PageShell>
  )
}