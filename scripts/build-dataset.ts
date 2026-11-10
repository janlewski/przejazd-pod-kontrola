/**
 * Rebuilds every committed dataset from the snapshots in data/raw (offline) and validates
 * all files in src/data against the Zod schemas.
 *
 *   pnpm exec tsx scripts/build-dataset.ts
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { Crossing, FictionalCase, GprMatch, SourceRef } from '../src/domain/schemas.ts'
import { ROOT } from './lib/sources.ts'

function latest(prefix: string, suffix = ''): string {
  const dir = path.join(ROOT, 'data/raw')
  const found = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith(suffix))
    .sort()
    .at(-1)
  if (!found) throw new Error(`Brak snapshotu ${prefix}* w data/raw`)
  return path.join('data/raw', found)
}

function run(script: string, ...args: string[]) {
  execFileSync(process.execPath, ['--import', 'tsx', path.join('scripts', script), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
  })
}

function readJson(rel: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'))
}

run('fetch-crossings.ts', `--from-snapshot=${latest('crossings-')}`)
run('parse-gpr.ts', `--from-snapshot=${latest('gpr2025-', '.zip')}`)
run('match-gpr.ts')
run('assign-cases.ts')

const crossings = z.array(Crossing).parse(readJson('src/data/crossings.json'))
const matches = z.array(GprMatch).parse(readJson('src/data/gpr-match.json'))
const cases = z.array(FictionalCase).parse(readJson('src/data/fictional-cases.json'))
const sources = z.array(SourceRef).parse(readJson('src/data/sources.json'))

const ids = new Set(crossings.map((c) => c.id))
const orphan = matches.find((m) => !ids.has(m.crossingId))
if (orphan) throw new Error(`Dopasowanie GPR bez przejazdu: ${orphan.crossingId}`)
for (const c of cases) {
  if (!ids.has(c.crossing.id)) throw new Error(`Przypadek ${c.id} wskazuje nieistniejący przejazd`)
}
const sourceIds = new Set(sources.map((s) => s.id))
for (const id of new Set([...crossings, ...matches].map((r) => r.sourceId))) {
  if (!sourceIds.has(id)) throw new Error(`Brak wpisu w sources.json: ${id}`)
}

console.log(
  `OK: ${crossings.length} przejazdów, ${matches.length} dopasowań GPR, ${cases.length} przypadków fikcyjnych, ${sources.length} źródeł`,
)
