import type { ReactNode } from 'react'
import { PriorityBadge, VerificationBadge } from '@/components/common/badges'
import { ReasonList } from '@/components/common/ReasonList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TRAFFIC_PRODUCT_B, TRAFFIC_PRODUCT_C } from '@/config/thresholds'
import type { Assessment } from '@/domain/assess'
import { formatInt, formatOrMissing } from '@/lib/format'
import { INSPECTION_LABEL, NOT_ASSESSED_LABEL, VERIFICATION_LABEL } from '@/lib/labels'

function Panel({
  index,
  title,
  accent = 'border-t-foreground',
  children,
}: {
  index: string
  title: string
  accent?: string
  children: ReactNode
}) {
  return (
    <Card role="region" aria-label={title} className={cn('gap-3 border-t-4 py-3', accent)}>
      <CardHeader className="px-3">
        <span className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
          Wynik {index} z 3
        </span>
        <CardTitle className="text-base">
          <h2>{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-3">{children}</CardContent>
    </Card>
  )
}

const INSPECTION_ACCENT = { P1: 'border-t-signal', P2: 'border-t-warning', P3: 'border-t-ok' } as const

export function AssessmentPanels({ assessment, fictional }: { assessment: Assessment; fictional: boolean }) {
  const { inspection, verification, exposure } = assessment
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Panel
        index="1"
        title="Priorytet kontroli"
        accent={inspection.level ? INSPECTION_ACCENT[inspection.level] : 'border-t-line-strong'}
      >
        <div className="flex items-center gap-2">
          <PriorityBadge level={inspection.level} />
          <span className="text-sm">
            {inspection.level ? INSPECTION_LABEL[inspection.level] : NOT_ASSESSED_LABEL}
          </span>
        </div>
        <ReasonList reasons={inspection.reasons} />
      </Panel>

      <Panel index="2" title="Priorytet weryfikacji danych">
        <div className="flex items-center gap-2">
          <VerificationBadge level={verification.level} />
          <span className="text-sm">{VERIFICATION_LABEL[verification.level]}</span>
        </div>
        {verification.missing.length > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Do uzupełnienia lub sprawdzenia</span>
            <ul className="flex flex-wrap gap-1">
              {verification.missing.map((m) => (
                <li
                  key={m}
                  className="rounded-sm border border-dashed border-foreground px-1.5 py-0.5 text-xs"
                >
                  {m}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <ReasonList reasons={verification.reasons} />
      </Panel>

      <Panel index="3" title="Kontekst ekspozycji">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Ruch drogowy</dt>
          <dd className="font-mono tabular-nums">
            {exposure.roadAadt === null ? 'brak danych' : `${formatInt(exposure.roadAadt)} poj./dobę`}
            {fictional && exposure.roadAadt !== null ? ' (fikcyjne)' : ''}
          </dd>
          <dt className="text-muted-foreground">Pociągi na dobę</dt>
          <dd className="font-mono tabular-nums">
            {formatOrMissing(exposure.trainsPerDay)}
            {fictional && exposure.trainsPerDay !== null ? ' (fikcyjne)' : ''}
          </dd>
          <dt className="text-muted-foreground">Iloczyn ruchu</dt>
          <dd className="font-mono tabular-nums">
            {formatOrMissing(exposure.trafficProduct, 'nie do obliczenia')}
          </dd>
          <dt className="text-muted-foreground">Progi (Dz.U.)</dt>
          <dd className="font-mono tabular-nums">
            {formatInt(TRAFFIC_PRODUCT_C)} · {formatInt(TRAFFIC_PRODUCT_B)}
          </dd>
        </dl>
        {exposure.regulatoryNote ? (
          <div role="note" className="rounded-sm border-l-4 border-foreground bg-muted px-3 py-2 text-sm">
            <span className="block text-xs font-semibold tracking-wide uppercase">Notatka regulacyjna</span>
            {exposure.regulatoryNote}
          </div>
        ) : null}
        <ReasonList reasons={exposure.reasons} />
      </Panel>
    </div>
  )
}
