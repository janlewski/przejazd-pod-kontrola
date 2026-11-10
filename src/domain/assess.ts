import {
  computeDataVerificationPriority,
  computeExposureContext,
  computeInspectionPriority,
  type Subject,
} from './priority'
import type {
  Crossing,
  DataVerificationPriority,
  ExposureContext,
  FictionalCase,
  GprMatch,
  InspectionPriority,
} from './types'

/** The three separate outputs for one subject. Deliberately not combined. */
export type Assessment = {
  inspection: InspectionPriority
  verification: DataVerificationPriority
  exposure: ExposureContext
}

export function assess(subject: Subject, asOf: string): Assessment {
  return {
    inspection: computeInspectionPriority(subject),
    verification: computeDataVerificationPriority(subject, asOf),
    exposure: computeExposureContext(subject),
  }
}

export type Row = {
  id: string
  name: string
  origin: 'real' | 'fictional'
  category: Crossing['category']
  lat: number
  lon: number
  unit: string | null
  /** 9-digit number of the real crossing (for fictional cases: the crossing used as setting). */
  crossingName: string | null
  gpr: GprMatch | null
  assessment: Assessment
}

export function caseRow(record: FictionalCase, asOf: string): Row {
  return {
    id: record.id,
    name: record.name,
    origin: 'fictional',
    category: record.category,
    lat: record.crossing.lat,
    lon: record.crossing.lon,
    unit: record.crossing.unit,
    crossingName: record.crossing.name,
    gpr: null,
    assessment: assess({ kind: 'case', record }, asOf),
  }
}

export function crossingRow(record: Crossing, gpr: GprMatch | null, asOf: string): Row {
  return {
    id: record.id,
    name: record.name,
    origin: 'real',
    category: record.category,
    lat: record.lat,
    lon: record.lon,
    unit: record.unit,
    crossingName: record.name,
    gpr,
    assessment: assess({ kind: 'crossing', record, gpr }, asOf),
  }
}
