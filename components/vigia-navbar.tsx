'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Bot, ChevronDown, LogOut, Radio } from 'lucide-react'
import { IaChatModal } from '@/components/ia-chat-modal'
import { fetchMe, getAlertas, logout, type Usuario } from '@/lib/api'

const nav = [
  { href: '/', label: 'Dashboard' },
  { href: '/monitor', label: 'Monitor' },
  { href: '/alertas', label: 'Alertas' },
  { href: '/animales', label: 'Animales' },
  { href: '/eventos', label: 'Eventos' },
]

function iniciales(nombre: string): string {
  const partes = nombre
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return (partes.slice(0, 2) || 'VU').padEnd(2, 'V')
}

export function VigiaNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [pending, setPending] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)
  const [perfilOpen, setPerfilOpen] = useState(false)
  const perfilRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pathname === '/login') return
    void fetchMe().then((u) => setUsuario(u))
  }, [pathname])

  useEffect(() => {
    if (pathname === '/login') return
    const cargar = () => {
      getAlertas({ estado: 'pendiente', limit: 50 })
        .then((a) => setPending(a.length))
        .catch(() => {})
    }
    cargar()
    const id = setInterval(cargar, 30_000)
    return () => clearInterval(id)
  }, [pathname])

  useEffect(() => {
    if (!perfilOpen) return
    function onClick(e: MouseEvent) {
      if (perfilRef.current && !perfilRef.current.contains(e.target as Node)) {
        setPerfilOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [perfilOpen])

  if (pathname === '/login') {
    return null
  }

  const display = usuario?.email?.split('@')[0] ?? 'usuario'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-500 text-white shadow-sm shadow-emerald-950/40">
            <Radio className="size-4" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-black tracking-[0.2em] text-foreground">
              VIGÍA
            </span>
            <span className="mt-1 text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
              Vigilancia animal
            </span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="ml-4 hidden md:block">
          <ul className="flex items-center gap-1 rounded-full border border-border bg-muted/60 p-1 shadow-sm">
            {nav.map(({ href, label }) => {
              const active =
                href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex items-center rounded-full px-3.5 py-2 text-sm font-medium transition-all ${
                      active
                        ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                        : 'text-muted-foreground hover:bg-card hover:text-foreground'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="flex size-9 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-sm hover:border-emerald-500/40 hover:bg-emerald-500/20"
            aria-label="Abrir asistente IA"
          >
            <Bot className="size-4" aria-hidden="true" />
          </button>

          <Link
            href="/alertas"
            className="relative flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:border-emerald-500/40 hover:text-emerald-300"
          >
            <Bell className="size-4" aria-hidden="true" />
            {pending > 0 && (
              <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {pending}
              </span>
            )}
            <span className="sr-only">
              Alertas pendientes: {pending}
            </span>
          </Link>

          <div ref={perfilRef} className="relative">
            <button
              type="button"
              onClick={() => setPerfilOpen((o) => !o)}
              aria-expanded={perfilOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 text-sm font-medium text-foreground/90 shadow-sm hover:border-emerald-500/40 hover:text-emerald-300"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-800 to-teal-600 text-xs font-semibold text-white">
                {iniciales(display)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                  Ops
                </span>
                <span className="block max-w-[10rem] truncate text-xs font-semibold capitalize text-foreground/90">
                  {display}
                </span>
              </span>
              <ChevronDown
                className={`size-3.5 text-muted-foreground transition-transform ${perfilOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {perfilOpen && (
              <div
                role="menu"
                className="animate-in fade-in zoom-in-95 absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card p-1.5 shadow-xl"
              >
                <div className="border-b border-border/60 px-3 py-2.5">
                  <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Sesión iniciada
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                    {usuario?.email ?? 'Cargando…'}
                  </p>
                  <p className="text-xs text-muted-foreground">Rol: {usuario?.rol ?? 'operador'}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPerfilOpen(false)
                    void logout().finally(() => router.replace('/login'))
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/10"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav aria-label="Navegación principal móvil" className="border-t border-border md:hidden">
        <ul className="flex items-center gap-1 overflow-x-auto px-3 py-2">
          {nav.map(({ href, label }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`block rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                    active
                      ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
                      : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <IaChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </header>
  )
}