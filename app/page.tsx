import Link from 'next/link'
import { Activity, Bell, TriangleAlert } from 'lucide-react'

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
  bajo: 'border-primary/30 bg-primary/10 text-primary',
  medio: 'border-warning/30 bg-warning/10 text-warning',
  alto: 'border-destructive/30 bg-destructive/10 text-destructive',
}

export default function DashboardPage() {
  return (
    <main className="flex w-full flex-1 flex-col">
      <header className="border-border flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 lg:px-6">
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground font-mono text-xs">
          Domingo, 16 de agosto · 14:45
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Animales Activos',
              value: '248',
              hint: '+6 vs. ayer',
              icon: Activity,
              tone: 'text-primary bg-primary/10',
            },
            {
              label: 'Eventos Hoy',
              value: '182',
              hint: 'últimas 24 h',
              icon: Bell,
              tone: 'text-info bg-info/10',
            },
            {
              label: 'Alertas Pendientes',
              value: '3',
              hint: '2 de nivel alto',
              icon: TriangleAlert,
              tone: 'text-destructive bg-destructive/10',
            },
          ].map(({ label, value, hint, icon: Icon, tone }) => (
            <article
              key={label}
              className="bg-card border-border rounded-xl border p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-muted-foreground text-sm">{label}</p>
                <span
                  className={`flex size-9 items-center justify-center rounded-lg ${tone}`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {value}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
            </article>
          ))}
        </div>

        <section className="bg-card border-border rounded-xl border p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Actividad últimas 24h</h2>
            <p className="text-muted-foreground text-xs">eventos por hora</p>
          </div>
          <div className="mt-6 flex h-40 items-end gap-1.5">
            {HOURS.map((n, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                <div
                  className="bg-primary/70 group-hover:bg-primary w-full rounded-t transition-colors"
                  style={{ height: `${Math.max(4, (n / MAX) * 100)}%` }}
                  title={`${n} eventos`}
                />
                <span className="text-muted-foreground font-mono text-[9px]">
                  {String(i).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border-border overflow-hidden rounded-xl border">
          <div className="border-border flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-semibold">Alertas recientes</h2>
            <Link
              href="/monitor"
              className="text-primary text-xs hover:underline"
            >
              Ir al monitor
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-border border-b text-left text-[11px] tracking-wide uppercase">
                <th className="px-5 py-2 font-medium">Fecha</th>
                <th className="px-5 py-2 font-medium">Tipo</th>
                <th className="px-5 py-2 font-medium">Nivel</th>
                <th className="px-5 py-2 font-medium">Estado</th>
                <th className="px-5 py-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {ALERTS.map((alert) => (
                <tr key={alert.date} className="hover:bg-secondary/40">
                  <td className="text-muted-foreground px-5 py-3 font-mono text-xs">
                    {alert.date}
                  </td>
                  <td className="px-5 py-3">{alert.type}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${LEVEL_STYLES[alert.level]}`}
                    >
                      {alert.level}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-5 py-3">
                    {alert.status}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      className="text-primary text-xs hover:underline"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  )
}
