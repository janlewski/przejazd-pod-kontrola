import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { causes } from '@/data/rules/causes'
import { countermeasures } from '@/data/rules/countermeasures'
import { symptoms } from '@/data/rules/symptoms'
import {
  Cause,
  Countermeasure,
  Crossing,
  FictionalCase,
  GprMatch,
  SourceRef,
  Symptom,
} from '@/domain/schemas'
import { readJson } from './helpers'

const crossings = z.array(Crossing).parse(readJson('src/data/crossings.json'))
const matches = z.array(GprMatch).parse(readJson('src/data/gpr-match.json'))
const cases = z.array(FictionalCase).parse(readJson('src/data/fictional-cases.json'))
const sources = z.array(SourceRef).parse(readJson('src/data/sources.json'))
const sourceIds = new Set(sources.map((s) => s.id))

describe('data files', () => {
  it('every record passes Zod validation', () => {
    expect(crossings.length).toBeGreaterThan(10_000)
    expect(matches.length).toBeGreaterThan(0)
    expect(cases).toHaveLength(10)
    expect(sources.length).toBeGreaterThan(0)
  })

  it('crossing ids are unique; every GPR match points to a crossing', () => {
    const ids = new Set(crossings.map((c) => c.id))
    expect(ids.size).toBe(crossings.length)
    for (const m of matches) expect(ids.has(m.crossingId), m.crossingId).toBe(true)
    expect(new Set(matches.map((m) => m.crossingId)).size).toBe(matches.length)
  })

  it('every dataset record references a registered source', () => {
    for (const id of new Set([...crossings, ...matches].map((r) => r.sourceId))) {
      expect(sourceIds.has(id), id).toBe(true)
    }
  })

  it('sources have URL, date, licence and processing description', () => {
    for (const s of sources) {
      expect(s.license.length, s.id).toBeGreaterThan(5)
      expect(s.processing.length, s.id).toBeGreaterThan(10)
    }
    for (const id of ['gugik-wfs-przejazdy', 'gddkia-gpr-2025', 'derived-gpr-match', 'osm-tiles']) {
      expect(sourceIds.has(id), id).toBe(true)
    }
  })

  it('fictional cases X1–X10 are labelled fictional and carry no real place names', () => {
    expect(cases.map((c) => c.id)).toEqual(['X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'X8', 'X9', 'X10'])
    for (const c of cases) {
      expect(c.origin).toBe('fictional')
      expect(c.name).toBe(`Przejazd ${c.id}`)
    }
  })

  it('each case is set on a distinct real crossing that matches it and has no GPR data', () => {
    const byId = new Map(crossings.map((x) => [x.id, x]))
    const matched = new Set(matches.map((m) => m.crossingId))
    expect(new Set(cases.map((c) => c.crossing.id)).size).toBe(cases.length)
    for (const c of cases) {
      const real = byId.get(c.crossing.id)
      expect(real, c.id).toBeDefined()
      expect({ name: real!.name, unit: real!.unit, lat: real!.lat, lon: real!.lon }, c.id).toEqual({
        name: c.crossing.name,
        unit: c.crossing.unit,
        lat: c.crossing.lat,
        lon: c.crossing.lon,
      })
      expect(real!.category, c.id).toBe(c.category)
      // Fictional traffic must not contradict real GPR data.
      expect(matched.has(c.crossing.id), c.id).toBe(false)
    }
  })

  it('no personal-data fields in any data file', () => {
    const allowed = {
      crossing: ['id', 'name', 'category', 'locationType', 'unit', 'lat', 'lon', 'origin', 'sourceId'],
      match: [
        'crossingId',
        'roadNumber',
        'segmentName',
        'aadt',
        'distanceM',
        'confidence',
        'origin',
        'sourceId',
      ],
    }
    const raw = readJson('src/data/crossings.json') as Record<string, unknown>[]
    for (const r of raw) expect(Object.keys(r).every((k) => allowed.crossing.includes(k))).toBe(true)
    const rawMatches = readJson('src/data/gpr-match.json') as Record<string, unknown>[]
    for (const r of rawMatches) expect(Object.keys(r).every((k) => allowed.match.includes(k))).toBe(true)
    const text = JSON.stringify(readJson('src/data/fictional-cases.json'))
    expect(text).not.toMatch(/PESEL|\b\d{11}\b|@|tel\.|nr rej/i)
  })
})

describe('rules', () => {
  it('validate against schemas', () => {
    z.array(Symptom).parse(symptoms)
    z.array(Cause).parse(causes)
    z.array(Countermeasure).parse(countermeasures)
  })

  it('every countermeasure has at least one source URL', () => {
    for (const cm of countermeasures) expect(cm.sourceUrls.length, cm.id).toBeGreaterThanOrEqual(1)
  })

  it('evidence strength is weak/none where no effect has been published', () => {
    const byId = new Map(countermeasures.map((c) => [c.id, c]))
    expect(byId.get('CM-REDLIGHT')!.evidence).toBe('weak')
    expect(byId.get('CM-VEG')!.evidence).toBe('none')
    expect(['weak', 'none']).toContain(byId.get('CM-EDU')!.evidence)
  })

  it('measures without numeric evidence say so', () => {
    for (const cm of countermeasures.filter((c) => c.evidence === 'none')) {
      expect(cm.effectNote, cm.id).toMatch(/brak liczbowej skuteczności/i)
    }
  })

  it('references resolve: symptom → cause, countermeasure → cause, cause → source, case → symptom / measure', () => {
    const causeIds = new Set(causes.map((c) => c.id))
    const symptomIds = new Set(symptoms.map((s) => s.id))
    const cmIds = new Set(countermeasures.map((c) => c.id))
    for (const s of symptoms) for (const c of s.indicates) expect(causeIds.has(c), `${s.id}→${c}`).toBe(true)
    for (const cm of countermeasures)
      for (const c of cm.addressesCauses) expect(causeIds.has(c), `${cm.id}→${c}`).toBe(true)
    for (const c of causes) for (const s of c.sourceIds) expect(sourceIds.has(s), `${c.id}→${s}`).toBe(true)
    for (const c of cases) {
      for (const o of c.observations) expect(symptomIds.has(o.symptomId), `${c.id}→${o.symptomId}`).toBe(true)
      if (c.evaluation) expect(cmIds.has(c.evaluation.countermeasureId)).toBe(true)
    }
  })

  it('every cause is reachable from a symptom and addressed by a measure', () => {
    for (const c of causes) {
      expect(
        symptoms.some((s) => s.indicates.includes(c.id)),
        c.id,
      ).toBe(true)
      expect(
        countermeasures.some((m) => m.addressesCauses.includes(c.id)),
        c.id,
      ).toBe(true)
    }
  })
})
