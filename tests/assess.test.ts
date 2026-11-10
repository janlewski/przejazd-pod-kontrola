import { describe, expect, it } from 'vitest'
import { DEMO_AS_OF } from '@/config/demo'
import { caseRow, crossingRow } from '@/domain/assess'
import type { Crossing } from '@/domain/types'
import {
  formatCoord,
  formatDate,
  formatDateTime,
  formatInt,
  formatMonth,
  formatOrMissing,
  formatPercent,
} from '@/lib/format'
import { getCase } from './helpers'

const crossing: Crossing = {
  id: 'PKP_PLK.8863',
  name: '082 006 629',
  category: 'D',
  locationType: 'szlakowy',
  unit: 'PKP PLK LUBLIN',
  lat: 51.470818,
  lon: 21.761546,
  origin: 'real',
  sourceId: 'gugik-wfs-przejazdy',
}

describe('assess', () => {
  it('builds rows with three separate outputs', () => {
    const row = caseRow(getCase('X1'), DEMO_AS_OF)
    expect(row).toMatchObject({ id: 'X1', origin: 'fictional', category: 'B', gpr: null })
    expect(Object.keys(row.assessment).sort()).toEqual(['exposure', 'inspection', 'verification'])

    const real = crossingRow(crossing, null, DEMO_AS_OF)
    expect(real).toMatchObject({ id: 'PKP_PLK.8863', origin: 'real', unit: 'PKP PLK LUBLIN' })
    expect(real.assessment.inspection.level).toBeNull()
    expect(real.assessment.verification.level).toBe('V1')
  })
})

describe('format (pl-PL)', () => {
  const nbsp = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ')
  it('numbers, percentages and missing values', () => {
    expect(nbsp(formatInt(537600))).toBe('537 600')
    expect(formatInt(8400)).toBe('8400')
    expect(nbsp(formatPercent(-0.64))).toBe('-64%')
    expect(formatOrMissing(null)).toBe('brak danych')
    expect(formatCoord(51.470818)).toBe('51,47082')
  })
  it('dates', () => {
    expect(formatDate('2026-06-15')).toBe('15 czerwca 2026')
    expect(formatMonth('2026-01')).toMatch(/sty/)
    expect(formatDateTime('2026-11-01T09:00:00.000Z')).toMatch(/2026/)
  })
})
