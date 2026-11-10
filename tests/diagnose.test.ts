import { describe, expect, it } from 'vitest'
import { countermeasures } from '@/data/rules/countermeasures'
import { categoryFit, diagnose, EVIDENCE_ORDER } from '@/domain/diagnose'
import { baseCase, getCase, loadCases } from './helpers'

describe('diagnose', () => {
  it('X1 → C-DRIVE-AROUND → first countermeasure CM-MEDIAN or CM-4Q', () => {
    const d = diagnose(getCase('X1'))
    expect(d.causes.map((c) => c.cause.id)).toEqual(['C-DRIVE-AROUND'])
    expect(['CM-MEDIAN', 'CM-4Q']).toContain(d.countermeasures[0]!.countermeasure.id)
  })

  it('ranking is by evidence first (never by a summed score)', () => {
    for (const c of loadCases()) {
      const ranks = diagnose(c).countermeasures.map((r) => EVIDENCE_ORDER[r.countermeasure.evidence])
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    }
  })

  it('category fit breaks ties within the same evidence strength', () => {
    const d = diagnose(
      baseCase({
        category: 'C',
        observations: [
          { symptomId: 'S-DRIVE-AROUND', observedAt: '2026-01-01', note: 'x' },
          { symptomId: 'S-RED-IGN', observedAt: '2026-01-02', note: 'y' },
        ],
      }),
    )
    const strong = d.countermeasures.filter((r) => r.countermeasure.evidence === 'strong')
    expect(strong.map((r) => r.countermeasure.id)).toEqual(['CM-GATES', 'CM-MEDIAN', 'CM-4Q'])
    expect(strong[0]!.categoryFit).toBe('fit')
    expect(strong[1]!.reasons.map((r) => r.code)).toContain('R-CATEGORY-NOT-LISTED')
  })

  it('symptom with two causes merges observations per cause', () => {
    const d = diagnose(getCase('X8'))
    const ids = d.causes.map((c) => c.cause.id).sort()
    expect(ids).toEqual(['C-QUEUE-SPILLBACK', 'C-TRAPPED'])
    const queue = d.causes.find((c) => c.cause.id === 'C-QUEUE-SPILLBACK')!
    expect(queue.evidence.map((e) => e.symptom.id).sort()).toEqual(['S-QUEUE', 'S-TRAPPED'])
    expect(d.countermeasures[0]!.countermeasure.id).toBe('CM-QUEUE')
  })

  it('repeated symptom observations are grouped', () => {
    const d = diagnose(getCase('X2'))
    expect(d.causes[0]!.evidence[0]!.observations).toHaveLength(2)
  })

  it('reports an evidence gap when only unproven measures remain (X4, X9)', () => {
    for (const id of ['X4', 'X9']) {
      expect(diagnose(getCase(id)).reasons.map((r) => r.code)).toContain('D-EVIDENCE-GAP')
    }
  })

  it('no symptoms → no diagnosis, with a reason', () => {
    const d = diagnose(getCase('X10'))
    expect(d.causes).toHaveLength(0)
    expect(d.countermeasures).toHaveLength(0)
    expect(d.reasons[0]!.code).toBe('D-NO-SYMPTOMS')
  })

  it('unknown symptoms are reported, not silently dropped', () => {
    const d = diagnose(
      baseCase({ observations: [{ symptomId: 'S-NOPE', observedAt: '2026-01-01', note: 'x' }] }),
    )
    expect(d.reasons.map((r) => r.code)).toContain('D-UNKNOWN-SYMPTOM')
  })

  it('unknown category → fit "unknown" with a reason', () => {
    const d = diagnose(
      baseCase({
        category: null,
        observations: [{ symptomId: 'S-DRIVE-AROUND', observedAt: '2026-01-01', note: 'x' }],
      }),
    )
    expect(d.countermeasures.every((r) => r.categoryFit === 'unknown')).toBe(true)
    expect(d.countermeasures[0]!.reasons.map((r) => r.code)).toContain('R-CATEGORY-UNKNOWN')
  })

  it('X7 → closure', () => {
    expect(diagnose(getCase('X7')).countermeasures[0]!.countermeasure.id).toBe('CM-CLOSE')
  })

  it('categoryFit', () => {
    const median = countermeasures.find((c) => c.id === 'CM-MEDIAN')!
    expect(categoryFit(median, 'B')).toBe('fit')
    expect(categoryFit(median, 'D')).toBe('not_listed')
    expect(categoryFit(median, null)).toBe('unknown')
  })
})
