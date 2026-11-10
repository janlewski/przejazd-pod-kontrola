/**
 * Crossing ↔ GPR 2025 segment → src/data/gpr-match.json (matched crossings only).
 *
 *   pnpm exec tsx scripts/match-gpr.ts
 *
 * No match means "no GPR data" (absent record), never zero traffic.
 */
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { GPR_EXCLUDED_ROAD_PREFIX, GPR_MATCH_HIGH_M, GPR_MATCH_MAX_M } from '../src/config/gpr.ts'
import { Crossing, GprMatch } from '../src/domain/schemas.ts'
import { SOURCE_ID as CROSSINGS_SOURCE_ID } from './fetch-crossings.ts'
import { pointToPolylinesDistanceM } from './lib/geo.ts'
import { GPR_SEGMENTS_PATH, GPR_SOURCE_ID, GprSegment } from './lib/gpr.ts'
import { ROOT, isMain, sourceRetrievedAt, upsertSource } from './lib/sources.ts'

const OUTPUT = path.join(ROOT, 'src/data/gpr-match.json')
export const MATCH_SOURCE_ID = 'derived-gpr-match'

type Segment = z.infer<typeof GprSegment>
type Match = z.infer<typeof GprMatch>

/** Degrees of margin for the bbox prefilter; generous for latitudes in Poland. */
const BBOX_MARGIN_DEG = (GPR_MATCH_MAX_M * 2) / 111_000 / Math.cos((55 * Math.PI) / 180)

type IndexedSegment = Segment & { bbox: [number, number, number, number] }

export function indexSegments(segments: Segment[]): IndexedSegment[] {
  return segments
    .filter((s) => !isGradeSeparatedOnly(s.roadNumber))
    .map((s) => {
      const pts = s.lines.flat()
      const lons = pts.map((p) => p[0])
      const lats = pts.map((p) => p[1])
      return {
        ...s,
        bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
      }
    })
}

/**
 * Base road numbers of a GPR `NRDROGI` value. "62g" and "62" are sections of the same road;
 * "50f; 50; 50a" lists concurrent sections.
 */
export function baseRoadNumbers(roadNumber: string): Set<string> {
  return new Set(
    roadNumber
      .split(';')
      .map((part) => part.trim().replace(/[a-z]+$/, ''))
      .filter(Boolean),
  )
}

export function isGradeSeparatedOnly(roadNumber: string): boolean {
  return [...baseRoadNumbers(roadNumber)].every((r) => GPR_EXCLUDED_ROAD_PREFIX.test(r))
}

function sharesRoad(a: Set<string>, b: Set<string>): boolean {
  for (const r of a) if (b.has(r)) return true
  return false
}

export function matchCrossing(
  crossing: Pick<z.infer<typeof Crossing>, 'id' | 'lat' | 'lon'>,
  segments: IndexedSegment[],
): Match | null {
  const p: [number, number] = [crossing.lon, crossing.lat]
  const candidates = segments
    .filter(
      (s) =>
        p[0] >= s.bbox[0] - BBOX_MARGIN_DEG &&
        p[0] <= s.bbox[2] + BBOX_MARGIN_DEG &&
        p[1] >= s.bbox[1] - BBOX_MARGIN_DEG &&
        p[1] <= s.bbox[3] + BBOX_MARGIN_DEG,
    )
    .map((s) => ({ segment: s, distanceM: pointToPolylinesDistanceM(p, s.lines) }))
    .filter((c) => c.distanceM <= GPR_MATCH_MAX_M)
    .sort((a, b) => a.distanceM - b.distanceM)

  const nearest = candidates[0]
  if (!nearest) return null

  const roads = baseRoadNumbers(nearest.segment.roadNumber)
  const otherRoad = candidates.some((c) => !sharesRoad(roads, baseRoadNumbers(c.segment.roadNumber)))
  const conflictingAadt = candidates.some(
    (c) => c.distanceM <= GPR_MATCH_HIGH_M && c.segment.aadt !== nearest.segment.aadt,
  )
  const confidence: Match['confidence'] =
    otherRoad || conflictingAadt
      ? 'ambiguous'
      : nearest.distanceM <= GPR_MATCH_HIGH_M
        ? 'high'
        : 'approximate'

  return GprMatch.parse({
    crossingId: crossing.id,
    roadNumber: nearest.segment.roadNumber,
    segmentName: nearest.segment.name,
    aadt: nearest.segment.aadt,
    distanceM: Math.round(nearest.distanceM * 10) / 10,
    confidence,
    origin: 'derived',
    sourceId: MATCH_SOURCE_ID,
  })
}

function main() {
  const crossings = z
    .array(Crossing)
    .parse(JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/crossings.json'), 'utf8')))
  const segments = indexSegments(
    z.array(GprSegment).parse(JSON.parse(fs.readFileSync(GPR_SEGMENTS_PATH, 'utf8'))),
  )
  const matches = crossings.map((c) => matchCrossing(c, segments)).filter((m): m is Match => m !== null)

  fs.writeFileSync(OUTPUT, '[\n' + matches.map((m) => JSON.stringify(m)).join(',\n') + '\n]\n')
  const by = (k: Match['confidence']) => matches.filter((m) => m.confidence === k).length
  console.log(
    `dopasowano ${matches.length}/${crossings.length} (high ${by('high')}, approximate ${by('approximate')}, ambiguous ${by('ambiguous')})`,
  )

  upsertSource({
    kind: 'dataset',
    id: MATCH_SOURCE_ID,
    title: 'Dopasowanie przejazdów do odcinków GPR 2025 (dane pochodne)',
    shortTitle: 'dopasowanie GPR (opracowanie własne)',
    publisher: 'Opracowanie własne na podstawie gugik-wfs-przejazdy i gddkia-gpr-2025',
    url: 'https://github.com/janlewski/przejazd-pod-kontrola/blob/main/scripts/match-gpr.ts',
    // Derived data is dated by its newest input, so rebuilding from snapshots is reproducible.
    retrievedAt: [sourceRetrievedAt(CROSSINGS_SOURCE_ID), sourceRetrievedAt(GPR_SOURCE_ID)].sort().at(-1)!,
    license: 'Dane pochodne — warunki jak dla danych źródłowych.',
    processing: [
      `Najbliższy odcinek GPR (bez autostrad i dróg ekspresowych — brak przejazdów w poziomie szyn) w promieniu ${GPR_MATCH_MAX_M} m.`,
      `Pewność „high” ≤ ${GPR_MATCH_HIGH_M} m; „approximate” ${GPR_MATCH_HIGH_M}–${GPR_MATCH_MAX_M} m (uproszczona geometria GPR);`,
      `„ambiguous”, gdy w promieniu jest inna droga lub odcinek z innym SDRR. Brak dopasowania = brak rekordu, nie zero. Źródło GPR: ${GPR_SOURCE_ID}.`,
    ].join(' '),
    records: matches.length,
  })
}

if (isMain(import.meta.url)) main()
