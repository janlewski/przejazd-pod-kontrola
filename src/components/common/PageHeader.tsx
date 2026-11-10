import { useEffect, type ReactNode } from 'react'
import { TrackRule } from './TrackRule'

/**
 * Page title with a station plate (route number on the line diagram) and a track rule.
 */
export function PageHeader({
  title,
  station,
  description,
  actions,
  meta,
}: {
  title: string
  /** Two-digit station number matching the navigation line, e.g. "02". */
  station?: string
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
        <div className="flex items-start gap-3">
          {station ? (
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-sm border-2 border-foreground bg-card font-mono text-lg font-semibold tabular-nums"
            >
              {station}
            </span>
          ) : null}
          <div className="flex max-w-3xl flex-col gap-1">
            <h1 className="text-xl leading-tight font-semibold tracking-tight">{title}</h1>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            {meta ? <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <TrackRule />
    </header>
  )
}
