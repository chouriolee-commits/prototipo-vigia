'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, LoaderCircle, SendHorizonal, Sparkles, X } from 'lucide-react'
import { charlarIa, type MensajeChat } from '@/lib/api'

type Props = {
  open: boolean
  onClose: () => void
}

const SUGERENCIAS = [
  '¿Qué patrón de alerta es más urgente?',
  'Explica la alerta de conteo bajo',
  'Recomienda una rutina de revisión del hato',
  '¿Qué es la aglomeración inusual?',
]

const ANCHO = 384
const ALTO = 560

export function IaChatModal({ open, onClose }: Props) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      rol: 'assistant',
      contenido:
        'Hola, soy el asistente IA de VIGÍA. Puedo explicarte las alertas del hato, recomendarte rutinas de revisión o ayudarte a interpretar los patrones de actividad. ¿En qué te ayudo?',
    },
  ])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const ventanaRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => {
    if (typeof window === 'undefined') return null
    return {
      x: Math.max(16, window.innerWidth - ANCHO - 24),
      y: Math.max(16, window.innerHeight - ALTO - 24),
    }
  })
  const [arrastrando, setArrastrando] = useState(false)
  const arrastreRef = useRef<{ dx: number; dy: number } | null>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    listaRef.current?.scrollTo({
      top: listaRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [mensajes, cargando])

  // Cerrar con Escape.
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  function comenzarArrastre(e: React.PointerEvent) {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('button')) return
    const ventana = ventanaRef.current
    if (!ventana || pos === null) return
    const rect = ventana.getBoundingClientRect()
    arrastreRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
    e.currentTarget.setPointerCapture(e.pointerId)
    setArrastrando(true)
    e.preventDefault()
  }

  function mover(e: React.PointerEvent) {
    if (!arrastrando || !arrastreRef.current || pos === null) return
    const margin = 8
    const x = Math.min(
      Math.max(margin, e.clientX - arrastreRef.current.dx),
      window.innerWidth - ANCHO - margin,
    )
    const y = Math.min(
      Math.max(margin, e.clientY - arrastreRef.current.dy),
      window.innerHeight - ALTO - margin,
    )
    setPos({ x, y })
  }

  function terminarArrastre(e: React.PointerEvent) {
    if (arrastrando && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setArrastrando(false)
    arrastreRef.current = null
  }

  async function enviar(texto?: string) {
    const contenido = (texto ?? input).trim()
    if (!contenido || cargando) return
    const historial: MensajeChat[] = [...mensajes, { rol: 'user', contenido }]
    setMensajes(historial)
    setInput('')
    setError(null)
    setCargando(true)
    try {
      const respuesta = await charlarIa(historial)
      setMensajes((prev) => [
        ...prev,
        { rol: 'assistant', contenido: respuesta.respuesta },
      ])
    } catch {
      setError('No se pudo conectar con el asistente IA. Intenta nuevamente en unos segundos.')
    } finally {
      setCargando(false)
    }
  }

  if (!open) return null

  return (
    <div
      ref={ventanaRef}
      role="dialog"
      aria-modal="true"
      aria-label="Asistente IA de VIGÍA"
      className="animate-in fade-in zoom-in-95 fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      style={{
        width: ANCHO,
        height: ALTO,
        left: pos?.x,
        top: pos?.y,
        maxWidth: 'calc(100vw - 16px)',
        maxHeight: 'calc(100svh - 16px)',
        touchAction: arrastrando ? 'none' : undefined,
      }}
    >
      <header
        role="presentation"
        onPointerDown={comenzarArrastre}
        onPointerMove={mover}
        onPointerUp={terminarArrastre}
        onPointerCancel={terminarArrastre}
        className={`flex shrink-0 cursor-grab items-center gap-3 border-b border-slate-200 px-4 py-3 select-none ${
          arrastrando ? 'cursor-grabbing' : ''
        }`}
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white">
          <Bot className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            Asistente IA
            <span className="text-muted-foreground font-mono text-[10px]">
              gpt-oss-20b
            </span>
          </h2>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            Conectado al agente de monitoreo
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar chat"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </header>

      <div ref={listaRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.rol === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.rol === 'user'
                  ? 'bg-violet-600 text-white rounded-br-sm'
                  : 'bg-slate-100 text-slate-800 rounded-bl-sm'
              }`}
            >
              {m.rol === 'assistant' && (
                <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold tracking-wide text-violet-500 uppercase">
                  <Sparkles className="size-3" aria-hidden="true" />
                  VIGÍA IA
                </p>
              )}
              {m.contenido}
            </div>
          </div>
        ))}

        {cargando && (
          <div className="flex justify-start">
            <div className="bg-slate-100 flex items-center gap-2 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-slate-500">
              <LoaderCircle className="animate-spin size-4" aria-hidden="true" />
              Pensando…
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        )}

        {mensajes.length <= 1 && !cargando && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGERENCIAS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => enviar(s)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-violet-300 hover:text-violet-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-slate-200 p-3">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void enviar()
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            placeholder="Escribe tu pregunta al asistente…"
            className="min-h-11 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void enviar()
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || cargando}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendHorizonal className="size-4" aria-hidden="true" />
            <span className="sr-only">Enviar mensaje</span>
          </button>
        </form>
      </footer>
    </div>
  )
}