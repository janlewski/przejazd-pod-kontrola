import { describe, expect, it } from 'vitest'
import {
  planCrossingGap,
  planCrossingMove,
  passClearMs,
  CROSSING,
} from '@/components/landing/crossingTraffic'

/** Deterministic stand-in for Math.random. */
function lcg(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

describe('planCrossingMove', () => {
  const rand = lcg(7)
  const moves = Array.from({ length: 2000 }, () => planCrossingMove(rand))

  it('always sends at least one train', () => {
    expect(moves.every((move) => move.upper || move.lower)).toBe(true)
  })

  it('sometimes uses one track and sometimes both', () => {
    const both = moves.filter((move) => move.upper && move.lower).length / moves.length
    const upperOnly = moves.filter((move) => move.upper && !move.lower).length
    const lowerOnly = moves.filter((move) => !move.upper && move.lower).length
    expect(both).toBeGreaterThan(0.3)
    expect(both).toBeLessThan(0.6)
    expect(upperOnly).toBeGreaterThan(200)
    expect(lowerOnly).toBeGreaterThan(200)
  })

  it('staggers the two trains and lets a single train start immediately', () => {
    for (const move of moves) {
      if (move.upper && move.lower) {
        const delays = [move.upperDelay, move.lowerDelay].sort((a, b) => a - b)
        expect(delays[0]).toBe(0)
        expect(delays[1]).toBeGreaterThanOrEqual(CROSSING.staggerMs[0])
        expect(delays[1]).toBeLessThanOrEqual(CROSSING.staggerMs[1])
      } else {
        expect(move.upperDelay).toBe(0)
        expect(move.lowerDelay).toBe(0)
      }
      expect(move.upperMs).toBeGreaterThanOrEqual(CROSSING.trainMs[0])
      expect(move.upperMs).toBeLessThanOrEqual(CROSSING.trainMs[1])
    }
  })

  it('keeps the barrier down until the later train has cleared', () => {
    for (const move of moves) {
      const latest = Math.max(
        move.upper ? move.upperDelay + move.upperMs : 0,
        move.lower ? move.lowerDelay + move.lowerMs : 0,
      )
      expect(passClearMs(move)).toBe(latest + CROSSING.clearMs)
    }
  })
})

describe('planCrossingGap', () => {
  it('stays inside the idle range and favours shorter waits', () => {
    const rand = lcg(11)
    const gaps = Array.from({ length: 2000 }, () => planCrossingGap(rand))
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(CROSSING.gapMs[0])
    expect(Math.max(...gaps)).toBeLessThanOrEqual(CROSSING.gapMs[1])
    const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
    const midpoint = (CROSSING.gapMs[0] + CROSSING.gapMs[1]) / 2
    expect(mean).toBeLessThan(midpoint)
  })
})
