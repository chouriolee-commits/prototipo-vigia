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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-sm shadow-violet-200">
            <Radio className="size-4" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-black tracking-[0.2em] text-slate-900">
              VIGÍA
            </span>
            <span className="mt-1 text-[10px] font-medium tracking-[0.12em] text-slate-500 uppercase">
              Vigilancia animal
            </span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="ml-4 hidden md:block">
          <ul className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 p-1 shadow-sm">
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
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
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
            className="flex size-9 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-700 shadow-sm hover:border-violet-300 hover:bg-violet-100"
            aria-label="Abrir asistente IA"
          >
            <Bot className="size-4" aria-hidden="true" />
          </button>

          <Link
            href="/alertas"
            className="relative flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-violet-200 hover:text-violet-700"
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
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-violet-200 hover:text-violet-700"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-600 text-xs font-semibold text-white">
                {iniciales(display)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-[10px] tracking-[0.12em] text-slate-400 uppercase">
                  Ops
                </span>
                <span className="block max-w-[10rem] truncate text-xs font-semibold capitalize text-slate-700">
                  {display}
                </span>
              </span>
              <ChevronDown
                className={`size-3.5 text-slate-400 transition-transform ${perfilOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>

            {perfilOpen && (
              <div
                role="menu"
                className="animate-in fade-in zoom-in-95 absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
              >
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                    Sesión iniciada
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                    {usuario?.email ?? 'Cargando…'}
                  </p>
                  <p className="text-xs text-slate-500">Rol: {usuario?.rol ?? 'operador'}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPerfilOpen(false)
                    void logout().finally(() => router.replace('/login'))
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav aria-label="Navegación principal móvil" className="border-t border-slate-200 md:hidden">
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
                      ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-100'
                      : 'text-slate-600'
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