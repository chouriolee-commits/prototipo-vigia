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

  return (
    <header className="bg-sidebar border-border sticky top-0 z-40 w-full border-b">
      <div className="flex h-14 w-full items-center gap-4 px-4 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
            <Radio className="size-4" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-[0.18em]">VIGÍA</span>
            <span className="text-muted-foreground text-[10px]">
              Vigilancia Animal
            </span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="ml-2 hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map(({ href, label }) => {
              const active =
                href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex h-14 items-center px-3 text-sm transition-colors ${
                      active
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                    {active && (
                      <span className="bg-primary absolute inset-x-2 bottom-0 h-0.5 rounded-full" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="border-primary/30 bg-primary/10 text-primary hidden items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] sm:inline-flex">
            <span className="bg-primary size-1.5 animate-pulse rounded-full" />
            SISTEMA ACTIVO
          </span>
          <Link
            href="/alertas"
            className="text-muted-foreground hover:bg-secondary hover:text-foreground relative flex size-9 items-center justify-center rounded-full transition-colors"
          >
            <Bell className="size-4" aria-hidden="true" />
            <span className="bg-destructive text-destructive-foreground absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[9px] font-bold">
              3
            </span>
            <span className="sr-only">Alertas pendientes: 3</span>
          </Link>
          <span className="bg-secondary text-foreground flex size-9 items-center justify-center rounded-full font-mono text-xs font-semibold">
            JR
          </span>
        </div>
      </div>

      {/* Navegación en pantallas pequeñas */}
      <nav
        aria-label="Navegación principal móvil"
        className="border-border border-t md:hidden"
      >
        <ul className="flex items-center gap-1 overflow-x-auto px-3 py-2">
          {nav.map(({ href, label }) => {
            const active =
              href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`block rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-secondary text-foreground font-medium'
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
    </header>
  )
}
