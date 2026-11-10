import {
  REGULATION_SOURCE_ID,
  TRAFFIC_COUNT_INTERVAL_ABC_YEARS,
  TRAFFIC_COUNT_INTERVAL_D,
  TRAFFIC_PRODUCT_B,
  TRAFFIC_PRODUCT_C,
} from '@/config/thresholds'
import { symptoms } from '@/data/rules/symptoms'
import { formatDate, formatInt, formatMeters } from '@/lib/format'
import type {
  Category,
  Crossing,
  DataVerificationPriority,
  ExposureContext,
  FictionalCase,
  GprMatch,
  InspectionLevel,
  InspectionPriority,
  Reason,
  VerificationLevel,
} from './types'

/**
 * What the three outputs are computed for: a (fictional) case record, or a real crossing
 * from the WFS snapshot with its optional GPR match. They are never combined into one score.
 */
export type Subject =
  { kind: 'case'; record: FictionalCase } | { kind: 'crossing'; record: Crossing; gpr: GprMatch | null }

const symptomById = new Map(symptoms.map((s) => [s.id, s]))

const INSPECTION_RANK: Record<InspectionLevel, number> = { P1: 1, P2: 2, P3: 3 }

/** Sort key: P1 < P2 < not assessed < P3. Missing data never sorts below a confirmed P3. */
export function inspectionSortKey(level: InspectionLevel | null): number {
  return level === null ? 2.5 : INSPECTION_RANK[level]
}

function raise(current: InspectionLevel, to: InspectionLevel): InspectionLevel {
  return INSPECTION_RANK[to] < INSPECTION_RANK[current] ? to : current
}

export function computeInspectionPriority(subject: Subject): InspectionPriority {
  if (subject.kind === 'crossing') {
    return {
      level: null,
      reasons: [
        {
          code: 'I-NO-RECORD',
          textPl:
            'Brak danych o kontrolach, zdarzeniach i naruszeniach w zbiorze — priorytet nieoceniony. Nie oznacza to niskiego priorytetu.',
        },
      ],
    }
  }

  const c = subject.record
  const reasons: Reason[] = []
  let level: InspectionLevel = 'P3'

  for (const obs of c.observations) {
    const symptom = symptomById.get(obs.symptomId)
    if (!symptom) {
      level = raise(level, 'P2')
      reasons.push({
        code: 'I-UNKNOWN-SYMPTOM',
        textPl: `Nierozpoznany objaw „${obs.symptomId}” (${formatDate(obs.observedAt)}) — traktowany co najmniej jak P2.`,
      })
      continue
    }
    const to: InspectionLevel = symptom.severity === 'high' ? 'P1' : 'P2'
    level = raise(level, to)
    reasons.push({
      code: symptom.severity === 'high' ? 'I-SYMPTOM-HIGH' : 'I-SYMPTOM-MEDIUM',
      textPl: `${symptom.namePl} — obserwacja z ${formatDate(obs.observedAt)} (${to}).`,
    })
  }

  const totalViolations = c.violations.reduce((sum, v) => sum + v.count, 0)
  if (totalViolations > 0) {
    level = raise(level, 'P2')
    const first = c.violations[0]!.period
    const last = c.violations.at(-1)!.period
    reasons.push({
      code: 'I-VIOLATIONS',
      textPl: `Odnotowane naruszenia: ${formatInt(totalViolations)} w okresie ${first} – ${last} (co najmniej P2).`,
    })
  }

  if (c.lastInspectionAt === null) {
    level = raise(level, 'P2')
    reasons.push({
      code: 'I-NO-INSPECTION',
      textPl: 'Brak daty ostatniej kontroli. Brak danych nie obniża priorytetu — co najmniej P2.',
    })
  }

  if (reasons.length === 0) {
    reasons.push({
      code: 'I-CLEAR',
      textPl: `Kontrola z ${formatDate(c.lastInspectionAt!)}: brak objawów i naruszeń w danych.`,
    })
  }

  return { level, reasons }
}

type Missing = { item: string; critical: boolean; reason: Reason }

/** §14 ust. 2: traffic counts (and so the traffic product) apply to categories A–D. */
function needsTrafficProduct(category: Category | null): boolean {
  return category !== 'E' && category !== 'F'
}

function requiredCountIntervalYears(category: Category | null, product: number | null): number {
  if (category === 'D') {
    // Unknown product → strictest interval: missing data must not relax the requirement.
    if (product === null) return TRAFFIC_COUNT_INTERVAL_D.at(-1)!.years
    return TRAFFIC_COUNT_INTERVAL_D.find((r) => product <= r.maxProduct)!.years
  }
  return TRAFFIC_COUNT_INTERVAL_ABC_YEARS
}

function yearsBetween(fromIso: string, toIso: string): number {
  const ms = Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso.slice(0, 10)}T00:00:00Z`)
  return ms / (365.25 * 24 * 3600 * 1000)
}

export function computeDataVerificationPriority(subject: Subject, asOf: string): DataVerificationPriority {
  const gaps: Missing[] = []
  const add = (item: string, critical: boolean, code: string, textPl: string, sourceId?: string) =>
    gaps.push({ item, critical, reason: { code, textPl, ...(sourceId ? { sourceId } : {}) } })

  if (subject.kind === 'case') {
    const c = subject.record
    if (c.category === null) add('kategoria przejazdu', true, 'V-NO-CATEGORY', 'Brak kategorii przejazdu.')
    if (c.lastInspectionAt === null)
      add('data ostatniej kontroli', true, 'V-NO-INSPECTION', 'Brak daty ostatniej kontroli.')
    for (const obs of c.observations) {
      if (!symptomById.has(obs.symptomId))
        add(`objaw ${obs.symptomId}`, true, 'V-UNKNOWN-SYMPTOM', `Objaw „${obs.symptomId}” spoza słownika.`)
    }
    const productNeeded = needsTrafficProduct(c.category)
    if (c.roadAadt === null)
      add(
        'ruch drogowy (SDRR)',
        productNeeded,
        'V-NO-AADT',
        'Brak średniego dobowego ruchu drogowego — nie można sprawdzić kategorii względem iloczynu ruchu (§14).',
        REGULATION_SOURCE_ID,
      )
    if (c.trainsPerDay === null)
      add(
        'pociągi na dobę',
        productNeeded,
        'V-NO-TRAINS',
        'Brak liczby pociągów na dobę — nie można obliczyć iloczynu ruchu.',
      )
    if (c.trafficMeasuredAt === null) {
      add('data pomiaru ruchu', false, 'V-NO-COUNT-DATE', 'Brak daty ostatniego pomiaru ruchu.')
    } else {
      const product = c.roadAadt !== null && c.trainsPerDay !== null ? c.roadAadt * c.trainsPerDay : null
      const required = requiredCountIntervalYears(c.category, product)
      const age = yearsBetween(c.trafficMeasuredAt, asOf)
      if (age > required) {
        add(
          'aktualny pomiar ruchu',
          false,
          'V-COUNT-OUTDATED',
          `Pomiar ruchu z ${formatDate(c.trafficMeasuredAt)} jest starszy niż wymagane ${required} ${required === 1 ? 'rok' : required < 5 ? 'lata' : 'lat'} (zał. nr 1 pkt 1–2).`,
          REGULATION_SOURCE_ID,
        )
      }
    }
  } else {
    const { record: x, gpr } = subject
    add(
      'dane o kontrolach i zdarzeniach',
      true,
      'V-NO-INSPECTION-DATA',
      'Brak danych o kontrolach, zdarzeniach i naruszeniach (dane wewnętrzne zarządcy).',
    )
    if (x.category === null)
      add('kategoria przejazdu', true, 'V-NO-CATEGORY', 'Brak kategorii w danych WFS.', x.sourceId)
    if (x.locationType === null)
      add(
        'położenie (szlak / stacja)',
        false,
        'V-NO-LOCATION-TYPE',
        'Brak informacji szlakowy / stacyjny.',
        x.sourceId,
      )
    const productNeeded = needsTrafficProduct(x.category)
    if (gpr === null) {
      add(
        'ruch drogowy (SDRR)',
        productNeeded,
        'V-NO-GPR',
        'Brak dopasowania do odcinka GPR 2025 (drogi krajowe) — prawdopodobnie droga lokalna. Brak danych, nie zero.',
      )
    } else {
      if (gpr.confidence === 'ambiguous')
        add(
          'jednoznaczne dopasowanie GPR',
          true,
          'V-GPR-AMBIGUOUS',
          `Dopasowanie do GPR niejednoznaczne (inna droga lub inny SDRR w pobliżu; ${formatMeters(gpr.distanceM)}).`,
          gpr.sourceId,
        )
      if (gpr.confidence === 'approximate')
        add(
          'potwierdzenie dopasowania GPR',
          false,
          'V-GPR-APPROXIMATE',
          `Dopasowanie do GPR przybliżone (${formatMeters(gpr.distanceM)} od uproszczonej osi odcinka).`,
          gpr.sourceId,
        )
      if (gpr.aadt === null)
        add(
          'ruch drogowy (SDRR)',
          productNeeded,
          'V-GPR-NO-AADT',
          'Odcinek GPR bez wartości SDRR 2025.',
          gpr.sourceId,
        )
    }
    add(
      'pociągi na dobę',
      productNeeded,
      'V-NO-TRAINS',
      'Brak publicznego źródła liczby pociągów na poziomie przejazdu.',
    )
  }

  const level: VerificationLevel = gaps.some((g) => g.critical) ? 'V1' : gaps.length ? 'V2' : 'V3'
  const reasons = gaps.map((g) => g.reason)
  if (reasons.length === 0)
    reasons.push({ code: 'V-COMPLETE', textPl: 'Komplet danych wymaganych przez reguły.' })
  return { level, missing: gaps.map((g) => g.item), reasons }
}

export function computeExposureContext(subject: Subject): ExposureContext {
  const reasons: Reason[] = []
  let roadAadt: number | null
  let trainsPerDay: number | null
  let category: Category | null
  let aadtFromGpr = false

  if (subject.kind === 'case') {
    roadAadt = subject.record.roadAadt
    trainsPerDay = subject.record.trainsPerDay
    category = subject.record.category
  } else {
    roadAadt = subject.gpr?.aadt ?? null
    aadtFromGpr = roadAadt !== null
    trainsPerDay = null
    category = subject.record.category
  }

  const trafficProduct = roadAadt !== null && trainsPerDay !== null ? roadAadt * trainsPerDay : null

  reasons.push({
    code: 'E-NOT-RISK',
    textPl: 'Iloczyn ruchu to kontekst regulacyjny (Dz.U. 2025 poz. 1105 §8–§10), nie miara ryzyka.',
    sourceId: REGULATION_SOURCE_ID,
  })
  if (aadtFromGpr) {
    reasons.push({
      code: 'E-GPR',
      textPl:
        'Ruch drogowy: SDRR z GPR 2025 — zał. nr 1 pkt 9 przyjmuje go do iloczynu na drogach krajowych i wojewódzkich.',
      sourceId: REGULATION_SOURCE_ID,
    })
  }

  if (trafficProduct === null) {
    reasons.push({
      code: 'E-NO-PRODUCT',
      textPl: `Iloczynu nie można obliczyć: brak ${[
        roadAadt === null ? 'ruchu drogowego' : null,
        trainsPerDay === null ? 'liczby pociągów' : null,
      ]
        .filter(Boolean)
        .join(' i ')}.`,
    })
    return { roadAadt, trainsPerDay, trafficProduct, regulatoryNote: null, reasons }
  }

  reasons.push({
    code: 'E-PRODUCT',
    textPl: `Iloczyn ${formatInt(roadAadt!)} × ${formatInt(trainsPerDay!)} = ${formatInt(trafficProduct)}. W rozporządzeniu liczy się pojazdy kolejowe i manewry na dobę; tu przybliżenie: pociągi na dobę.`,
  })

  const regulatoryNote = regulatoryNoteFor(category, trafficProduct)
  if (regulatoryNote === null) {
    reasons.push({
      code: 'E-NO-MISMATCH',
      textPl:
        'Brak rozbieżności względem progów iloczynu. Pozostałe warunki §7–§10 (prędkość, widoczność, liczba torów) nie są w danych.',
      sourceId: REGULATION_SOURCE_ID,
    })
  }
  return { roadAadt, trainsPerDay, trafficProduct, regulatoryNote, reasons }
}

export function regulatoryNoteFor(category: Category | null, product: number): string | null {
  const speedNote =
    ' Przy stwierdzonym przekroczeniu iloczynu ruchu §24 ust. 2 wprowadza ograniczenie prędkości pociągów do 50 km/h do czasu zmiany zabezpieczenia.'
  if (category === null || category === 'E' || category === 'F') return null
  if (product >= TRAFFIC_PRODUCT_B && (category === 'C' || category === 'D')) {
    return `Iloczyn ${formatInt(product)} ≥ ${formatInt(TRAFFIC_PRODUCT_B)}: §8 ust. 1 wskazuje kategorię B, przejazd ma kategorię ${category} — sprawdź zgodność kategorii.${speedNote}`
  }
  if (product >= TRAFFIC_PRODUCT_C && category === 'D') {
    return `Iloczyn ${formatInt(product)} ≥ ${formatInt(TRAFFIC_PRODUCT_C)}: kategoria D wymaga iloczynu poniżej ${formatInt(TRAFFIC_PRODUCT_C)} (§10 pkt 1), §9 pkt 1 wskazuje kategorię C — sprawdź zgodność kategorii.${speedNote}`
  }
  return null
}
