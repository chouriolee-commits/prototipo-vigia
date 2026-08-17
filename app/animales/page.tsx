import { PageShell } from '@/components/page-shell'

export const metadata = {
  title: 'Animales — VIGÍA',
  description: 'Inventario de animales detectados y su última ubicación.',
}

const GROUPS = [
  { zone: 'Potrero Norte', count: 96, trend: '+4', state: 'Normal' },
  { zone: 'Potrero Este', count: 61, trend: '-2', state: 'Normal' },
  { zone: 'Bebedero Sur', count: 48, trend: '+9', state: 'Aglomeración' },
  { zone: 'Corral 3', count: 27, trend: '0', state: 'Sin movimiento' },
  { zone: 'Manga de manejo', count: 16, trend: '+16', state: 'En tránsito' },
]

const STATE_STYLES: Record<string, string> = {
  Normal: 'border-primary/30 bg-primary/10 text-primary',
  Aglomeración: 'border-warning/30 bg-warning/10 text-warning',
  'Sin movimiento': 'border-destructive/30 bg-destructive/10 text-destructive',
  'En tránsito': 'border-info/30 bg-info/10 text-info',
}

export default function AnimalesPage() {
  const total = GROUPS.reduce((sum, g) => sum + g.count, 0)

  return (
    <PageShell
      title="Animales"
      subtitle="Conteo por zona a partir de las detecciones más recientes"
      meta={`${total} animales activos`}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {GROUPS.map((group) => (
          <article
            key={group.zone}
            className="bg-card border-border flex flex-col gap-3 rounded-xl border p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-semibold">{group.zone}</h2>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATE_STYLES[group.state]}`}
              >
                {group.state}
              </span>
            </div>
            <p className="text-3xl font-semibold tracking-tight">
              {group.count}
              <span className="text-muted-foreground ml-2 text-xs font-normal">
                vacas detectadas
              </span>
            </p>
            <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${(group.count / total) * 100 * 2}%` }}
              />
            </div>
            <p className="text-muted-foreground font-mono text-[11px]">
              variación 24 h: {group.trend}
            </p>
          </article>
        ))}
      </div>
    </PageShell>
  )
}
