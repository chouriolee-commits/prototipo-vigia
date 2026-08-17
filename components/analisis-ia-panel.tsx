'use client'

import { useEffect, useState } from 'react'
import { BrainCircuit, LoaderCircle, Sparkles, TriangleAlert } from 'lucide-react'
import { analizarAlerta, getAlertas, type Alerta, type AnalisisIA } from '@/lib/api'

function tipoLegible(tipo: string): string {
  const mapa: Record<string, string> = {
    conteo_bajo: 'Conteo bajo',
    sin_actividad: 'Sin actividad',
    aglomeracion: 'Aglomeración',
    salida_perimetro: 'Salida de perímetro',
    animal_aislado: 'Animal aislado',
  }
  return mapa[tipo] ?? tipo.replaceAll('_', ' ')
}

export function AnalisisIaPanel() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [seleccionada, setSeleccionada] = useState<number | null>(null)
  const [analisis, setAnalisis] = useState<AnalisisIA | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAlertas({ limit: 10 })
      .then((data) => {
        setAlertas(data)
        if (data.length > 0) setSeleccionada(data[0].id)
      })
      .catch(() => {
        setError('No se pudieron cargar las alertas.')
      })
  }, [])

  function ejecutarAnalisis() {
    if (seleccionada === null) return
    setCargando(true)
    setError(null)
    setAnalisis(null)
    analizarAlerta(seleccionada)
      .then((resultado) => {
        setAnalisis(resultado)
      })
      .catch(() => {
        setError(
          'No se pudo obtener el análisis. Verifica que el agente IA esté activo en :8001.',
        )
      })
      .finally(() => setCargando(false))
  }

  return (
    <section
      aria-label="Análisis de alertas con IA"
      className="bg-card border-border flex max-h-[55svh] min-h-0 flex-1 flex-col overflow-hidden border-t md:max-h-none"
    >
      <div className="border-border flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3 lg:px-6">
        <h2 className="flex items-center gap-2 text-base font-semibold lg:text-lg">
          <BrainCircuit className="text-primary size-5" aria-hidden="true" />
          Análisis con IA
        </h2>
        <span className="text-muted-foreground font-mono text-xs">
          Modelo: gpt-oss-20b
        </span>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={seleccionada ?? ''}
            onChange={(e) => setSeleccionada(Number(e.target.value))}
            aria-label="Seleccionar alerta para analizar"
            className="border-border bg-secondary text-foreground rounded-lg border px-3 py-2 text-sm font-medium"
          >
            {alertas.map((alerta) => (
              <option key={alerta.id} value={alerta.id}>
                ALT-{String(alerta.id).padStart(4, '0')} · {tipoLegible(alerta.tipo_alerta)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={ejecutarAnalisis}
            disabled={cargando || seleccionada === null || alertas.length === 0}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargando ? (
              <LoaderCircle className="animate-spin size-4" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            {cargando ? 'Analizando…' : 'Analizar'}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
        {error && (
          <p className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <TriangleAlert className="size-5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {!analisis && !error && !cargando && (
          <p className="text-muted-foreground py-10 text-center text-base">
            Selecciona una alerta y presiona «Analizar» para que la IA genere el
            diagnóstico.
          </p>
        )}

        {cargando && !analisis && (
          <p className="text-muted-foreground py-10 text-center text-base">
            Generando análisis con el agente IA…
          </p>
        )}

        {analisis && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full border border-primary/20 px-3 py-1.5 text-sm font-semibold">
                <Sparkles className="size-4" aria-hidden="true" />
                Urgencia: {analisis.nivel_urgencia}
              </span>
              <span className="text-muted-foreground font-mono text-xs">
                {analisis.modelo_usado} ·{' '}
                {new Date(analisis.timestamp).toLocaleString('es-CO')}
              </span>
            </div>

            <div className="bg-secondary/60 rounded-lg p-4">
              <h3 className="text-muted-foreground mb-1.5 text-sm font-semibold tracking-wide uppercase">
                Resumen
              </h3>
              <p className="text-base leading-relaxed">{analisis.resumen}</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-muted-foreground mb-1.5 text-sm font-semibold tracking-wide uppercase">
                Justificación
              </h3>
              <p className="text-base leading-relaxed text-slate-700">
                {analisis.justificacion}
              </p>
            </div>

            <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
              <h3 className="text-emerald-700 mb-1.5 text-sm font-semibold tracking-wide uppercase">
                Recomendación
              </h3>
              <p className="text-base leading-relaxed text-emerald-900">
                {analisis.recomendacion}
              </p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-start gap-2 text-sm leading-relaxed text-amber-800">
                <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <span>{analisis.disclaimer}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}