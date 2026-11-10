/**
 * Level crossings from the GUGiK WFS (PKP PLK layer) → src/data/crossings.json.
 *
 *   pnpm exec tsx scripts/fetch-crossings.ts                       # download, snapshot, build
 *   pnpm exec tsx scripts/fetch-crossings.ts --from-snapshot=data/raw/crossings-20261110
 *   pnpm exec tsx scripts/fetch-crossings.ts --bbox=minLon,minLat,maxLon,maxLat
 *
 * The service rejects OUTPUTFORMAT=application/json, so GML 3.2 is used.
 * `--bbox` filters locally (WGS84) after parsing; the snapshot always holds the full layer.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { XMLParser } from 'fast-xml-parser'
import { z } from 'zod'
import { Crossing } from '../src/domain/schemas.ts'
import { axisOrderForSrsName, epsg2180ToWgs84, isInPoland } from './lib/geo.ts'
import { ROOT, argValue, isMain, todayIso, upsertSource } from './lib/sources.ts'

const ENDPOINT = 'https://mapy.geoportal.gov.pl/wss/service/wfs/sdi/Przejazdy'
const TYPENAME = 'ms:PKP_PLK'
const PAGE_SIZE = 1000
const PAUSE_MS = 1000
const USER_AGENT =
  'przejazd-pod-kontrola/0.1 (demo konkursowe; https://github.com/janlewski/przejazd-pod-kontrola)'
const OUTPUT = path.join(ROOT, 'src/data/crossings.json')
export const SOURCE_ID = 'gugik-wfs-przejazdy'

type RawFeature = {
  id: string
  pos: [number, number]
  srsName: string
  name: string
  category: string
  locationType: string
  unit: string
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: false,
  isArray: (name) => name === 'member',
})

export function parsePage(xml: string): { features: RawFeature[]; hasNext: boolean } {
  const doc = parser.parse(xml)
  const fc = doc.FeatureCollection
  if (!fc) {
    const message = JSON.stringify(doc).slice(0, 500)
    throw new Error(`Odpowiedź WFS nie jest FeatureCollection: ${message}`)
  }
  const members: unknown[] = fc.member ?? []
  const features = members.map((m) => {
    const f = (m as { PKP_PLK: Record<string, unknown> }).PKP_PLK
    const point = (f.msGeometry as { Point: { pos: string; '@_srsName': string } }).Point
    const [a, b] = point.pos.trim().split(/\s+/).map(Number)
    if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error(`Błędna geometria: ${point.pos}`)
    return {
      id: String(f['@_id']),
      pos: [a!, b!] as [number, number],
      srsName: point['@_srsName'],
      name: String(f.NAZWA ?? '').trim(),
      category: String(f.KATEGORIA ?? '').trim(),
      locationType: String(f.STAC_SZLAK ?? '').trim(),
      unit: String(f.IDDE ?? '').trim(),
    }
  })
  return { features, hasNext: typeof fc['@_next'] === 'string' && features.length > 0 }
}

export function toCrossing(raw: RawFeature): z.infer<typeof Crossing> {
  const { lat, lon } = epsg2180ToWgs84(raw.pos[0], raw.pos[1], axisOrderForSrsName(raw.srsName))
  if (!isInPoland({ lat, lon })) {
    throw new Error(`Punkt ${raw.id} poza Polską po reprojekcji: ${lat}, ${lon}`)
  }
  const category = raw.category.toUpperCase()
  const locationType = raw.locationType.toLowerCase()
  return Crossing.parse({
    id: raw.id,
    name: raw.name || raw.id,
    category: /^[A-F]$/.test(category) ? category : null,
    locationType: locationType === 'szlakowy' || locationType === 'stacyjny' ? locationType : null,
    unit: raw.unit || null,
    lat,
    lon,
    origin: 'real',
    sourceId: SOURCE_ID,
  })
}

/**
 * Dataset-level axis-order check: crossings managed by the Lublin unit must lie east of
 * those managed by the Szczecin unit. Fails loudly if the axes were swapped.
 */
export function assertRegionalSanity(crossings: z.infer<typeof Crossing>[]): void {
  const meanLon = (unit: string) => {
    const pts = crossings.filter((c) => c.unit?.toUpperCase().includes(unit))
    return pts.length ? pts.reduce((s, c) => s + c.lon, 0) / pts.length : null
  }
  const lublin = meanLon('LUBLIN')
  const szczecin = meanLon('SZCZECIN')
  if (lublin !== null && lublin < 21) throw new Error(`Kontrola osi: LUBLIN średnio lon=${lublin}`)
  if (szczecin !== null && szczecin > 16.5) throw new Error(`Kontrola osi: SZCZECIN średnio lon=${szczecin}`)
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

async function download(snapshotDir: string): Promise<string[]> {
  fs.mkdirSync(snapshotDir, { recursive: true })
  const pages: string[] = []
  for (let page = 0; ; page++) {
    const url = new URL(ENDPOINT)
    url.search = new URLSearchParams({
      SERVICE: 'WFS',
      VERSION: '2.0.0',
      REQUEST: 'GetFeature',
      TYPENAMES: TYPENAME,
      COUNT: String(PAGE_SIZE),
      STARTINDEX: String(page * PAGE_SIZE),
    }).toString()
    let res: Response
    try {
      res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    } catch (err) {
      throw new Error(`Usługa WFS niedostępna (${url}): ${(err as Error).message}`)
    }
    if (!res.ok) throw new Error(`WFS zwrócił HTTP ${res.status} dla ${url}`)
    const xml = await res.text()
    const { features, hasNext } = parsePage(xml)
    if (features.length === 0) break
    const file = path.join(snapshotDir, `page-${String(page).padStart(4, '0')}.gml.gz`)
    fs.writeFileSync(file, zlib.gzipSync(xml, { level: 9 }))
    pages.push(file)
    console.log(`strona ${page}: ${features.length} obiektów`)
    if (!hasNext) break
    await sleep(PAUSE_MS)
  }
  return pages
}

function readSnapshot(snapshotDir: string): string[] {
  if (!fs.existsSync(snapshotDir)) throw new Error(`Brak snapshotu: ${snapshotDir}`)
  return fs
    .readdirSync(snapshotDir)
    .filter((f) => f.endsWith('.gml.gz'))
    .sort()
    .map((f) => path.join(snapshotDir, f))
}

function parseBbox(value: string | undefined) {
  if (!value) return null
  const [minLon, minLat, maxLon, maxLat] = value.split(',').map(Number)
  if ([minLon, minLat, maxLon, maxLat].some((n) => !Number.isFinite(n))) {
    throw new Error('--bbox wymaga formatu minLon,minLat,maxLon,maxLat')
  }
  return { minLon: minLon!, minLat: minLat!, maxLon: maxLon!, maxLat: maxLat! }
}

async function main() {
  const fromSnapshot = argValue('from-snapshot')
  const bbox = parseBbox(argValue('bbox'))
  const snapshotDir = fromSnapshot
    ? path.resolve(ROOT, fromSnapshot)
    : path.join(ROOT, `data/raw/crossings-${todayIso().replaceAll('-', '')}`)
  const retrievedAt = fromSnapshot
    ? (/(\d{4})(\d{2})(\d{2})/.exec(path.basename(snapshotDir)) ?? []).slice(1, 4).join('-') || todayIso()
    : todayIso()

  const files = fromSnapshot ? readSnapshot(snapshotDir) : await download(snapshotDir)
  const byId = new Map<string, z.infer<typeof Crossing>>()
  for (const file of files) {
    const xml = zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')
    for (const raw of parsePage(xml).features) byId.set(raw.id, toCrossing(raw))
  }
  const all = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
  assertRegionalSanity(all)

  const crossings = bbox
    ? all.filter(
        (c) => c.lat >= bbox.minLat && c.lat <= bbox.maxLat && c.lon >= bbox.minLon && c.lon <= bbox.maxLon,
      )
    : all

  fs.writeFileSync(OUTPUT, '[\n' + crossings.map((c) => JSON.stringify(c)).join(',\n') + '\n]\n')
  console.log(`zapisano ${crossings.length} przejazdów (z ${all.length}) → ${path.relative(ROOT, OUTPUT)}`)

  upsertSource({
    kind: 'dataset',
    id: SOURCE_ID,
    title: 'Przejazdy kolejowo-drogowe PKP PLK (usługa WFS, warstwa ms:PKP_PLK)',
    shortTitle: 'WFS GUGiK / PKP PLK',
    publisher: 'Główny Urząd Geodezji i Kartografii / PKP Polskie Linie Kolejowe S.A.',
    url: `${ENDPOINT}?SERVICE=WFS&REQUEST=GetCapabilities`,
    retrievedAt,
    license:
      'Warunki nieopublikowane w opisie usługi — dane publiczne, wykorzystane z podaniem źródła (do weryfikacji przed publikacją).',
    processing: [
      `WFS 2.0.0 GetFeature, GML 3.2, paginacja COUNT=${PAGE_SIZE}/STARTINDEX; surowy snapshot w ${path.relative(ROOT, snapshotDir)}.`,
      'Reprojekcja EPSG:2180 → EPSG:4326 (proj4), kolejność osi northing, easting wg urn:ogc:def:crs:EPSG::2180, kontrola regionalna (PLK Lublin na wschodzie, PLK Szczecin na zachodzie).',
      'Zachowane pola: gml:id, NAZWA (numer przejazdu), KATEGORIA, STAC_SZLAK, IDDE.',
      bbox ? `Ograniczenie zasięgu do bbox ${argValue('bbox')} (WGS84).` : 'Pełny zasięg warstwy.',
    ].join(' '),
    records: crossings.length,
  })
}

if (isMain(import.meta.url)) {
  main().catch((err: unknown) => {
    console.error(`BŁĄD: ${(err as Error).message}`)
    process.exit(1)
  })
}
