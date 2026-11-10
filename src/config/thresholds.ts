/**
 * Traffic-product thresholds and traffic-count intervals from
 * Rozporządzenie Ministra Infrastruktury z 9 lipca 2025 r. (Dz.U. 2025 poz. 1105).
 * Regulatory context only — the traffic product is not a risk measure.
 */
export const REGULATION_SOURCE_ID = 'dzu-2025-1105'

/** §8 ust. 1: category B where the traffic product is ≥ 150 000. */
export const TRAFFIC_PRODUCT_B = 150_000

/** §9 pkt 1 and §10 pkt 1: category C from 60 000 (below 150 000); category D below 60 000. */
export const TRAFFIC_PRODUCT_C = 60_000

/** Zał. nr 1 pkt 10: for category D above this last product, GPR SDRR may not be used. */
export const TRAFFIC_PRODUCT_D_GPR_LIMIT = 20_000

/**
 * Zał. nr 1 pkt 1–2: maximum interval between road-traffic counts, in years.
 * Category D depends on the last traffic product: ≤ 20 000 → 5, 20 000–40 000 → 2, > 40 000 → 1.
 */
export const TRAFFIC_COUNT_INTERVAL_ABC_YEARS = 5
export const TRAFFIC_COUNT_INTERVAL_D: ReadonlyArray<{ maxProduct: number; years: number }> = [
  { maxProduct: 20_000, years: 5 },
  { maxProduct: 40_000, years: 2 },
  { maxProduct: Infinity, years: 1 },
]
