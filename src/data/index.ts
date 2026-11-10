import { DEMO_AS_OF } from '@/config/demo'
import { caseRow, crossingRow, type Row } from '@/domain/assess'
import type { Crossing, FictionalCase, GprMatch, SourceRef } from '@/domain/types'
import crossingsUrl from './crossings.json?url'
import casesJson from './fictional-cases.json'
import gprUrl from './gpr-match.json?url'
import sourcesJson from './sources.json'

// Validated against the Zod schemas in tests (tests/schemas.test.ts), not at runtime.
export const fictionalCases = casesJson as FictionalCase[]
export const sources = sourcesJson as SourceRef[]

export const caseRows: Row[] = fictionalCases.map((c) => caseRow(c, DEMO_AS_OF))

export function sourceById(id: string): SourceRef | undefined {
  return sources.find((s) => s.id === id)
}

export function caseById(id: string): FictionalCase | undefined {
  return fictionalCases.find((c) => c.id === id)
}

export type RealData = {
  crossings: Crossing[]
  gprByCrossing: Map<string, GprMatch>
  rows: Row[]
}

let realData: Promise<RealData> | null = null

/** Loads the WFS snapshot and GPR matches once (hashed static assets under Vite `base`). */
export function loadRealData(): Promise<RealData> {
  realData ??= Promise.all([
    fetch(crossingsUrl).then((r) => {
      if (!r.ok) throw new Error(`Nie udało się wczytać przejazdów (HTTP ${r.status})`)
      return r.json() as Promise<Crossing[]>
    }),
    fetch(gprUrl).then((r) => {
      if (!r.ok) throw new Error(`Nie udało się wczytać dopasowań GPR (HTTP ${r.status})`)
      return r.json() as Promise<GprMatch[]>
    }),
  ]).then(([crossings, matches]) => {
    const gprByCrossing = new Map(matches.map((m) => [m.crossingId, m]))
    const rows = crossings.map((c) => crossingRow(c, gprByCrossing.get(c.id) ?? null, DEMO_AS_OF))
    return { crossings, gprByCrossing, rows }
  })
  realData.catch(() => {
    realData = null
  })
  return realData
}
