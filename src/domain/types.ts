import type { z } from 'zod'
import type * as S from './schemas'

export type DataOrigin = z.infer<typeof S.DataOrigin>
export type Category = z.infer<typeof S.Category>
export type EvidenceStrength = z.infer<typeof S.EvidenceStrength>
export type ResponsibleParty = z.infer<typeof S.ResponsibleParty>
export type CostClass = z.infer<typeof S.CostClass>
export type SourceRef = z.infer<typeof S.SourceRef>
export type Crossing = z.infer<typeof S.Crossing>
export type GprMatch = z.infer<typeof S.GprMatch>
export type Observation = z.infer<typeof S.Observation>
export type ViolationCount = z.infer<typeof S.ViolationCount>
export type FictionalCase = z.infer<typeof S.FictionalCase>
export type Symptom = z.infer<typeof S.Symptom>
export type Cause = z.infer<typeof S.Cause>
export type Countermeasure = z.infer<typeof S.Countermeasure>
export type TaskStatus = z.infer<typeof S.TaskStatus>
export type Task = z.infer<typeof S.Task>
export type TasksState = z.infer<typeof S.TasksState>

export type Reason = { code: string; textPl: string; sourceId?: string }

export type InspectionLevel = 'P1' | 'P2' | 'P3'
export type VerificationLevel = 'V1' | 'V2' | 'V3'

/** `level: null` means "not assessed" (no inspection data) and ranks above P3. */
export type InspectionPriority = { level: InspectionLevel | null; reasons: Reason[] }

export type DataVerificationPriority = {
  level: VerificationLevel
  missing: string[]
  reasons: Reason[]
}

export type ExposureContext = {
  roadAadt: number | null
  trainsPerDay: number | null
  trafficProduct: number | null
  regulatoryNote: string | null
  reasons: Reason[]
}
