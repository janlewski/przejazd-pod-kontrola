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

/** The fictional case set on a real crossing, if any. */
export function caseByCrossingId(crossingId: string): FictionalCase | undefined {
  return fictionalCases.find((c) => c.crossing.id === crossingId)
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
    // A crossing used as the setting of a fictional case is listed once, as that case.
    const caseCrossings = new Set(fictionalCases.map((c) => c.crossing.id))
    const rows = crossings
      .filter((c) => !caseCrossings.has(c.id))
      .map((c) => crossingRow(c, gprByCrossing.get(c.id) ?? null, DEMO_AS_OF))
    return { crossings, gprByCrossing, rows }
  })
  realData.catch(() => {
    realData = null
  })
  return realData
}
