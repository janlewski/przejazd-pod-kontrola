import type { ReactNode } from 'react'
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

function Tag({ className, title, children }: { className?: string; title?: string; children: ReactNode }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1 rounded-sm border px-1.5 font-mono text-xs leading-none font-medium whitespace-nowrap tabular-nums',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Shape encodes the level as well as colour: triangle P1, diamond P2, circle P3, dash n/a. */
export function PriorityShape({ level }: { level: InspectionLevel | null }) {
  const common = { width: 10, height: 10, viewBox: '0 0 10 10', 'aria-hidden': true } as const
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
        <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  return (
    <svg {...common}>
      <path d="M1 5h8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function PriorityBadge({ level }: { level: InspectionLevel | null }) {
  const styles: Record<InspectionLevel, string> = {
    P1: 'border-signal bg-signal text-signal-foreground',
    P2: 'border-warning bg-warning text-warning-foreground',
    P3: 'border-line-strong bg-card text-foreground',
  }
  if (level === null) {
    return (
      <Tag className="border-dashed border-line-strong text-muted-foreground" title={NOT_ASSESSED_LABEL}>
        <PriorityShape level={null} />
        <span>
          brak oceny<span className="sr-only"> — {NOT_ASSESSED_LABEL}</span>
        </span>
      </Tag>
    )
  }
  return (
    <Tag className={styles[level]} title={INSPECTION_LABEL[level]}>
      <PriorityShape level={level} />
      {level}
      <span className="sr-only"> — {INSPECTION_LABEL[level]}</span>
    </Tag>
  )
}

export function VerificationBadge({ level }: { level: VerificationLevel }) {
  const styles: Record<VerificationLevel, string> = {
    V1: 'border-foreground bg-foreground text-background',
    V2: 'border-foreground text-foreground',
    V3: 'border-line-strong text-muted-foreground',
  }
  return (
    <Tag className={styles[level]} title={VERIFICATION_LABEL[level]}>
      {level}
      <span className="sr-only"> — {VERIFICATION_LABEL[level]}</span>
    </Tag>
  )
}

/** Styled like a small plate with the category letter. */
export function CategoryBadge({ category }: { category: Category | null }) {
  if (category === null) {
    return (
      <Tag className="border-dashed border-line-strong text-muted-foreground" title="Brak kategorii w danych">
        ?<span className="sr-only">brak kategorii</span>
      </Tag>
    )
  }
  return (
    <span
      title={CATEGORY_LABEL[category]}
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm border-2 border-foreground bg-card font-mono text-xs leading-none font-semibold"
    >
      {category}
      <span className="sr-only"> — {CATEGORY_LABEL[category]}</span>
    </span>
  )
}

export function EvidenceBadge({ evidence }: { evidence: EvidenceStrength }) {
  const bars: Record<EvidenceStrength, number> = { strong: 3, moderate: 2, weak: 1, none: 0 }
  return (
    <Tag className="border-line-strong text-foreground" title={EVIDENCE_DESCRIPTION[evidence]}>
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
      <span className="font-sans">Dowód: {EVIDENCE_LABEL[evidence].toLowerCase()}</span>
    </Tag>
  )
}

export function OriginBadge({ origin }: { origin: 'real' | 'fictional' | 'derived' }) {
  if (origin === 'fictional') {
    return (
      <Tag
        className="fictional-frame bg-card font-sans tracking-wide text-foreground uppercase"
        title="Dane fikcyjne — przykład działania"
      >
        Dane fikcyjne
      </Tag>
    )
  }
  return (
    <Tag
      className="border-line-strong font-sans text-muted-foreground"
      title={origin === 'real' ? 'Dane realne z publicznego źródła' : 'Dane pochodne (opracowanie własne)'}
    >
      {origin === 'real' ? 'Realne' : 'Pochodne'}
    </Tag>
  )
}

export function ResponsiblePartyBadge({ party }: { party: ResponsibleParty }) {
  return (
    <Tag className="border-line-strong font-sans text-foreground" title={RESPONSIBLE_LABEL[party]}>
      {RESPONSIBLE_SHORT[party]}
    </Tag>
  )
}
