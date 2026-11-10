/**
 * GDDKiA GPR 2025 (Generalny Pomiar Ruchu) shapefile → data/derived/gpr-segments.json.
 *
 *   pnpm exec tsx scripts/parse-gpr.ts                                   # download + parse
 *   pnpm exec tsx scripts/parse-gpr.ts --from-snapshot=data/raw/gpr2025-20261110.zip
 *
 * The published "Web" layer covers national roads (DK, incl. S/A) only, and each counting
 * segment is a simplified polyline (median: 2 vertices). Matching must account for that.
 */
import fs from 'node:fs'
import path from 'node:path'
import JSZip from 'jszip'
import shp from 'shpjs'
import { z } from 'zod'
import { isInPoland } from './lib/geo.ts'
import { GPR_SEGMENTS_PATH, GPR_SOURCE_ID, GPR_URL, GprSegment } from './lib/gpr.ts'
import { ROOT, argValue, isMain, todayIso, upsertSource, writeJson } from './lib/sources.ts'

const Props = z.object({
  ID: z.number(),
  NRDROGI: z.union([z.string(), z.number()]),
  NAZWA_ODC: z.string().nullable().optional(),
  SDRR2025: z.number().or(z.nan()).nullable().optional(),
})

const round = (n: number) => Math.round(n * 1e6) / 1e6

async function main() {
  const fromSnapshot = argValue('from-snapshot')
  let zipPath: string
  if (fromSnapshot) {
    zipPath = path.resolve(ROOT, fromSnapshot)
  } else {
    const res = await fetch(GPR_URL, {
      headers: { 'User-Agent': 'przejazd-pod-kontrola/0.1 (demo konkursowe)' },
    }).catch((err: Error) => {
      throw new Error(`Nie udało się pobrać GPR (${GPR_URL}): ${err.message}`)
    })
    if (!res.ok) throw new Error(`GPR: HTTP ${res.status}`)
    zipPath = path.join(ROOT, `data/raw/gpr2025-${todayIso().replaceAll('-', '')}.zip`)
    fs.writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()))
  }
  const zipBuffer = fs.readFileSync(zipPath)

  const zip = await JSZip.loadAsync(zipBuffer)
  const prjFile = Object.keys(zip.files).find((n) => n.toLowerCase().endsWith('.prj'))
  const prj = prjFile ? await zip.file(prjFile)!.async('string') : ''
  if (!/Poland_CS92|CS92|2180/i.test(prj)) {
    throw new Error(`Nieoczekiwany układ współrzędnych w .prj: ${prj.slice(0, 120)}`)
  }

  // shpjs reprojects to WGS84 using the .prj from the archive.
  const parsed = await shp(zipBuffer)
  const fc = Array.isArray(parsed) ? parsed[0]! : parsed
  const segments: GprSegment[] = []
  let skipped = 0
  for (const f of fc.features) {
    const geom = f.geometry
    if (!geom || (geom.type !== 'LineString' && geom.type !== 'MultiLineString')) {
      skipped++
      continue
    }
    const props = Props.parse(f.properties)
    const lines = (geom.type === 'LineString' ? [geom.coordinates] : geom.coordinates).map((line) =>
      line.map(([lon, lat]) => [round(lon!), round(lat!)] as [number, number]),
    )
    const [lon, lat] = lines[0]![0]!
    if (!isInPoland({ lat, lon })) throw new Error(`Odcinek ${props.ID} poza Polską: ${lat}, ${lon}`)
    segments.push(
      GprSegment.parse({
        id: props.ID,
        roadNumber: String(props.NRDROGI).trim(),
        name: props.NAZWA_ODC?.trim() || null,
        aadt:
          typeof props.SDRR2025 === 'number' && Number.isFinite(props.SDRR2025)
            ? Math.round(props.SDRR2025)
            : null,
        lines,
      }),
    )
  }
  writeJson(GPR_SEGMENTS_PATH, segments)
  console.log(`zapisano ${segments.length} odcinków GPR (pominięto bez geometrii: ${skipped})`)

  const retrievedAt =
    (/(\d{4})(\d{2})(\d{2})/.exec(path.basename(zipPath)) ?? []).slice(1, 4).join('-') || todayIso()
  upsertSource({
    kind: 'dataset',
    id: GPR_SOURCE_ID,
    shortTitle: 'GDDKiA, GPR 2025',
    title: 'Generalny Pomiar Ruchu 2025 — średni dobowy ruch roczny (SDRR) na drogach krajowych, warstwa SHP',
    publisher: 'Generalna Dyrekcja Dróg Krajowych i Autostrad',
    url: GPR_URL,
    retrievedAt,
    license:
      'Warunki nieopublikowane przy pliku — dane publiczne, wykorzystane z podaniem źródła (do weryfikacji przed publikacją).',
    processing: [
      `Surowy plik ZIP w ${path.relative(ROOT, zipPath)}.`,
      'Odczyt shpjs, reprojekcja ETRS89 / Poland CS92 (EPSG:2180) → WGS84 wg pliku .prj.',
      'Zachowane pola: ID, NRDROGI, NAZWA_ODC, SDRR2025. Warstwa obejmuje tylko drogi krajowe; geometria odcinków jest uproszczona (zwykle 2 wierzchołki).',
    ].join(' '),
    records: segments.length,
  })
}

if (isMain(import.meta.url)) {
  main().catch((err: unknown) => {
    console.error(`BŁĄD: ${(err as Error).message}`)
    process.exit(1)
  })
}
