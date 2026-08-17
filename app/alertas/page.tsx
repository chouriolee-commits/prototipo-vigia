import { PageShell } from '@/components/page-shell'

export const metadata = {
  title: 'Alertas — VIGÍA',
  description: 'Alertas de comportamiento y perímetro detectadas por VIGÍA.',
}

const ALERTS = [
  {
    id: 'ALT-1042',
    time: '16/08 · 14:32',
    type: 'Salida de perímetro',
    zone: 'Potrero Norte',
    level: 'alto' as const,
    status: 'Pendiente',
  },
  {
    id: 'ALT-1041',
    time: '16/08 · 13:05',
    type: 'Animal aislado del grupo',
    zone: 'Potrero Norte',
    level: 'medio' as const,
    status: 'En revisión',
  },
  {
    id: 'ALT-1039',
    time: '16/08 · 11:48',
    type: 'Aglomeración inusual',
    zone: 'Bebedero Sur',
    level: 'bajo' as const,
    status: 'Resuelta',
  },
  {
    id: 'ALT-1036',
    time: '16/08 · 09:21',
    type: 'Sin movimiento por 10 min',
    zone: 'Corral 3',
    level: 'alto' as const,
    status: 'Pendiente',
  },
  {
    id: 'ALT-1030',
    time: '15/08 · 22:04',
    type: 'Salida de perímetro',
    zone: 'Potrero Este',
    level: 'medio' as const,
    status: 'Resuelta',
  },
]

const LEVEL_STYLES = {
  bajo: 'border-primary/30 bg-primary/10 text-primary',
  medio: 'border-warning/30 bg-warning/10 text-warning',
  alto: 'border-destructive/30 bg-destructive/10 text-destructive',
}

export default function AlertasPage() {
  return (
    <PageShell
      title="Alertas"
      subtitle="Incidencias que requieren revisión del operador"
      meta="2 pendientes · 1 en revisión"
    >
      <section className="bg-card border-border overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[38rem] text-sm">
          <thead>
            <tr className="text-muted-foreground border-border border-b text-left text-[11px] tracking-wide uppercase">
              <th className="px-5 py-2.5 font-medium">ID</th>
              <th className="px-5 py-2.5 font-medium">Fecha</th>
              <th className="px-5 py-2.5 font-medium">Tipo</th>
              <th className="px-5 py-2.5 font-medium">Zona</th>
              <th className="px-5 py-2.5 font-medium">Nivel</th>
              <th className="px-5 py-2.5 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {ALERTS.map((alert) => (
              <tr key={alert.id} className="hover:bg-secondary/40">
                <td className="text-muted-foreground px-5 py-3 font-mono text-xs">
                  {alert.id}
                </td>
                <td className="text-muted-foreground px-5 py-3 font-mono text-xs">
                  {alert.time}
                </td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2">
                    {alert.level === 'alto' && (
                      <span aria-hidden="true">⚠️</span>
                    )}
                    {alert.type}
                  </span>
                </td>
                <td className="text-muted-foreground px-5 py-3">{alert.zone}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </PageShell>
  )
}
