import Link from 'next/link'
import { PageShell } from '@/components/page-shell'

export const metadata = {
  title: 'Eventos — VIGÍA',
  description: 'Historial completo de detecciones registradas por VIGÍA.',
}

const EVENTS = [
  { time: '14:44:12', cows: 21, source: 'video_demo.mp4', alert: false },
  { time: '14:43:58', cows: 4, source: 'video_demo.mp4', alert: true, reason: 'Animal aislado del grupo' },
  { time: '14:43:31', cows: 18, source: 'video_demo.mp4', alert: false },
  { time: '14:43:04', cows: 26, source: 'video_demo.mp4', alert: false },
  { time: '14:42:40', cows: 31, source: 'video_demo.mp4', alert: true, reason: 'Aglomeración inusual detectada' },
  { time: '14:42:11', cows: 17, source: 'video_demo.mp4', alert: false },
  { time: '14:41:47', cows: 12, source: 'drone_live_01', alert: false },
  { time: '14:41:20', cows: 9, source: 'drone_live_01', alert: true, reason: 'Movimiento fuera del perímetro' },
  { time: '14:40:55', cows: 23, source: 'drone_live_01', alert: false },
  { time: '14:40:29', cows: 15, source: 'drone_live_01', alert: false },
  { time: '14:40:02', cows: 20, source: 'drone_live_01', alert: false },
  { time: '14:39:38', cows: 7, source: 'drone_live_01', alert: false },
]

export default function EventosPage() {
  return (
    <PageShell
      title="Eventos"
      subtitle="Historial de detecciones de todas las fuentes"
      meta="Últimos 12 registros"
    >
      <p className="text-muted-foreground text-xs">
        Para el flujo en tiempo real, abre el{' '}
        <Link href="/monitor" className="text-primary hover:underline">
          Monitor de Fuente
        </Link>
        .
      </p>

      <section className="bg-card border-border overflow-hidden rounded-xl border">
        <ul className="divide-border divide-y">
          {EVENTS.map((event) => (
            <li
              key={event.time}
              className={`flex items-center gap-3 px-4 py-2.5 lg:px-5 ${
                event.alert
                  ? 'bg-destructive/10 border-destructive border-l-2'
                  : ''
              }`}
            >
              <span
                aria-hidden="true"
                className={`w-4 shrink-0 text-center text-sm ${
                  event.alert ? '' : 'text-primary'
                }`}
              >
                {event.alert ? '⚠️' : '●'}
              </span>
              <span className="text-muted-foreground shrink-0 font-mono text-xs">
                {event.time}
              </span>
              <p
                className={`text-sm font-medium ${
                  event.alert ? 'text-destructive' : ''
                }`}
              >
                {event.cows} vacas detectadas
              </p>
              {event.reason && (
                <p className="text-destructive/80 truncate text-xs">
                  {event.reason}
                </p>
              )}
              <span className="text-muted-foreground ml-auto shrink-0 font-mono text-[11px]">
                {event.source}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}
