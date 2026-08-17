import Link from 'next/link'
import {
  Activity,
  ArrowUpRight,
  Cpu,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'

const HOURS = [
  2, 4, 3, 1, 0, 2, 5, 8, 12, 15, 11, 9, 7, 10, 14, 18, 16, 12, 9, 6, 8, 5, 3, 2,
]
const MAX = Math.max(...HOURS)

const ALERTS = [
  {
    date: '16/08 · 14:32',
    type: 'Salida de perímetro',
    level: 'alto' as const,
    status: 'Pendiente',
  },
  {
    date: '16/08 · 13:05',
    type: 'Animal aislado',
    level: 'medio' as const,
    status: 'En revisión',
  },
  {
    date: '16/08 · 11:48',
    type: 'Aglomeración inusual',
    level: 'bajo' as const,
    status: 'Resuelta',
  },
  {
    date: '16/08 · 09:21',
    type: 'Sin movimiento',
    level: 'alto' as const,
    status: 'Pendiente',
  },
]

const LEVEL_STYLES = {
  bajo: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medio: 'border-amber-200 bg-amber-50 text-amber-700',
  alto: 'border-rose-200 bg-rose-50 text-rose-700',
}

const METRICS = [
  {
    label: 'Animales monitoreados',
    value: '248',
    detail: '+6 vs. ayer',
    icon: Activity,
    tone: 'bg-violet-50 text-violet-700',
  },
  {
    label: 'Detecciones del día',
    value: '1.482',
    detail: '82% precisión',
    icon: Cpu,
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    label: 'Alertas activas',
    value: '3',
    detail: '2 de prioridad alta',
    icon: TriangleAlert,
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    label: 'Sistema saludable',
    value: '99.2%',
    detail: 'latencia estable',
    icon: ShieldCheck,
    tone: 'bg-emerald-50 text-emerald-700',
  },
]

export default function DashboardPage() {
  return (
    <main className="flex w-full flex-1 flex-col">
      <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm lg:px-6">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
            VIGÍA
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
        </div>
        <p className="hidden font-mono text-xs text-slate-500 sm:block">
          Domingo, 16 de agosto · 14:45
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 p-4 lg:p-6">
        <div className="grid gap-4 xl:grid-cols-[1.55fr_0.9fr]">
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {METRICS.map(({ label, value, detail, icon: Icon, tone }) => (
              <article
                key={label}
                className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_1px_0_rgba(15,23,42,0.02)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                  </div>
                  <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                </div>

                <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                  {value}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                    {detail}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <aside className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
                  <Sparkles className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold tracking-[0.12em] text-violet-500 uppercase">
                    IA assist
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    Resumen del sistema
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white/80 px-2 py-1 text-[10px] font-medium text-violet-700">
                <span className="size-1.5 rounded-full bg-violet-500" />
                Disponible
              </div>
            </div>

            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="rounded-xl border border-white/80 bg-white/60 px-3 py-2">
                5 animales con movimiento anómalo en Potrero Norte.
              </li>
              <li className="rounded-xl border border-white/80 bg-white/60 px-3 py-2">
                2 alertas críticas pendientes de revisión del operador.
              </li>
              <li className="rounded-xl border border-white/80 bg-white/60 px-3 py-2">
                Detecciones recientes con una precisión promedio del 82%.
              </li>
            </ul>
          </aside>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Actividad de monitoreo
                </h2>
                <p className="text-sm text-slate-500">Eventos por hora · últimas 24 h</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                +12.4%
              </span>
            </div>

            <div className="mt-4 flex h-44 items-end gap-2">
              {HOURS.map((n, i) => (
                <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-2xl bg-gradient-to-t from-violet-500 to-indigo-400 shadow-inner shadow-violet-200 transition-transform duration-200 group-hover:scale-[1.02]"
                    style={{ height: `${Math.max(12, (n / MAX) * 100)}%` }}
                    title={`${n} eventos`}
                  />
                  <span className="font-mono text-[9px] text-slate-400">
                    {String(i).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
            <h2 className="text-base font-semibold text-slate-900">Alertas recientes</h2>
            <div className="mt-4 space-y-3">
              {ALERTS.map((alert) => (
                <div
                  key={alert.date}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800">{alert.type}</p>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${LEVEL_STYLES[alert.level]}`}
                    >
                      {alert.level}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{alert.date}</span>
                    <span>{alert.status}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/alertas"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-700 hover:text-violet-800"
            >
              Ver todas las alertas
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Estado general</h2>
            <Link href="/monitor" className="text-sm font-medium text-violet-700 hover:text-violet-800">
              Ver monitor
            </Link>
          </div>

          <div className="grid gap-0 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['Caseta Norte', 'Online', '99.7%'],
              ['Drone-01', 'Procesando', '24 fps'],
              ['Corral Sur', 'Normal', '12 alertas'],
              ['IA Vision', 'Actualizada', '2 min ago'],
            ].map(([label, status, value]) => (
              <div key={label} className="border-b border-slate-200 p-4 md:border-r md:border-b-0 last:border-r-0">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-lg font-bold text-slate-900">{status}</span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                    OK
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
