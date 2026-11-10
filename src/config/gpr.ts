/**
 * Crossing ↔ GPR 2025 segment matching (scripts/match-gpr.ts).
 *
 * GPR "Web" geometry is simplified (a counting segment is usually a straight chord between
 * two junctions), so distance to the chord only approximates distance to the carriageway.
 * These values are heuristics, not validated thresholds; anything above HIGH is flagged
 * for data verification instead of being presented as fact.
 */
export const GPR_MATCH_HIGH_M = 25
export const GPR_MATCH_MAX_M = 100

/** Motorways (A) and expressways (S) are grade-separated: no level crossings by definition. */
export const GPR_EXCLUDED_ROAD_PREFIX = /^[AS]/i
