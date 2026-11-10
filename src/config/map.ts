/**
 * Base map. Standard OSM tiles are used for normal, human-driven browsing only
 * (OSMF Tile Usage Policy): no prefetching, no offline mode, attribution always visible.
 */
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'
export const TILE_MAX_ZOOM = 19

export const POLAND_CENTER: [number, number] = [52.07, 19.48]
export const POLAND_ZOOM = 6
export const POLAND_BOUNDS: [[number, number], [number, number]] = [
  [48.8, 13.8],
  [55.1, 24.4],
]
