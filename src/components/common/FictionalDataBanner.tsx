import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function FictionalDataBanner({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div
      role="note"
      aria-label="Dane fikcyjne"
      className={cn(
        'fictional-frame flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-sm bg-card px-3 py-2',
        className,
      )}
    >
      <strong className="font-mono text-xs tracking-wider uppercase">Dane fikcyjne</strong>
      <span className="text-sm">{children ?? 'Przykład działania, nie opis rzeczywistego przejazdu.'}</span>
    </div>
  )
}
