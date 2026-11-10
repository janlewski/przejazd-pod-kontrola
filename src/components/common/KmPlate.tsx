import { parseCrossingNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Line and kilometre read from the 9-digit crossing number, drawn as a two-part plate:
 * line number on black, kilometre on white.
 */
export function KmPlate({ name, className }: { name: string; className?: string }) {
  const parsed = parseCrossingNumber(name)
  if (!parsed) return null
  return (
    <span
      className={cn(
        'inline-flex h-5 items-stretch overflow-hidden rounded-sm border border-foreground font-mono text-[11px] leading-none tabular-nums',
        className,
      )}
      title={`Linia ${parsed.line}, kilometr ${parsed.km}`}
    >
      <span className="flex items-center bg-foreground px-1.5 font-semibold text-background">
        <span className="sr-only">linia </span>
        {parsed.line}
      </span>
      <span className="flex items-center bg-card px-1.5">
        <span aria-hidden className="mr-1 text-muted-foreground">
          km
        </span>
        <span className="sr-only">kilometr </span>
        {parsed.km}
      </span>
    </span>
  )
}
