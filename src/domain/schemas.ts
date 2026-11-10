import { z } from 'zod'

export const DataOrigin = z.enum(['real', 'fictional', 'derived'])
export const Category = z.enum(['A', 'B', 'C', 'D', 'E', 'F'])
export const EvidenceStrength = z.enum(['strong', 'moderate', 'weak', 'none'])
export const ResponsibleParty = z.enum(['PLK', 'road_authority', 'joint', 'police_gitd', 'other'])
export const CostClass = z.enum(['low', 'medium', 'high', 'unknown'])
export const LocationType = z.enum(['szlakowy', 'stacyjny'])

const isoDate = z.iso.date()

export const SourceRef = z.object({
  id: z.string().min(1),
  kind: z.enum(['dataset', 'document']),
  title: z.string().min(1),
  shortTitle: z.string().min(1).optional(),
  publisher: z.string().min(1),
  url: z.url(),
  retrievedAt: isoDate,
  license: z.string().min(1),
  processing: z.string().min(1),
  records: z.number().int().nonnegative().optional(),
})

export const Crossing = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: Category.nullable(),
  locationType: LocationType.nullable(),
  unit: z.string().nullable(),
  lat: z.number().min(49).max(55),
  lon: z.number().min(14).max(24.2),
  origin: z.literal('real'),
  sourceId: z.string().min(1),
})

export const GprMatch = z.object({
  crossingId: z.string().min(1),
  roadNumber: z.string().min(1),
  segmentName: z.string().nullable(),
  aadt: z.number().int().nonnegative().nullable(),
  distanceM: z.number().nonnegative(),
  confidence: z.enum(['high', 'approximate', 'ambiguous']),
  origin: z.literal('derived'),
  sourceId: z.string().min(1),
})

export const Observation = z.object({
  symptomId: z.string().min(1),
  observedAt: isoDate,
  note: z.string().min(1),
})

export const ViolationCount = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  count: z.number().int().nonnegative(),
  method: z.string().min(1),
})

export const FictionalCase = z.object({
  id: z.string().regex(/^X([1-9]|10)$/),
  name: z.string().min(1),
  origin: z.literal('fictional'),
  crossingId: z.null(),
  category: Category.nullable(),
  schematicPosition: z.object({
    lat: z.number().min(49).max(55),
    lon: z.number().min(14).max(24.2),
  }),
  roadAadt: z.number().int().nonnegative().nullable(),
  trainsPerDay: z.number().int().nonnegative().nullable(),
  trafficMeasuredAt: isoDate.nullable(),
  summary: z.string().min(1),
  observations: z.array(Observation),
  violations: z.array(ViolationCount),
  lastInspectionAt: isoDate.nullable(),
  evaluation: z
    .object({
      countermeasureId: z.string().min(1),
      implementedAt: isoDate,
    })
    .nullable(),
})

export const Symptom = z.object({
  id: z.string().regex(/^S-[A-Z0-9-]+$/),
  namePl: z.string().min(1),
  indicates: z.array(z.string()).min(1),
  severity: z.enum(['high', 'medium']),
})

export const Cause = z.object({
  id: z.string().regex(/^C-[A-Z0-9-]+$/),
  namePl: z.string().min(1),
  descriptionPl: z.string().min(1),
  sourceIds: z.array(z.string()).min(1),
  sourceNote: z.string().min(1),
})

export const Countermeasure = z.object({
  id: z.string().regex(/^CM-[A-Z0-9-]+$/),
  namePl: z.string().min(1),
  addressesCauses: z.array(z.string()).min(1),
  evidence: EvidenceStrength,
  evidenceContext: z.string().min(1),
  effectNote: z.string().min(1),
  sourceUrls: z.array(z.url()).min(1),
  responsible: ResponsibleParty,
  legalNote: z.string().min(1),
  costClass: CostClass,
  applicableCategories: z.array(Category).min(1),
})

export const TaskStatus = z.enum(['planned', 'in_progress', 'implemented', 'verified'])

export const Task = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  countermeasureId: z.string().min(1),
  status: TaskStatus,
  responsible: ResponsibleParty,
  note: z.string(),
  updatedAt: z.iso.datetime(),
})

export const TasksState = z.object({
  tasks: z.array(Task),
})
