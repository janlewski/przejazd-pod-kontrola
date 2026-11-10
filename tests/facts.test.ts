import { describe, expect, it } from 'vitest'
import { UTK_USER_INCIDENTS_2021_2025 as UTK } from '@/data/facts'
import type { SourceRef } from '@/domain/types'
import { readJson } from './helpers'

describe('quoted facts', () => {
  it('UTK incident counts reference a registered source and support „ponad 90%”', () => {
    const sources = readJson('src/data/sources.json') as SourceRef[]
    expect(sources.some((s) => s.id === UTK.sourceId)).toBe(true)
    expect(UTK.categoryB).toBeLessThanOrEqual(UTK.total)
    expect(UTK.categoryB / UTK.total).toBeGreaterThan(0.9)
  })
})
