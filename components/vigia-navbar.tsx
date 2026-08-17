'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Radio } from 'lucide-react'

const nav = [
  { href: '/', label: 'Dashboard' },
  { href: '/monitor', label: 'Monitor' },
  { href: '/alertas', label: 'Alertas' },
  { href: '/animales', label: 'Animales' },
  { href: '/eventos', label: 'Eventos' },
]

export function VigiaNavbar() {
  const pathname = usePathname()

  if (pathname === '/login') {
    return null
  }

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
          <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-emerald-700 sm:inline-flex">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            SISTEMA ACTIVO
          </span>

          <Link
            href="/alertas"
            className="relative flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-violet-200 hover:text-violet-700"
          >
            <Bell className="size-4" aria-hidden="true" />
            <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              3
            </span>
            <span className="sr-only">Alertas pendientes: 3</span>
          </Link>

          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-violet-200 hover:text-violet-700"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-600 text-xs font-semibold text-white">
              JR
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-[10px] tracking-[0.12em] text-slate-400 uppercase">
                Ops
              </span>
              <span className="block text-xs font-semibold text-slate-700">
                Javier
              </span>
            </span>
          </button>
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
    </header>
  )
}
