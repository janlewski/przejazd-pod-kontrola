import { useEffect, type ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  useEffect(() => {
    document.title = `${title} · Przejazd pod kontrolą`
  }, [title])
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
      <div className="flex max-w-3xl flex-col gap-1">
        <h1 className="text-lg font-semibold">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  )
}
