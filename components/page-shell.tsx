type Props = {
  title: string
  subtitle: string
  meta?: string
  children: React.ReactNode
}

export function PageShell({ title, subtitle, meta, children }: Props) {
  return (
    <main className="flex w-full flex-1 flex-col">
      <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-4 backdrop-blur-sm lg:px-6">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            VIGÍA
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {meta && (
          <div className="hidden rounded-full border border-border bg-muted/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground sm:block">
            {meta}
          </div>
        )}
      </header>
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 p-4 lg:p-6">
        {children}
      </div>
    </main>
  )
}
