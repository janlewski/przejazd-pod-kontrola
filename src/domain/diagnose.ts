import { causes } from '@/data/rules/causes'
import { countermeasures } from '@/data/rules/countermeasures'
import { symptoms } from '@/data/rules/symptoms'
import { formatDate } from '@/lib/format'
import type {
  Cause,
  Category,
  CostClass,
  Countermeasure,
  EvidenceStrength,
  FictionalCase,
  Observation,
  Reason,
  Symptom,
} from './types'

export type CauseHit = {
  cause: Cause
  evidence: { symptom: Symptom; observations: Observation[] }[]
  reasons: Reason[]
}

export type CategoryFit = 'fit' | 'unknown' | 'not_listed'

export type RankedCountermeasure = {
  countermeasure: Countermeasure
  addresses: string[]
  categoryFit: CategoryFit
  reasons: Reason[]
}

export type Diagnosis = {
  causes: CauseHit[]
  countermeasures: RankedCountermeasure[]
  reasons: Reason[]
}

export const EVIDENCE_ORDER: Record<EvidenceStrength, number> = {
  strong: 0,
  moderate: 1,
  weak: 2,
  none: 3,
}
const FIT_ORDER: Record<CategoryFit, number> = { fit: 0, unknown: 1, not_listed: 2 }
const COST_ORDER: Record<CostClass, number> = { low: 0, medium: 1, high: 2, unknown: 3 }

const symptomById = new Map(symptoms.map((s) => [s.id, s]))
const causeById = new Map(causes.map((c) => [c.id, c]))

export function categoryFit(cm: Countermeasure, category: Category | null): CategoryFit {
  if (category === null) return 'unknown'
  return cm.applicableCategories.includes(category) ? 'fit' : 'not_listed'
}

/**
 * Lexicographic ranking — no summed score: evidence strength, then category fit,
 * then number of diagnosed causes addressed, then indicative cost class, then id.
 */
export function compareCountermeasures(a: RankedCountermeasure, b: RankedCountermeasure): number {
  return (
    EVIDENCE_ORDER[a.countermeasure.evidence] - EVIDENCE_ORDER[b.countermeasure.evidence] ||
    FIT_ORDER[a.categoryFit] - FIT_ORDER[b.categoryFit] ||
    b.addresses.length - a.addresses.length ||
    COST_ORDER[a.countermeasure.costClass] - COST_ORDER[b.countermeasure.costClass] ||
    a.countermeasure.id.localeCompare(b.countermeasure.id)
  )
}

export function diagnose(c: Pick<FictionalCase, 'observations' | 'category'>): Diagnosis {
  const hits = new Map<string, CauseHit>()
  const reasons: Reason[] = []

  for (const obs of c.observations) {
    const symptom = symptomById.get(obs.symptomId)
    if (!symptom) {
      reasons.push({
        code: 'D-UNKNOWN-SYMPTOM',
        textPl: `Objaw „${obs.symptomId}” spoza słownika — pominięty w diagnozie.`,
      })
      continue
    }
    for (const causeId of symptom.indicates) {
      const cause = causeById.get(causeId)
      if (!cause) continue
      const hit = hits.get(causeId) ?? { cause, evidence: [], reasons: [] }
      let entry = hit.evidence.find((e) => e.symptom.id === symptom.id)
      if (!entry) {
        entry = { symptom, observations: [] }
        hit.evidence.push(entry)
      }
      entry.observations.push(obs)
      hit.reasons.push({
        code: 'D-SYMPTOM',
        textPl: `${symptom.namePl} (${formatDate(obs.observedAt)}) wskazuje na: ${cause.namePl}.`,
        sourceId: cause.sourceIds[0],
      })
      hits.set(causeId, hit)
    }
  }

  const causeHits = [...hits.values()]
  const hitIds = new Set(causeHits.map((h) => h.cause.id))

  const ranked = countermeasures
    .map((cm): RankedCountermeasure | null => {
      const addresses = cm.addressesCauses.filter((id) => hitIds.has(id))
      if (addresses.length === 0) return null
      const fit = categoryFit(cm, c.category)
      const cmReasons: Reason[] = [
        {
          code: 'R-ADDRESSES',
          textPl: `Odpowiada na: ${addresses.map((id) => causeById.get(id)?.namePl ?? id).join('; ')}.`,
        },
        { code: `R-EVIDENCE-${cm.evidence.toUpperCase()}`, textPl: cm.evidenceContext },
      ]
      if (fit === 'not_listed') {
        cmReasons.push({
          code: 'R-CATEGORY-NOT-LISTED',
          textPl: `Środek nie jest typowy dla kategorii ${c.category} (dotyczy: ${cm.applicableCategories.join(', ')}).`,
        })
      } else if (fit === 'unknown') {
        cmReasons.push({
          code: 'R-CATEGORY-UNKNOWN',
          textPl: 'Kategoria przejazdu nieznana — zgodności nie sprawdzono.',
        })
      }
      return { countermeasure: cm, addresses, categoryFit: fit, reasons: cmReasons }
    })
    .filter((x): x is RankedCountermeasure => x !== null)
    .sort(compareCountermeasures)

  if (causeHits.length === 0) {
    reasons.push({ code: 'D-NO-SYMPTOMS', textPl: 'Brak zarejestrowanych objawów — brak diagnozy.' })
  } else if (ranked.length > 0 && ranked.every((r) => r.countermeasure.evidence === 'none')) {
    reasons.push({
      code: 'D-EVIDENCE-GAP',
      textPl: 'Żaden dostępny środek nie ma udokumentowanej skuteczności — luka w dowodach.',
    })
  }

  return { causes: causeHits, countermeasures: ranked, reasons }
}
