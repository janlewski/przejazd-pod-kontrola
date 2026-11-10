/**
 * Attaches each fictional case X1–X10 to a real crossing from the WFS snapshot.
 *
 *   pnpm exec tsx scripts/assign-cases.ts
 *
 * Rule (deterministic, no hand-picking): same category as the case, the location type and
 * PLK unit listed below, no GPR match (so the case's fictional traffic cannot contradict real
 * data), a parseable 9-digit number, not already used; lowest WFS object number wins.
 * The crossing supplies number, position, category and unit; every event stays fictional.
 */
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { Crossing, FictionalCase, GprMatch } from '../src/domain/schemas.ts'
import { ROOT, isMain } from './lib/sources.ts'

const CASES_PATH = path.join(ROOT, 'src/data/fictional-cases.json')

/** Spread across PLK units; station crossings where the pattern needs a stop or a junction. */
const PLACEMENT: Record<string, { unit: string; locationType: 'szlakowy' | 'stacyjny' }> = {
  X1: { unit: 'PKP PLK KRAKÓW', locationType: 'szlakowy' },
  X2: { unit: 'PKP PLK POZNAŃ', locationType: 'stacyjny' },
  X3: { unit: 'PKP PLK LUBLIN', locationType: 'szlakowy' },
  X4: { unit: 'PKP PLK WARSZAWA', locationType: 'szlakowy' },
  X5: { unit: 'PKP PLK SZCZECIN', locationType: 'szlakowy' },
  X6: { unit: 'PKP PLK WROCŁAW', locationType: 'szlakowy' },
  X7: { unit: 'PKP PLK GDAŃSK', locationType: 'szlakowy' },
  X8: { unit: 'PKP PLK SOSNOWIEC', locationType: 'szlakowy' },
  X9: { unit: 'PKP PLK WARSZAWA', locationType: 'stacyjny' },
  X10: { unit: 'PKP PLK GDAŃSK', locationType: 'szlakowy' },
}

const objectNumber = (id: string) => Number(id.split('.').at(-1))

const CaseWithoutCrossing = FictionalCase.omit({ crossing: true })

export function assignCases(
  cases: z.infer<typeof CaseWithoutCrossing>[],
  crossings: z.infer<typeof Crossing>[],
  matches: z.infer<typeof GprMatch>[],
): z.infer<typeof FictionalCase>[] {
  const matched = new Set(matches.map((m) => m.crossingId))
  const used = new Set<string>()
  return cases.map((c) => {
    const placement = PLACEMENT[c.id]
    if (!placement) throw new Error(`Brak reguły rozmieszczenia dla ${c.id}`)
    const pick = crossings
      .filter(
        (x) =>
          x.category === c.category &&
          x.locationType === placement.locationType &&
          x.unit === placement.unit &&
          !matched.has(x.id) &&
          !used.has(x.id) &&
          /^\d{3} \d{3} \d{3}$/.test(x.name),
      )
      .sort((a, b) => objectNumber(a.id) - objectNumber(b.id))[0]
    if (!pick) throw new Error(`Brak przejazdu spełniającego regułę dla ${c.id}`)
    used.add(pick.id)
    const { id, name, origin, ...rest } = c
    return FictionalCase.parse({
      id,
      name,
      origin,
      crossing: { id: pick.id, name: pick.name, unit: pick.unit, lat: pick.lat, lon: pick.lon },
      ...rest,
    })
  })
}

function main() {
  const read = (rel: string) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'))
  const cases = z.array(CaseWithoutCrossing).parse(read('src/data/fictional-cases.json'))
  const crossings = z.array(Crossing).parse(read('src/data/crossings.json'))
  const matches = z.array(GprMatch).parse(read('src/data/gpr-match.json'))
  const assigned = assignCases(cases, crossings, matches)
  fs.writeFileSync(CASES_PATH, JSON.stringify(assigned, null, 2) + '\n')
  for (const c of assigned) console.log(`${c.id} → ${c.crossing.name} (${c.crossing.id}, ${c.crossing.unit})`)
}

if (isMain(import.meta.url)) main()
