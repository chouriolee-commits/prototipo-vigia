'use client'

import { useEffect, useState } from 'react'
import { PageShell } from '@/components/page-shell'
import { getAnimales, type Animal } from '@/lib/api'

const SEXO_LABEL: Record<string, string> = {
  macho: 'Macho',
  hembra: 'Hembra',
  desconocido: 'Sin dato',
}

const ESPECIE_LABEL: Record<string, string> = {
  bovino: 'Bovino',
  equino: 'Equino',
  ovino: 'Ovino',
  otro: 'Otro',
}

export function AnimalesContent() {
  const [animales, setAnimales] = useState<Animal[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    getAnimales()
      .then((data) => {
        if (activo) setAnimales(data)
      })
      .catch(() => {
        if (activo) setError('No se pudieron cargar los animales.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  return (
    <PageShell
      title="Animales"
      subtitle="Inventario de animales registrados en el sistema"
      meta={`${animales.length} registrados`}
    >
      {cargando ? (
        <p className="py-10 text-center text-sm text-slate-500">Cargando animales…</p>
      ) : error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700">
          {error}
        </p>
      ) : (
        <section className="bg-card border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="text-muted-foreground border-border border-b text-left text-[11px] tracking-wide uppercase">
                <th className="px-5 py-2.5 font-medium">ID</th>
                <th className="px-5 py-2.5 font-medium">Identificador</th>
                <th className="px-5 py-2.5 font-medium">Especie</th>
                <th className="px-5 py-2.5 font-medium">Sexo</th>
                <th className="px-5 py-2.5 font-medium">Registro</th>
                <th className="px-5 py-2.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {animales.map((animal) => (
                <tr key={animal.id} className="hover:bg-secondary/40">
                  <td className="text-muted-foreground px-5 py-3 font-mono text-xs">
                    {animal.id}
                  </td>
                  <td className="px-5 py-3 font-medium">{animal.identificador}</td>
                  <td className="text-muted-foreground px-5 py-3">
                    {ESPECIE_LABEL[animal.especie] ?? animal.especie}
                  </td>
                  <td className="text-muted-foreground px-5 py-3">
                    {SEXO_LABEL[animal.sexo] ?? animal.sexo}
                  </td>
                  <td className="text-muted-foreground px-5 py-3 font-mono text-xs">
                    {animal.fecha_registro}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
                        animal.activo
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-100 text-slate-500'
                      }`}
                    >
                      {animal.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
              {animales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">
                    Sin animales registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </PageShell>
  )
}