import { useId } from 'react'
import { cn } from '@/lib/utils'

/** Two rails on sleepers — the app's horizontal rule. Purely structural, hidden from AT. */
export function TrackRule({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  const id = useId()
  const ink = inverted ? '#FAFAF7' : '#1F2328'
  return (
    <svg aria-hidden className={cn('block h-3 w-full', className)} preserveAspectRatio="none">
      <defs>
        <pattern id={`${id}-sleepers`} width="10" height="12" patternUnits="userSpaceOnUse">
          <rect x="3" y="1" width="3" height="10" fill={ink} opacity="0.35" />
        </pattern>
      </defs>
      <rect width="100%" height="12" fill={`url(#${id}-sleepers)`} />
      <rect y="3" width="100%" height="1.5" fill={ink} />
      <rect y="7.5" width="100%" height="1.5" fill={ink} />
    </svg>
  )
}
