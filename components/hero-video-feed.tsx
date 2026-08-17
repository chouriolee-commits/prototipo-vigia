'use client'

import { Maximize2, Pause, Play, RotateCcw, Volume2 } from 'lucide-react'
import { formatTimecode } from '@/lib/vigia-events'

const DURATION = 180

/** Cajas de detección simuladas sobre el fotograma. */
const BOXES = [
  { left: '12%', top: '54%', width: '8%', height: '17%', conf: 0.97 },
  { left: '33%', top: '28%', width: '7%', height: '15%', conf: 0.93 },
  { left: '56%', top: '61%', width: '9%', height: '18%', conf: 0.89 },
  { left: '71%', top: '22%', width: '7%', height: '16%', conf: 0.91 },
  { left: '44%', top: '74%', width: '8%', height: '15%', conf: 0.85 },
  { left: '83%', top: '48%', width: '7%', height: '15%', conf: 0.82 },
]

type Props = {
  playing: boolean
  elapsed: number
  detected: number
  onToggle: () => void
  onRestart: () => void
  children?: React.ReactNode
}

export function HeroVideoFeed({
  playing,
  elapsed,
  detected,
  onToggle,
  onRestart,
  children,
}: Props) {
  const progress = Math.min(100, ((elapsed % DURATION) / DURATION) * 100)

  return (
    <section
      aria-label="Fuente de video en vivo"
      className="relative h-[60svh] min-h-[380px] w-full overflow-hidden bg-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/drone-pasture-frame.png"
        alt="Vista aérea de dron mostrando un potrero con ganado disperso"
        className={`size-full object-cover transition-transform duration-[9000ms] ease-linear ${
          playing ? 'scale-110' : 'scale-100'
        }`}
      />

      {/* Cajas de detección */}
      <div aria-hidden="true" className="absolute inset-0">
        {BOXES.map((box, i) => (
          <div
            key={box.left}
            className={`absolute rounded-sm border-2 transition-opacity duration-500 ${
              playing
                ? 'border-primary animate-pulse opacity-100'
                : 'border-primary/50 opacity-40'
            }`}
            style={{
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            <span className="bg-primary text-primary-foreground absolute -top-5 left-0 rounded px-1 font-mono text-[10px] leading-4 font-semibold">
              vaca {box.conf.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Degradados para legibilidad de los overlays */}
      <div
        aria-hidden="true"
        className="from-background/85 pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b to-transparent"
      />
      <div
        aria-hidden="true"
        className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t to-transparent"
      />

      {/* Etiqueta de fuente + estado (arriba a la izquierda) */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 lg:top-5 lg:left-6">
        <span className="bg-background/70 border-border rounded-full border px-3 py-1 font-mono text-xs backdrop-blur-sm">
          <span className="text-muted-foreground">Fuente: </span>
          video_demo.mp4
        </span>
        <span className="border-primary/40 bg-primary/15 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm">
          <span className="bg-primary size-1.5 animate-pulse rounded-full" />
          Procesando...
        </span>
        <span className="bg-background/70 text-muted-foreground hidden rounded-full px-3 py-1 font-mono text-[11px] backdrop-blur-sm sm:inline">
          DRONE-01 · 1920×1080 · 30 fps
        </span>
      </div>

      {/* Tarjetas de alerta flotantes (arriba a la derecha) */}
      <div className="absolute top-4 right-4 z-20 lg:top-5 lg:right-6">
        {children}
      </div>

      {playing ? null : (
        <button
          type="button"
          onClick={onToggle}
          className="bg-background/40 absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px] transition-colors"
        >
          <span className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-full shadow-lg">
            <Play className="size-7 translate-x-0.5" aria-hidden="true" />
          </span>
          <span className="sr-only">Reproducir video</span>
        </button>
      )}

      {/* Controles sobre el video */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-3 px-4 pb-4 lg:px-6 lg:pb-5">
        <div className="bg-foreground/20 h-1 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={playing}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none"
          >
            {playing ? (
              <Pause className="size-5" aria-hidden="true" />
            ) : (
              <Play className="size-5 translate-x-0.5" aria-hidden="true" />
            )}
            <span className="sr-only">{playing ? 'Pausar' : 'Reproducir'}</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="text-muted-foreground hover:bg-background/60 hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            <span className="sr-only">Reiniciar</span>
          </button>

          <p className="font-mono text-xs">
            <span className="text-foreground">
              {formatTimecode(elapsed % DURATION)}
            </span>
            <span className="text-muted-foreground">
              {' / '}
              {formatTimecode(DURATION)}
            </span>
          </p>

          <span className="bg-background/70 text-primary ml-2 hidden rounded-full px-3 py-1 font-mono text-[11px] backdrop-blur-sm sm:inline">
            {detected} detecciones en cuadro
          </span>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="text-muted-foreground hover:bg-background/60 hover:text-foreground flex size-9 items-center justify-center rounded-full transition-colors"
            >
              <Volume2 className="size-4" aria-hidden="true" />
              <span className="sr-only">Volumen</span>
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:bg-background/60 hover:text-foreground flex size-9 items-center justify-center rounded-full transition-colors"
            >
              <Maximize2 className="size-4" aria-hidden="true" />
              <span className="sr-only">Pantalla completa</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
