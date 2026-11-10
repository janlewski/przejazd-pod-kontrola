/**
 * Published figures quoted in the UI. Each one names its source and location.
 *
 * UTK, Raport w sprawie bezpieczeństwa za 2025, PDF p. 18: „W latach 2021–2025 na 3 336 incydentów
 * kategorii C64 oraz kategorii C66, do których doszło z winy użytkowników PKD i przejść, 90,45%
 * (3 034 incydenty) miało miejsce na przejazdach kategorii B.”
 * The counts are quoted rather than the share: 3 034 / 3 336 is 90,95%, not 90,45%.
 */
export const UTK_USER_INCIDENTS_2021_2025 = {
  total: 3336,
  categoryB: 3034,
  years: '2021–2025',
  incidentCategories: 'C64 i C66',
  sourceId: 'utk-raport-2025',
  page: 18,
} as const
