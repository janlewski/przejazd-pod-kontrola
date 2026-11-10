import { Badge } from '@/components/ui/badge'
import type {
  Category,
  EvidenceStrength,
  InspectionLevel,
  ResponsibleParty,
  VerificationLevel,
} from '@/domain/types'
import {
  CATEGORY_LABEL,
  EVIDENCE_DESCRIPTION,
  EVIDENCE_LABEL,
  INSPECTION_LABEL,
  NOT_ASSESSED_LABEL,
  RESPONSIBLE_LABEL,
  RESPONSIBLE_SHORT,
  VERIFICATION_LABEL,
} from '@/lib/labels'
import { cn } from '@/lib/utils'

/** Shape encodes the level as well as colour: triangle P1, diamond P2, circle P3, dash n/a. */
export function PriorityShape({ level, size = 10 }: { level: InspectionLevel | null; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 10 10', 'aria-hidden': true } as const
  if (level === 'P1')
    return (
      <svg {...common}>
        <path d="M5 0.5 9.5 9.5H0.5Z" fill="currentColor" />
      </svg>
    )
  if (level === 'P2')
    return (
      <svg {...common}>
        <path d="M5 0.5 9.5 5 5 9.5 0.5 5Z" fill="currentColor" />
      </svg>
    )
  if (level === 'P3')
    return (
      <svg {...common}>
        <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  return (
    <svg {...common}>
      <path d="M1 5h8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function PriorityBadge({ level }: { level: InspectionLevel | null }) {
  const variant = level === null ? 'unassessed' : (level.toLowerCase() as 'p1' | 'p2' | 'p3')
  const label = level === null ? NOT_ASSESSED_LABEL : INSPECTION_LABEL[level]
  return (
    <Badge variant={variant} title={label}>
      <PriorityShape level={level} />
      {level ?? 'brak oceny'}
      <span className="sr-only"> — {label}</span>
    </Badge>
  )
}

export function VerificationBadge({ level }: { level: VerificationLevel }) {
  return (
    <Badge variant={level.toLowerCase() as 'v1' | 'v2' | 'v3'} title={VERIFICATION_LABEL[level]}>
      {level}
      <span className="sr-only"> — {VERIFICATION_LABEL[level]}</span>
    </Badge>
  )
}

/** A small square plate with the category letter, like the crossing's metric plate. */
export function CategoryBadge({ category }: { category: Category | null }) {
  const label = category ? CATEGORY_LABEL[category] : 'Brak kategorii w danych'
  return (
    <Badge variant="plate" title={label} className={cn(!category && 'border-dashed text-muted-foreground')}>
      {category ?? '?'}
      <span className="sr-only"> — {label}</span>
    </Badge>
  )
}

export function EvidenceBadge({ evidence }: { evidence: EvidenceStrength }) {
  const bars: Record<EvidenceStrength, number> = { strong: 3, moderate: 2, weak: 1, none: 0 }
  return (
    <Badge variant="quiet" title={EVIDENCE_DESCRIPTION[evidence]}>
      <span aria-hidden className="flex items-end gap-px">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'w-[3px] border border-foreground',
              i <= bars[evidence] ? 'bg-foreground' : 'bg-transparent',
            )}
            style={{ height: 3 + i * 2 }}
          />
        ))}
      </span>
      Dowód: {EVIDENCE_LABEL[evidence].toLowerCase()}
    </Badge>
  )
}

export function OriginBadge({ origin }: { origin: 'real' | 'fictional' | 'derived' }) {
  if (origin === 'fictional') {
    return (
      <Badge variant="fictional" title="Dane fikcyjne — przykład działania">
        Dane fikcyjne
      </Badge>
    )
  }
  return (
    <Badge
      variant="quiet"
      className="text-muted-foreground"
      title={origin === 'real' ? 'Dane realne z publicznego źródła' : 'Dane pochodne (opracowanie własne)'}
    >
      {origin === 'real' ? 'Realne' : 'Pochodne'}
    </Badge>
  )
}

export function ResponsiblePartyBadge({ party }: { party: ResponsibleParty }) {
  return (
    <Badge variant="quiet" title={RESPONSIBLE_LABEL[party]}>
      {RESPONSIBLE_SHORT[party]}
    </Badge>
  )
}
