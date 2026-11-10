import { describe, expect, it } from 'vitest'
import { DEMO_AS_OF } from '@/config/demo'
import {
  computeDataVerificationPriority,
  computeExposureContext,
  computeInspectionPriority,
  inspectionSortKey,
  regulatoryNoteFor,
  type Subject,
} from '@/domain/priority'
import type { Crossing, FictionalCase, GprMatch } from '@/domain/types'
import { baseCase, getCase, loadCases } from './helpers'

const asCase = (record: FictionalCase): Subject => ({ kind: 'case', record })

const crossing: Crossing = {
  id: 'PKP_PLK.1',
  name: '231 008 414',
  category: 'D',
  locationType: 'szlakowy',
  unit: 'PKP PLK GDAŃSK',
  lat: 52.703172,
  lon: 18.286864,
  origin: 'real',
  sourceId: 'gugik-wfs-przejazdy',
}

const gpr = (overrides: Partial<GprMatch> = {}): GprMatch => ({
  crossingId: crossing.id,
  roadNumber: '15',
  segmentName: 'A – B',
  aadt: 4000,
  distanceM: 10,
  confidence: 'high',
  origin: 'derived',
  sourceId: 'derived-gpr-match',
  ...overrides,
})

const nullable = ['roadAadt', 'trainsPerDay', 'lastInspectionAt', 'trafficMeasuredAt', 'category'] as const

describe('inspection priority', () => {
  it('missing AADT never lowers inspection priority (every case, every nullable field)', () => {
    for (const c of loadCases()) {
      const original = inspectionSortKey(computeInspectionPriority(asCase(c)).level)
      for (const field of nullable) {
        const degraded = { ...c, [field]: null } as FictionalCase
        const level = inspectionSortKey(computeInspectionPriority(asCase(degraded)).level)
        expect(level, `${c.id} without ${field}`).toBeLessThanOrEqual(original)
      }
    }
  })

  it('missing inspection data floors priority at P2', () => {
    const r = computeInspectionPriority(asCase(baseCase({ lastInspectionAt: null })))
    expect(r.level).toBe('P2')
    expect(r.reasons.map((x) => x.code)).toContain('I-NO-INSPECTION')
  })

  it('high-severity symptom gives P1 with a reason', () => {
    const r = computeInspectionPriority(asCase(getCase('X1')))
    expect(r.level).toBe('P1')
    expect(r.reasons.some((x) => x.code === 'I-SYMPTOM-HIGH')).toBe(true)
  })

  it('medium symptom gives P2; unknown symptom is not ignored', () => {
    expect(computeInspectionPriority(asCase(getCase('X7'))).level).toBe('P2')
    const unknown = baseCase({
      observations: [{ symptomId: 'S-NOPE', observedAt: '2026-01-01', note: 'x' }],
    })
    const r = computeInspectionPriority(asCase(unknown))
    expect(r.level).toBe('P2')
    expect(r.reasons[0]!.code).toBe('I-UNKNOWN-SYMPTOM')
  })

  it('violations raise to at least P2; zero counts do not', () => {
    const withViolations = baseCase({
      violations: [{ period: '2026-01', count: 3, method: 'm' }],
    })
    expect(computeInspectionPriority(asCase(withViolations)).level).toBe('P2')
    expect(computeInspectionPriority(asCase(getCase('X10'))).level).toBe('P3')
  })

  it('a clean, inspected case is P3 and says why', () => {
    const r = computeInspectionPriority(asCase(baseCase()))
    expect(r.level).toBe('P3')
    expect(r.reasons[0]!.code).toBe('I-CLEAR')
  })

  it('real crossings without records are "not assessed", ranked above P3', () => {
    const r = computeInspectionPriority({ kind: 'crossing', record: crossing, gpr: null })
    expect(r.level).toBeNull()
    expect(r.reasons[0]!.textPl).toMatch(/nie oznacza to niskiego/i)
    expect(inspectionSortKey(null)).toBeLessThan(inspectionSortKey('P3'))
    expect(inspectionSortKey(null)).toBeGreaterThan(inspectionSortKey('P2'))
  })

  it('every result carries reasons', () => {
    for (const c of loadCases()) {
      expect(computeInspectionPriority(asCase(c)).reasons.length).toBeGreaterThan(0)
      expect(computeDataVerificationPriority(asCase(c), DEMO_AS_OF).reasons.length).toBeGreaterThan(0)
      expect(computeExposureContext(asCase(c)).reasons.length).toBeGreaterThan(0)
    }
  })
})

describe('data verification priority', () => {
  it('missing AADT → V1', () => {
    const r = computeDataVerificationPriority(asCase(baseCase({ roadAadt: null })), DEMO_AS_OF)
    expect(r.level).toBe('V1')
    expect(r.missing).toContain('ruch drogowy (SDRR)')
  })

  it('X5 (no traffic, no inspection) → V1; complete X10 → V3', () => {
    expect(computeDataVerificationPriority(asCase(getCase('X5')), DEMO_AS_OF).level).toBe('V1')
    const x10 = computeDataVerificationPriority(asCase(getCase('X10')), DEMO_AS_OF)
    expect(x10.level).toBe('V3')
    expect(x10.reasons[0]!.code).toBe('V-COMPLETE')
  })

  it('missing data never lowers verification priority either', () => {
    const rank = { V1: 1, V2: 2, V3: 3 }
    for (const c of loadCases()) {
      const original = rank[computeDataVerificationPriority(asCase(c), DEMO_AS_OF).level]
      for (const field of nullable) {
        const degraded = { ...c, [field]: null } as FictionalCase
        const level = rank[computeDataVerificationPriority(asCase(degraded), DEMO_AS_OF).level]
        expect(level, `${c.id} without ${field}`).toBeLessThanOrEqual(original)
      }
    }
  })

  it('outdated traffic count is flagged using zał. nr 1 intervals', () => {
    // X3: category D, product 24 200 (20 000–40 000) → 2 years; counted 2023-09-13.
    const x3 = computeDataVerificationPriority(asCase(getCase('X3')), DEMO_AS_OF)
    expect(x3.level).toBe('V2')
    expect(x3.reasons.map((r) => r.code)).toContain('V-COUNT-OUTDATED')
    // Category B: 5 years.
    const b = computeDataVerificationPriority(
      asCase(baseCase({ trafficMeasuredAt: '2022-01-01' })),
      DEMO_AS_OF,
    )
    expect(b.reasons.map((r) => r.code)).not.toContain('V-COUNT-OUTDATED')
    // Category D with unknown product → strictest (1 year).
    const d = computeDataVerificationPriority(
      asCase(baseCase({ category: 'D', trainsPerDay: null, trafficMeasuredAt: '2025-06-01' })),
      DEMO_AS_OF,
    )
    expect(d.reasons.map((r) => r.code)).toContain('V-COUNT-OUTDATED')
  })

  it('pedestrian crossings (E) do not require a traffic product', () => {
    const r = computeDataVerificationPriority(
      asCase(baseCase({ category: 'E', roadAadt: null, trainsPerDay: null })),
      DEMO_AS_OF,
    )
    expect(r.level).toBe('V2')
  })

  it('real crossings: no inspection data → V1; GPR quality is reported', () => {
    const none = computeDataVerificationPriority(
      { kind: 'crossing', record: crossing, gpr: null },
      DEMO_AS_OF,
    )
    expect(none.level).toBe('V1')
    expect(none.reasons.map((r) => r.code)).toEqual(
      expect.arrayContaining(['V-NO-INSPECTION-DATA', 'V-NO-GPR', 'V-NO-TRAINS']),
    )
    const approx = computeDataVerificationPriority(
      { kind: 'crossing', record: crossing, gpr: gpr({ confidence: 'approximate', distanceM: 60 }) },
      DEMO_AS_OF,
    )
    expect(approx.reasons.map((r) => r.code)).toContain('V-GPR-APPROXIMATE')
    const ambiguous = computeDataVerificationPriority(
      {
        kind: 'crossing',
        record: { ...crossing, category: null, locationType: null },
        gpr: gpr({ confidence: 'ambiguous', aadt: null }),
      },
      DEMO_AS_OF,
    )
    expect(ambiguous.reasons.map((r) => r.code)).toEqual(
      expect.arrayContaining(['V-GPR-AMBIGUOUS', 'V-NO-CATEGORY', 'V-NO-LOCATION-TYPE', 'V-GPR-NO-AADT']),
    )
  })

  it('case with unknown category and unknown symptom → V1', () => {
    const r = computeDataVerificationPriority(
      asCase(
        baseCase({
          category: null,
          observations: [{ symptomId: 'S-NOPE', observedAt: '2026-01-01', note: 'x' }],
          trafficMeasuredAt: null,
        }),
      ),
      DEMO_AS_OF,
    )
    expect(r.level).toBe('V1')
    expect(r.reasons.map((x) => x.code)).toEqual(
      expect.arrayContaining(['V-NO-CATEGORY', 'V-UNKNOWN-SYMPTOM', 'V-NO-COUNT-DATE']),
    )
  })
})

describe('exposure context', () => {
  it('product ≥ 150 000 at category C → regulatory note (§8)', () => {
    const r = computeExposureContext(asCase(getCase('X6')))
    expect(r.trafficProduct).toBe(9800 * 40)
    expect(r.regulatoryNote).toMatch(/§8 ust\. 1/)
    expect(r.regulatoryNote).toMatch(/kategorię C/)
  })

  it('product ≥ 60 000 at category D → note (§9/§10); below → no note', () => {
    expect(computeExposureContext(asCase(getCase('X4'))).regulatoryNote).toMatch(/§10 pkt 1/)
    expect(computeExposureContext(asCase(getCase('X3'))).regulatoryNote).toBeNull()
  })

  it('consistent or non-applicable categories get no note', () => {
    expect(regulatoryNoteFor('B', 500_000)).toBeNull()
    expect(regulatoryNoteFor('A', 500_000)).toBeNull()
    expect(regulatoryNoteFor('E', 500_000)).toBeNull()
    expect(regulatoryNoteFor(null, 500_000)).toBeNull()
    expect(regulatoryNoteFor('C', 100_000)).toBeNull()
  })

  it('always states the product is not a risk measure; never invents a product', () => {
    const r = computeExposureContext(asCase(getCase('X5')))
    expect(r.trafficProduct).toBeNull()
    expect(r.regulatoryNote).toBeNull()
    expect(r.reasons[0]!.code).toBe('E-NOT-RISK')
    expect(r.reasons.map((x) => x.code)).toContain('E-NO-PRODUCT')
  })

  it('real crossings use GPR AADT but have no trains → no product', () => {
    const r = computeExposureContext({ kind: 'crossing', record: crossing, gpr: gpr() })
    expect(r.roadAadt).toBe(4000)
    expect(r.trafficProduct).toBeNull()
    expect(r.reasons.map((x) => x.code)).toContain('E-GPR')
  })
})
