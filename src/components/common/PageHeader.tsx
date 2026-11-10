import { useEffect, type ReactNode } from 'react'
import { TrackRule } from './TrackRule'

/** Page title with a track rule underneath. */
export function PageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}) {
  useEffect(() => {
    document.title = `${title} · Przejazd pod kontrolą`
  }, [title])
  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex max-w-3xl flex-col gap-1">
          <h1 tabIndex={-1} className="text-xl leading-tight font-semibold tracking-tight text-balance">
            {title}
          </h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          {meta ? <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <TrackRule />
    </header>
  )
}
