import fs from 'node:fs'
import path from 'node:path'
import type { FictionalCase } from '@/domain/types'

export const ROOT = path.resolve(import.meta.dirname, '..')

export function readJson(rel: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'))
}

export function loadCases(): FictionalCase[] {
  return readJson('src/data/fictional-cases.json') as FictionalCase[]
}

export function getCase(id: string): FictionalCase {
  const found = loadCases().find((c) => c.id === id)
  if (!found) throw new Error(`missing case ${id}`)
  return found
}

export function baseCase(overrides: Partial<FictionalCase> = {}): FictionalCase {
  return {
    id: 'X1',
    name: 'Przejazd testowy',
    origin: 'fictional',
    crossing: { id: 'PKP_PLK.0', name: '000 000 000', unit: null, lat: 52, lon: 19 },
    category: 'B',
    roadAadt: 5000,
    trainsPerDay: 40,
    trafficMeasuredAt: '2025-05-01',
    summary: 'Test',
    observations: [],
    violations: [],
    lastInspectionAt: '2026-09-01',
    evaluation: null,
    ...overrides,
  }
}
