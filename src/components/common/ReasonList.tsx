import type { Reason } from '@/domain/types'
import { SourceFootnote } from './SourceFootnote'

export function ReasonList({ reasons }: { reasons: Reason[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {reasons.map((r, i) => (
        <li key={`${r.code}-${i}`} className="grid grid-cols-[auto_1fr] gap-x-2 text-sm">
          <code className="mt-0.5 font-mono text-[11px] text-muted-foreground">{r.code}</code>
          <span>
            {r.textPl}
            {r.sourceId ? (
              <>
                {' '}
                <SourceFootnote sourceId={r.sourceId} />
              </>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  )
}
