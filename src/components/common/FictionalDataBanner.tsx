import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function FictionalDataBanner({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div
      role="note"
      aria-label="Dane fikcyjne"
      className={cn('fictional-frame flex items-start gap-3 rounded-sm bg-card px-3 py-2', className)}
    >
      {/* One text line tall, so the badge centres on the first line even when the text wraps. */}
      <Badge variant="fictional" className="h-5 py-0 leading-none">
        Dane fikcyjne
      </Badge>
      <span className="text-sm leading-5">
        {children ?? 'Przykład działania, nie opis rzeczywistego przejazdu.'}
      </span>
    </div>
  )
}
