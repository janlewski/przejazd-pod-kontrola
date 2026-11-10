import { useId } from 'react'
import type { Evaluation } from '@/domain/evaluate'
import type { ViolationCount } from '@/domain/types'
import { formatDecimal, formatInt, formatMonth } from '@/lib/format'

const W = 560
const H = 220
const PAD = { top: 24, right: 12, bottom: 40, left: 36 }

/** Bars per month; transition month hatched; dashed lines show window means. */
export function BeforeAfterChart({
  violations,
  evaluation,
}: {
  violations: ViolationCount[]
  evaluation: Evaluation
}) {
  const id = useId()
  const sorted = [...violations].sort((a, b) => a.period.localeCompare(b.period))
  const max = Math.max(1, ...sorted.map((v) => v.count))
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const band = innerW / Math.max(1, sorted.length)
  const barW = Math.min(36, band * 0.7)
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH
  const ticks = [0, Math.round(max / 2), max]

  const phase = (p: string) =>
    p < evaluation.implementedPeriod ? 'before' : p > evaluation.implementedPeriod ? 'after' : 'transition'
  const indexOf = (p: string) => sorted.findIndex((v) => v.period === p)
  const span = (periods: ViolationCount[]): [number, number] | null =>
    periods.length
      ? [
          PAD.left + indexOf(periods[0]!.period) * band,
          PAD.left + (indexOf(periods.at(-1)!.period) + 1) * band,
        ]
      : null
  const beforeSpan = span(evaluation.before.periods)
  const afterSpan = span(evaluation.after.periods)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full max-w-[640px]"
      role="img"
      aria-labelledby={`${id}-t ${id}-d`}
    >
      <title id={`${id}-t`}>Naruszenia w miesiącach przed i po wdrożeniu (dane fikcyjne)</title>
      <desc id={`${id}-d`}>
        {`Średnio ${evaluation.before.meanPerPeriod === null ? 'brak' : formatDecimal(evaluation.before.meanPerPeriod)} przed i ${evaluation.after.meanPerPeriod === null ? 'brak' : formatDecimal(evaluation.after.meanPerPeriod)} po wdrożeniu. Szczegóły w tabeli obok.`}
      </desc>
      <defs>
        <pattern
          id={`${id}-hatch`}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="5" height="5" fill="#FFFFFF" />
          <line x1="0" y1="0" x2="0" y2="5" stroke="#1F2328" strokeWidth="1.5" />
        </pattern>
      </defs>

      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#D9D9D4" />
          <text
            x={PAD.left - 6}
            y={y(t) + 4}
            textAnchor="end"
            fontSize="10"
            fill="#545A61"
            className="tabular-nums"
          >
            {formatInt(t)}
          </text>
        </g>
      ))}

      {sorted.map((v, i) => {
        const ph = phase(v.period)
        const x = PAD.left + i * band + (band - barW) / 2
        const fill = ph === 'before' ? '#A9AAA4' : ph === 'after' ? '#1E3A5F' : `url(#${id}-hatch)`
        return (
          <g key={v.period}>
            <rect
              x={x}
              y={y(v.count)}
              width={barW}
              height={PAD.top + innerH - y(v.count)}
              fill={fill}
              stroke="#1F2328"
              strokeWidth="0.75"
            />
            <text x={x + barW / 2} y={y(v.count) - 4} textAnchor="middle" fontSize="10" fill="#1F2328">
              {formatInt(v.count)}
            </text>
            <text x={x + barW / 2} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="9" fill="#545A61">
              {formatMonth(v.period).replace(' ', '\u00a0')}
            </text>
          </g>
        )
      })}

      {beforeSpan && evaluation.before.meanPerPeriod !== null ? (
        <g>
          <line
            x1={beforeSpan[0]}
            x2={beforeSpan[1]}
            y1={y(evaluation.before.meanPerPeriod)}
            y2={y(evaluation.before.meanPerPeriod)}
            stroke="#1F2328"
            strokeDasharray="4 3"
          />
          <text x={beforeSpan[0] + 2} y={H - 6} fontSize="10" fill="#1F2328" fontWeight="600">
            PRZED
          </text>
        </g>
      ) : null}
      {afterSpan && evaluation.after.meanPerPeriod !== null ? (
        <g>
          <line
            x1={afterSpan[0]}
            x2={afterSpan[1]}
            y1={y(evaluation.after.meanPerPeriod)}
            y2={y(evaluation.after.meanPerPeriod)}
            stroke="#1F2328"
            strokeDasharray="4 3"
          />
          <text x={afterSpan[0] + 2} y={H - 6} fontSize="10" fill="#1F2328" fontWeight="600">
            PO
          </text>
        </g>
      ) : null}
      <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="#1F2328" />
    </svg>
  )
}
