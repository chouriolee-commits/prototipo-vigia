type Props = {
  title: string
  subtitle: string
  meta?: string
  children: React.ReactNode
}

export function PageShell({ title, subtitle, meta, children }: Props) {
  return (
    <main className="flex w-full flex-1 flex-col">
      <header className="border-border flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 lg:px-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        </div>
        {meta && (
          <p className="text-muted-foreground hidden font-mono text-xs sm:block">
            {meta}
          </p>
        )}
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">{children}</div>
    </main>
  )
}
