'use client'

import { useEffect, useState } from 'react'
import { PageShell } from '@/components/page-shell'
import { getAlertas, type Alerta } from '@/lib/api'

const LEVEL_STYLES: Record<Alerta['nivel'], string> = {
  baja: 'border-primary/30 bg-primary/10 text-primary',
  media: 'border-warning/30 bg-warning/10 text-warning',
  alta: 'border-destructive/30 bg-destructive/10 text-destructive',
}

function tipoLegible(tipo: string): string {
  const mapa: Record<string, string> = {
    conteo_bajo: 'Conteo bajo de animales',
    sin_actividad: 'Sin actividad prolongada',
    aglomeracion: 'Aglomeración inusual',
    salida_perimetro: 'Salida de perímetro',
    animal_aislado: 'Animal aislado del grupo',
  }
  return mapa[tipo] ?? tipo.replaceAll('_', ' ')
}

export function AlertasContent() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    async function cargar() {
      try {
        const data = await getAlertas()
        if (activo) {
          setAlertas(data)
          setError(null)
        }
      } catch {
        if (activo) setError('No se pudieron cargar las alertas.')
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => {
      activo = false
    }
  }, [])

  const pendientes = alertas.filter((a) => a.estado === 'pendiente').length
  const enRevision = alertas.filter((a) => a.estado === 'revisada').length

  return (
    <PageShell
      title="Alertas"
      subtitle="Incidencias que requieren revisión del operador"
      meta={`${pendientes} pendientes · ${enRevision} en revisión`}
    >
      {cargando ? (
        <p className="py-10 text-center text-sm text-slate-500">Cargando alertas…</p>
      ) : error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700">
          {error}
        </p>
      ) : (
        <section className="bg-card border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[38rem] text-sm">
            <thead>
              <tr className="text-muted-foreground border-border border-b text-left text-[11px] tracking-wide uppercase">
                <th className="px-5 py-2.5 font-medium">ID</th>
                <th className="px-5 py-2.5 font-medium">Fecha</th>
                <th className="px-5 py-2.5 font-medium">Tipo</th>
                <th className="px-5 py-2.5 font-medium">Descripción</th>
                <th className="px-5 py-2.5 font-medium">Nivel</th>
                <th className="px-5 py-2.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {alertas.map((alert) => (
                <tr key={alert.id} className="hover:bg-secondary/40">
                  <td className="text-muted-foreground px-5 py-3 font-mono text-xs">
                    ALT-{String(alert.id).padStart(4, '0')}
                  </td>
                  <td className="text-muted-foreground px-5 py-3 font-mono text-xs">
                    {new Date(alert.timestamp).toLocaleString('es-CO', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2">
                      {alert.nivel === 'alta' && <span aria-hidden="true">⚠️</span>}
                      {tipoLegible(alert.tipo_alerta)}
                    </span>
                  </td>
                  <td className="text-muted-foreground max-w-xs px-5 py-3">
                    {alert.descripcion}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${LEVEL_STYLES[alert.nivel]}`}
                    >
                      {alert.nivel}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-5 py-3 capitalize">
                    {alert.estado}
                  </td>
                </tr>
              ))}
              {alertas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">
                    Sin alertas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </PageShell>
  )
}