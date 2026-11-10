import path from 'node:path'
import { z } from 'zod'
import { ROOT } from './sources.ts'

export const GPR_URL = 'https://www.gov.pl/attachment/7f8ca805-e384-4802-bf10-d36538e6ef84'
export const GPR_SOURCE_ID = 'gddkia-gpr-2025'
export const GPR_SEGMENTS_PATH = path.join(ROOT, 'data/derived/gpr-segments.json')

export const GprSegment = z.object({
  id: z.number().int(),
  roadNumber: z.string().min(1),
  name: z.string().nullable(),
  aadt: z.number().int().nonnegative().nullable(),
  lines: z.array(z.array(z.tuple([z.number(), z.number()])).min(2)).min(1),
})
export type GprSegment = z.infer<typeof GprSegment>
