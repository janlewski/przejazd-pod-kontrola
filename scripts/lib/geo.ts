import proj4 from 'proj4'

export const EPSG_2180 =
  '+proj=tmerc +lat_0=0 +lon_0=19 +k=0.9993 +x_0=500000 +y_0=-5300000 +ellps=GRS80 +units=m +no_defs'

const toWgs84 = proj4(EPSG_2180, 'EPSG:4326')

export const POLAND_BBOX = { minLat: 49, maxLat: 55, minLon: 14, maxLon: 24.2 }

export type LatLon = { lat: number; lon: number }

export function isInPoland({ lat, lon }: LatLon): boolean {
  return (
    lat >= POLAND_BBOX.minLat &&
    lat <= POLAND_BBOX.maxLat &&
    lon >= POLAND_BBOX.minLon &&
    lon <= POLAND_BBOX.maxLon
  )
}

/**
 * Converts an EPSG:2180 position to WGS84.
 * `urn:ogc:def:crs:EPSG::2180` declares axis order northing, easting (EPSG register),
 * which is what the GUGiK WFS emits in GML 3.2. A bbox test alone cannot detect a swap,
 * because both orders of a typical point fall inside Poland.
 */
export function epsg2180ToWgs84(
  first: number,
  second: number,
  axisOrder: 'northing-easting' | 'easting-northing',
): LatLon {
  const [easting, northing] = axisOrder === 'northing-easting' ? [second, first] : [first, second]
  const [lon, lat] = toWgs84.forward([easting, northing])
  return { lat: round(lat!, 6), lon: round(lon!, 6) }
}

export function axisOrderForSrsName(srsName: string): 'northing-easting' | 'easting-northing' {
  return /^urn:ogc:def:crs:EPSG::2180$/i.test(srsName) ? 'northing-easting' : 'easting-northing'
}

const EARTH_RADIUS_M = 6371008.8
const RAD = Math.PI / 180

/**
 * Distance in metres from a point to a segment ([lon, lat] pairs), using a local
 * equirectangular projection centred on the point. Error is well under 1 m below 1 km.
 */
export function pointToSegmentDistanceM(
  p: readonly [number, number],
  a: readonly [number, number],
  b: readonly [number, number],
): number {
  const kx = Math.cos(p[1] * RAD) * EARTH_RADIUS_M * RAD
  const ky = EARTH_RADIUS_M * RAD
  const ax = (a[0] - p[0]) * kx
  const ay = (a[1] - p[1]) * ky
  const bx = (b[0] - p[0]) * kx
  const by = (b[1] - p[1]) * ky
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2))
  return Math.hypot(ax + t * dx, ay + t * dy)
}

export function pointToPolylinesDistanceM(
  p: readonly [number, number],
  lines: readonly (readonly (readonly [number, number])[])[],
): number {
  let best = Infinity
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      best = Math.min(best, pointToSegmentDistanceM(p, line[i]!, line[i + 1]!))
    }
  }
  return best
}

function round(value: number, digits: number): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}
