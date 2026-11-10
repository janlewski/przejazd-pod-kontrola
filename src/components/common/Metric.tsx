import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Metric({
  label,
  value,
  note,
  className,
}: {
  label: string
  value: ReactNode
  note?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1 border-t-2 border-foreground pt-2', className)}>
      <span className="text-xs tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="font-mono text-xl font-semibold tabular-nums">{value}</span>
      {note ? <span className="text-xs text-muted-foreground">{note}</span> : null}
    </div>
  )
}
