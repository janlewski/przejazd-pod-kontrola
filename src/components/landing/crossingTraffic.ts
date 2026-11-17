/** Timing for one warning-and-pass on the landing diagram. Distances are not a timetable. */
export const CROSSING = {
  /** Lamps start this long before the barrier begins to fall. */
  lampsLeadMs: 650,
  barrierMs: 900,
  /** Hold the barrier down after the last car has cleared. */
  clearMs: 400,
  /** Lamps stay on until the barrier is up, then a short tail. */
  lampsTailMs: 350,
  trainMs: [6000, 7800] as const,
  /** When two trains run, one of them enters this much later. */
  staggerMs: [400, 1800] as const,
  /** Idle after the lamps go dark, before the next warning. */
  gapMs: [400, 2400] as const,
  /** Share of passes that use both tracks at once, in opposite directions. */
  bothChance: 0.45,
}

export type CrossingMove = {
  /** Upper track, left to right. */
  upper: boolean
  /** Lower track, right to left. */
  lower: boolean
  upperDelay: number
  lowerDelay: number
  upperMs: number
  lowerMs: number
}

const between = (rand: () => number, min: number, max: number) => min + rand() * (max - min)

/** One pass: a single train on a random track, or both tracks at once. */
export function planCrossingMove(rand: () => number = Math.random): CrossingMove {
  const both = rand() < CROSSING.bothChance
  const upper = both || rand() < 0.5
  const lower = both || !upper
  const stagger = both ? between(rand, CROSSING.staggerMs[0], CROSSING.staggerMs[1]) : 0
  const upperFirst = rand() < 0.5
  return {
    upper,
    lower,
    upperDelay: both && !upperFirst ? stagger : 0,
    lowerDelay: both && upperFirst ? stagger : 0,
    upperMs: between(rand, CROSSING.trainMs[0], CROSSING.trainMs[1]),
    lowerMs: between(rand, CROSSING.trainMs[0], CROSSING.trainMs[1]),
  }
}

/** Shorter gaps are more likely, so the diagram does not sit empty. */
export function planCrossingGap(rand: () => number = Math.random): number {
  const [min, max] = CROSSING.gapMs
  return min + rand() ** 2 * (max - min)
}

/** How long the barrier must stay down, measured from the moment it has finished falling. */
export function passClearMs(move: CrossingMove): number {
  const upperEnd = move.upper ? move.upperDelay + move.upperMs : 0
  const lowerEnd = move.lower ? move.lowerDelay + move.lowerMs : 0
  return Math.max(upperEnd, lowerEnd) + CROSSING.clearMs
}
