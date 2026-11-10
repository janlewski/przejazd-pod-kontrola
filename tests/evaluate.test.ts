import { describe, expect, it } from 'vitest'
import { BASE_CAVEATS, evaluateBeforeAfter } from '@/domain/evaluate'
import { getCase, loadCases } from './helpers'

const BASE_CODES = ['C-REGRESSION', 'C-SHORT-WINDOW', 'C-SMALL-NUMBERS', 'C-SEASONALITY', 'C-NO-CONTROL']

describe('evaluateBeforeAfter', () => {
  it('always returns all five base caveats', () => {
    expect(BASE_CAVEATS.map((c) => c.code)).toEqual(BASE_CODES)
    for (const c of loadCases()) {
      const e = evaluateBeforeAfter(c.violations, c.evaluation?.implementedAt ?? '2026-06-01')
      expect(e.caveats.map((x) => x.code)).toEqual(expect.arrayContaining(BASE_CODES))
    }
    expect(evaluateBeforeAfter([], '2026-01-01').caveats.length).toBeGreaterThanOrEqual(5)
  })

  it('X1: excludes the implementation month and compares monthly means', () => {
    const x1 = getCase('X1')
    const e = evaluateBeforeAfter(x1.violations, x1.evaluation!.implementedAt)
    expect(e.implementedPeriod).toBe('2026-06')
    expect(e.before.periods.map((p) => p.period)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
    ])
    expect(e.after.periods.map((p) => p.period)).toEqual(['2026-07', '2026-08', '2026-09', '2026-10'])
    expect(e.before.total).toBe(104)
    expect(e.after.total).toBe(30)
    expect(e.before.meanPerPeriod).toBeCloseTo(20.8)
    expect(e.after.meanPerPeriod).toBeCloseTo(7.5)
    expect(e.absoluteChange).toBeCloseTo(-13.3)
    expect(e.relativeChange).toBeCloseTo(-13.3 / 20.8)
    expect(e.caveats.map((c) => c.code)).toContain('C-UNEQUAL-WINDOWS')
    expect(e.reasons.map((r) => r.code)).toEqual(['E-TRANSITION', 'E-MEANS'])
  })

  it('X6: flags a change of counting method', () => {
    const x6 = getCase('X6')
    const e = evaluateBeforeAfter(x6.violations, x6.evaluation!.implementedAt)
    expect(e.caveats.map((c) => c.code)).toContain('C-METHOD-CHANGE')
  })

  it('empty window → no change computed, with a reason', () => {
    const e = evaluateBeforeAfter([{ period: '2026-08', count: 4, method: 'm' }], '2026-06-01')
    expect(e.absoluteChange).toBeNull()
    expect(e.relativeChange).toBeNull()
    expect(e.reasons.map((r) => r.code)).toContain('E-EMPTY-WINDOW')
  })

  it('zero before → relative change undefined, absolute still computed', () => {
    const e = evaluateBeforeAfter(
      [
        { period: '2026-01', count: 0, method: 'm' },
        { period: '2026-03', count: 2, method: 'm' },
      ],
      '2026-02-10',
    )
    expect(e.absoluteChange).toBe(2)
    expect(e.relativeChange).toBeNull()
  })
})
