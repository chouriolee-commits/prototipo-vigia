'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  ArrowUpRight,
  Cpu,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import {
  getActividad,
  getAlertasRecientes,
  getResumen,
  logout,
  type ActividadHora,
  type AlertaReciente,
  type DashboardResumen,
} from '@/lib/api'

const LEVEL_STYLES: Record<string, string> = {
  baja: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  media: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  alta: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
}

function levelToEs(nivel: string): 'baja' | 'media' | 'alta' {
  if (nivel === 'alta') return 'alta'
  if (nivel === 'media') return 'media'
  return 'baja'
}

function tipoAlertaLegible(tipo: string): string {
  const mapa: Record<string, string> = {
    conteo_bajo: 'Conteo bajo de animales',
    sin_actividad: 'Sin actividad prolongada',
    aglomeracion: 'Aglomeración inusual',
    salida_perimetro: 'Salida de perímetro',
    animal_aislado: 'Animal aislado del grupo',
  }
  return mapa[tipo] ?? tipo.replaceAll('_', ' ')
}

function AnimatedNumber({ value }: { value: string }) {
  const [display, setDisplay] = useState(0)

  const esTexto = !/^[\d.,\s]+$/.test(value.trim())

  useEffect(() => {
    if (esTexto) return
    const target = Number(value.replace(/[^\d]/g, '')) || 0
    const inicio = performance.now()
    let raf: number
    const dur = 700
    const tick = (t: number) => {
      const p = Math.min(1, (t - inicio) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, esTexto])

  if (esTexto) return <>{value}</>
  const conFormato = value.includes('.') || value.includes(',')
  return <>{conFormato ? display.toLocaleString('es-CO') : display}</>
}

export function DashboardContent() {
  const router = useRouter()
  const [resumen, setResumen] = useState<DashboardResumen | null>(null)
  const [horas, setHoras] = useState<ActividadHora[]>([])
  const [alertas, setAlertas] = useState<AlertaReciente[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    Promise.all([getResumen(), getActividad(), getAlertasRecientes()])
      .then(([r, a, al]) => {
        setResumen(r)
        setHoras(a.horas)
        setAlertas(al)
        setError(null)
      })
      .catch(() => {
        setError('No se pudieron cargar los datos del sistema.')
      })
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    cargar()
    const id = setInterval(cargar, 30_000)
    return () => clearInterval(id)
  }, [cargar])

  const max = Math.max(1, ...horas.map((h) => h.eventos))
  const totalEventos = horas.reduce((sum, h) => sum + h.eventos, 0)

  const metricas = resumen
    ? [
        {
          label: 'Animales monitoreados',
          value: String(resumen.animales_activos),
          detail: 'activos',
          icon: Activity,
          tone: 'bg-emerald-500/10 text-emerald-300',
          href: '/animales',
        },
        {
          label: 'Detecciones 24 h',
          value: totalEventos.toLocaleString('es-CO'),
          detail: 'eventos',
          icon: Cpu,
          tone: 'bg-sky-500/10 text-sky-300',
          href: '/eventos',
        },
        {
          label: 'Alertas pendientes',
          value: String(resumen.alertas_pendientes),
          detail: 'requieren revisión',
          icon: TriangleAlert,
          tone: 'bg-amber-500/10 text-amber-300',
          href: '/alertas',
        },
        {
          label: 'Estado del sistema',
          value: error ? '—' : 'Operativo',
          detail: error ? 'con revisión' : 'monitoreo activo',
          icon: ShieldCheck,
          tone: 'bg-teal-500/10 text-teal-300',
          href: '/monitor',
        },
      ]
    : null

  return (
    <main className="flex w-full flex-1 flex-col">
      <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 backdrop-blur-sm lg:px-6">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            VIGÍA
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden font-mono text-xs text-muted-foreground sm:block">
            {new Date().toLocaleDateString('es-CO', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <button
            type="button"
            onClick={() => {
              void logout().finally(() => router.replace('/login'))
            }}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm hover:border-rose-500/40 hover:text-rose-300"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 p-4 lg:p-6">
        {cargando ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Cargando datos del sistema…
          </p>
        ) : error && !resumen ? (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-6 text-center text-sm text-rose-300">
            {error}
          </p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.55fr_0.9fr]">
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {(metricas ?? []).map(
                ({ label, value, detail, icon: Icon, tone, href }, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => router.push(href)}
                    style={{ animationDelay: `${i * 90}ms` }}
                    className="animate-in fade-in zoom-in-95 group rounded-2xl border border-border bg-card p-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-900/40 focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                      </div>
                      <span
                        className={`flex size-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${tone}`}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                    </div>

                    <p className="mt-5 text-3xl font-bold tracking-tight text-foreground">
                      <AnimatedNumber value={value} />
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">
                        <ArrowUpRight className="size-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                        {detail}
                      </span>
                    </div>
                  </button>
                ),
              )}
            </div>

            <aside className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-card text-emerald-300 shadow-sm">
                    <Sparkles className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold tracking-[0.12em] text-emerald-400 uppercase">
                      IA assist
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      Resumen del sistema
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-card px-2 py-1 text-[10px] font-medium text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {error ? 'Sin datos' : 'Disponible'}
                </div>
              </div>

              <ul className="mt-4 space-y-3 text-sm text-foreground/90">
                {error ? (
                  <li className="rounded-xl border border-border/60 bg-card px-3 py-2">
                    No hay conexión con el sistema de monitoreo. Verifica la conexión.
                  </li>
                ) : (
                  <>
                    <li className="rounded-xl border border-border/60 bg-card px-3 py-2">
                      {resumen?.animales_activos ?? 0} animales activos en monitoreo.
                    </li>
                    <li className="rounded-xl border border-border/60 bg-card px-3 py-2">
                      {resumen?.alertas_pendientes ?? 0} alertas pendientes de revisión.
                    </li>
                    <li className="rounded-xl border border-border/60 bg-card px-3 py-2">
                      {totalEventos} eventos detectados en las últimas 24 h.
                    </li>
                  </>
                )}
              </ul>
            </aside>
          </div>
        )}

        <section className="grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(0,0,0,0.18)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Actividad de monitoreo
                </h2>
                <p className="text-sm text-muted-foreground">Eventos por hora · últimas 24 h</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/eventos')}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                Ver todos
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </button>
            </div>

            {horas.length ? (
              <div className="mt-4 flex h-44 items-end gap-2">
                {horas.map(({ hora, eventos }) => (
                  <div key={hora} className="group flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-2xl bg-gradient-to-t from-emerald-600 to-teal-400 shadow-inner shadow-emerald-950/50 transition-all duration-500 ease-out group-hover:scale-[1.03]"
                      style={{
                        height: `${Math.max(4, (eventos / max) * 100)}%`,
                        transitionDelay: `${hora * 18}ms`,
                      }}
                      title={`${eventos} eventos`}
                    />
                    <span className="font-mono text-[9px] text-muted-foreground">
                      {String(hora).padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Sin actividad registrada en las últimas 24 h.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">Alertas recientes</h2>
              <button
                type="button"
                onClick={() => router.push('/alertas')}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
              >
                Ver todas
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {alertas.length ? (
                alertas.map((alert, i) => (
                  <div
                    key={alert.id}
                    style={{ animationDelay: `${i * 70}ms` }}
                    className="animate-in fade-in slide-in-from-bottom-2 rounded-xl border border-border bg-muted/60 p-3 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">
                        {tipoAlertaLegible(alert.tipo_alerta)}
                      </p>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${LEVEL_STYLES[levelToEs(alert.nivel)]}`}
                      >
                        {alert.nivel}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {new Date(alert.timestamp).toLocaleString('es-CO', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="capitalize">{alert.estado}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Sin alertas recientes.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}