'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, Maximize2, Minimize2, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { formatTimecode } from '@/lib/vigia-events'

type Props = {
  src: string
  detected: number
  pendingAlerts: number
}

export function HeroVideoFeed({ src, detected, pendingAlerts }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  // Reproducción/pausa reflejada en el elemento <video>.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (playing) void video.play()
    else video.pause()
  }, [playing])

  useEffect(() => {
    if (!sectionRef.current) return
    function onChange() {
      setFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function toggleFullscreen() {
    const el = sectionRef.current
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {})
    } else {
      void el.requestFullscreen().catch(() => {})
    }
  }

  const progress = duration > 0 ? (elapsed / duration) * 100 : 0

  function onTimeUpdate() {
    const video = videoRef.current
    if (video) setElapsed(video.currentTime)
  }

  function onLoadedMetadata() {
    const video = videoRef.current
    if (video) setDuration(video.duration || 0)
  }

  function restart() {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    void video.play()
    setPlaying(true)
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Fuente de video en vivo"
      className="relative h-[42svh] min-h-[300px] w-full shrink-0 overflow-hidden rounded-xl bg-black lg:h-[48svh]"
    >
      <video
        ref={videoRef}
        src={src}
        muted={muted}
        autoPlay
        loop
        playsInline
        preload="metadata"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        className="absolute inset-0 size-full object-cover"
      />

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
          {playing ? 'Procesando...' : 'Pausado'}
        </span>
        <span className="bg-background/70 text-muted-foreground hidden rounded-full px-3 py-1 font-mono text-[11px] backdrop-blur-sm sm:inline">
          DRONE-01 · 720p
        </span>
      </div>

      {/* Badge discreto de alertas pendientes (arriba a la derecha) */}
      {pendingAlerts > 0 && (
        <div className="absolute top-4 right-4 z-20 lg:top-5 lg:right-6">
          <span className="bg-destructive/90 text-destructive-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-lg backdrop-blur-sm">
            <Bell className="size-3.5" aria-hidden="true" />
            {pendingAlerts} alertas pendientes
          </span>
        </div>
      )}

      {playing ? null : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
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
            className="bg-primary h-full rounded-full transition-[width] duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
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
            onClick={restart}
            className="text-muted-foreground hover:bg-background/60 hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            <span className="sr-only">Reiniciar</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={!muted}
            className="text-muted-foreground hover:bg-background/60 hover:text-foreground flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
          >
            {muted ? (
              <VolumeX className="size-4" aria-hidden="true" />
            ) : (
              <Volume2 className="size-4" aria-hidden="true" />
            )}
            <span className="sr-only">{muted ? 'Activar sonido' : 'Silenciar'}</span>
          </button>

          <p className="font-mono text-xs">
            <span className="text-foreground">{formatTimecode(elapsed)}</span>
            <span className="text-muted-foreground">
              {' / '}
              {formatTimecode(duration)}
            </span>
          </p>

          <span className="bg-background/70 text-primary ml-2 hidden rounded-full px-3 py-1 font-mono text-[11px] backdrop-blur-sm sm:inline">
            {detected} detecciones en cuadro
          </span>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-pressed={fullscreen}
              className="text-muted-foreground hover:bg-background/60 hover:text-foreground flex size-9 items-center justify-center rounded-full transition-colors"
            >
              {fullscreen ? (
                <Minimize2 className="size-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="size-4" aria-hidden="true" />
              )}
              <span className="sr-only">{fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}