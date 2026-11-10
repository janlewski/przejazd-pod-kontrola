import { describe, expect, it } from 'vitest'
import { parseCrossingNumber } from '@/lib/format'
import { assertRegionalSanity, parsePage, toCrossing } from '../scripts/fetch-crossings'
import {
  axisOrderForSrsName,
  epsg2180ToWgs84,
  isInPoland,
  pointToPolylinesDistanceM,
  pointToSegmentDistanceM,
} from '../scripts/lib/geo'
import { baseRoadNumbers, indexSegments, isGradeSeparatedOnly, matchCrossing } from '../scripts/match-gpr'

function haversineM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371008.8
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Raw GML positions (urn:ogc:def:crs:EPSG::2180, northing easting) from the 2026-11-10 WFS
 * snapshot, and OpenStreetMap railway=level_crossing nodes with the same `ref`
 * (number from the yellow PLK sticker), queried once via Overpass on 2026-11-10.
 */
const KNOWN = [
  {
    id: 'PKP_PLK.1',
    ref: '231 008 414',
    pos: [537737.733, 451828.374],
    osm: { lat: 52.7031691, lon: 18.2868619 },
  },
  {
    id: 'PKP_PLK.76',
    ref: '273 246 862',
    pos: [525410.432038, 205038.804924],
    osm: { lat: 52.5145133, lon: 14.6510475 },
  },
  {
    id: 'PKP_PLK.5145',
    ref: '108 107 308',
    pos: [192333.096, 731600.642],
    osm: { lat: 49.5540641, lon: 22.2033236 },
  },
  {
    id: 'PKP_PLK.8863',
    ref: '082 006 629',
    pos: [404088.373, 691734.714],
    osm: { lat: 51.470811, lon: 21.761549 },
  },
] as const

describe('EPSG:2180 → WGS84', () => {
  it.each(KNOWN)('$id lies within 50 m of OSM node with ref $ref', ({ pos, osm }) => {
    const p = epsg2180ToWgs84(pos[0], pos[1], 'northing-easting')
    expect(isInPoland(p)).toBe(true)
    expect(haversineM(p, osm)).toBeLessThan(50)
  })

  it('a bbox check alone would not catch swapped axes', () => {
    const { pos, osm } = KNOWN[3]
    const swapped = epsg2180ToWgs84(pos[0], pos[1], 'easting-northing')
    expect(isInPoland(swapped)).toBe(true)
    expect(haversineM(swapped, osm)).toBeGreaterThan(100_000)
  })

  it('axis order follows the srsName', () => {
    expect(axisOrderForSrsName('urn:ogc:def:crs:EPSG::2180')).toBe('northing-easting')
    expect(axisOrderForSrsName('EPSG:2180')).toBe('easting-northing')
  })
})

const GML = `<?xml version='1.0' encoding="UTF-8" ?>
<wfs:FeatureCollection xmlns:ms="http://mapserver.gis.umn.edu/mapserver" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:wfs="http://www.opengis.net/wfs/2.0" numberMatched="unknown" numberReturned="1" next="https://example.invalid/next">
  <wfs:member>
    <ms:PKP_PLK gml:id="PKP_PLK.8863">
      <ms:msGeometry><gml:Point gml:id="PKP_PLK.8863.1" srsName="urn:ogc:def:crs:EPSG::2180"><gml:pos>404088.373000 691734.714000</gml:pos></gml:Point></ms:msGeometry>
      <ms:NAZWA>082 006 629</ms:NAZWA>
      <ms:KATEGORIA>D</ms:KATEGORIA>
      <ms:STAC_SZLAK>szlakowy</ms:STAC_SZLAK>
      <ms:IDDE>PKP PLK LUBLIN</ms:IDDE>
    </ms:PKP_PLK>
  </wfs:member>
</wfs:FeatureCollection>`

describe('WFS GML parsing', () => {
  it('parses a page and keeps the sticker number as a string', () => {
    const { features, hasNext } = parsePage(GML)
    expect(hasNext).toBe(true)
    const c = toCrossing(features[0]!)
    expect(c).toMatchObject({
      id: 'PKP_PLK.8863',
      name: '082 006 629',
      category: 'D',
      locationType: 'szlakowy',
      unit: 'PKP PLK LUBLIN',
    })
    expect(haversineM(c, KNOWN[3].osm)).toBeLessThan(50)
  })

  it('normalises unknown category / location type to null', () => {
    const { features } = parsePage(GML.replace('>D<', '>?<').replace('>szlakowy<', '><'))
    const c = toCrossing(features[0]!)
    expect(c.category).toBeNull()
    expect(c.locationType).toBeNull()
  })

  it('rejects non-FeatureCollection responses (service errors)', () => {
    expect(() => parsePage('<ows:ExceptionReport>err</ows:ExceptionReport>')).toThrow(/FeatureCollection/)
  })

  it('regional sanity check fails on swapped axes', () => {
    const lublin = { ...toCrossing(parsePage(GML).features[0]!) }
    expect(() => assertRegionalSanity([lublin])).not.toThrow()
    expect(() => assertRegionalSanity([{ ...lublin, lon: 17.6 }])).toThrow(/LUBLIN/)
  })

  it('sticker number → line and kilometre', () => {
    expect(parseCrossingNumber('082 006 629')).toEqual({ line: '082', km: '6,629' })
    expect(parseCrossingNumber('273 246 862')).toEqual({ line: '273', km: '246,862' })
    expect(parseCrossingNumber('PKP_PLK.1')).toBeNull()
  })
})

describe('GPR matching', () => {
  it('point-to-segment distance', () => {
    // 0.001° of latitude ≈ 111 m.
    expect(pointToSegmentDistanceM([19, 52.001], [18.99, 52], [19.01, 52])).toBeCloseTo(111.2, 0)
    expect(pointToSegmentDistanceM([19, 52], [19, 52], [19, 52])).toBe(0)
    expect(
      pointToPolylinesDistanceM(
        [19, 52],
        [
          [
            [19, 52],
            [19, 53],
          ],
        ],
      ),
    ).toBe(0)
  })

  it('road numbers: sections and concurrent roads; A/S are grade-separated', () => {
    expect([...baseRoadNumbers('50f; 50; 50a')]).toEqual(['50'])
    expect(isGradeSeparatedOnly('S7; S7a')).toBe(true)
    expect(isGradeSeparatedOnly('6f; S6')).toBe(false)
    expect(isGradeSeparatedOnly('A4')).toBe(true)
  })

  const seg = (id: number, roadNumber: string, aadt: number | null, latOffset: number) => ({
    id,
    roadNumber,
    name: null,
    aadt,
    lines: [
      [
        [18.99, 52 + latOffset],
        [19.01, 52 + latOffset],
      ] as [number, number][],
    ],
  })
  const at = (dLatM: number) => ({ id: 'T', lat: 52 + dLatM / 111_195, lon: 19 })

  it('high / approximate / none by distance', () => {
    const segments = indexSegments([seg(1, '15', 5000, 0)])
    expect(matchCrossing(at(10), segments)!.confidence).toBe('high')
    expect(matchCrossing(at(60), segments)!.confidence).toBe('approximate')
    expect(matchCrossing(at(150), segments)).toBeNull()
  })

  it('ambiguous when another road or another AADT is within range', () => {
    const otherRoad = indexSegments([seg(1, '15', 5000, 0), seg(2, '22', 7000, 0.0005)])
    expect(matchCrossing(at(5), otherRoad)!.confidence).toBe('ambiguous')
    const sameRoadOtherAadt = indexSegments([seg(1, '15', 5000, 0), seg(2, '15a', 7000, 0.0001)])
    expect(matchCrossing(at(5), sameRoadOtherAadt)!.confidence).toBe('ambiguous')
    const sameRoadSameAadt = indexSegments([seg(1, '15', 5000, 0), seg(2, '15a', 5000, 0.0001)])
    expect(matchCrossing(at(5), sameRoadSameAadt)!.confidence).toBe('high')
  })

  it('ignores motorways and expressways', () => {
    expect(matchCrossing(at(1), indexSegments([seg(1, 'S7', 40000, 0)]))).toBeNull()
  })
})
