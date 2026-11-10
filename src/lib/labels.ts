import type {
  Category,
  CostClass,
  EvidenceStrength,
  GprMatch,
  InspectionLevel,
  ResponsibleParty,
  TaskStatus,
  VerificationLevel,
} from '@/domain/types'

/** Dz.U. 2025 poz. 1105 §6 ust. 1 (shortened). */
export const CATEGORY_LABEL: Record<Category, string> = {
  A: 'Kat. A — ruch kierowany przez pracowników lub rogatki na całą szerokość drogi z sygnalizatorami',
  B: 'Kat. B — samoczynny system z sygnalizatorami i rogatkami (półrogatkami)',
  C: 'Kat. C — samoczynny system wyłącznie z sygnalizatorami',
  D: 'Kat. D — bez systemu przejazdowego, ruch kierowany znakami',
  E: 'Kat. E — przejście dla pieszych przez tory',
  F: 'Kat. F — przejazd lub przejście na drodze wewnętrznej',
}

export const INSPECTION_LABEL: Record<InspectionLevel, string> = {
  P1: 'P1 — kontrola w pierwszej kolejności',
  P2: 'P2 — kontrola planowa z podwyższonym priorytetem',
  P3: 'P3 — bez wskazań do pilnej kontroli',
}
export const NOT_ASSESSED_LABEL = 'Nieoceniony — brak danych o kontrolach (nie oznacza niskiego priorytetu)'

export const VERIFICATION_LABEL: Record<VerificationLevel, string> = {
  V1: 'V1 — brakuje danych krytycznych dla reguł',
  V2: 'V2 — brakuje danych uzupełniających',
  V3: 'V3 — komplet danych',
}

export const EVIDENCE_LABEL: Record<EvidenceStrength, string> = {
  strong: 'Silny',
  moderate: 'Umiarkowany',
  weak: 'Słaby',
  none: 'Brak',
}
export const EVIDENCE_DESCRIPTION: Record<EvidenceStrength, string> = {
  strong: 'Liczbowa ocena skuteczności z badań lub regulacji (często zagranicznych).',
  moderate: 'Udokumentowany mechanizm działania, brak liczbowej oceny.',
  weak: 'Wdrożenia lub dane o skali, brak oceny efektu.',
  none: 'Brak danych o skuteczności.',
}

export const RESPONSIBLE_LABEL: Record<ResponsibleParty, string> = {
  PLK: 'PKP PLK (zarządca kolei)',
  road_authority: 'Zarządca drogi',
  joint: 'Wspólnie: zarządca kolei i drogi',
  police_gitd: 'Policja / GITD',
  other: 'Inne podmioty',
}
export const RESPONSIBLE_SHORT: Record<ResponsibleParty, string> = {
  PLK: 'PLK',
  road_authority: 'Zarządca drogi',
  joint: 'Wspólnie',
  police_gitd: 'Policja / GITD',
  other: 'Inne',
}

export const COST_LABEL: Record<CostClass, string> = {
  low: 'Niska',
  medium: 'Średnia',
  high: 'Wysoka',
  unknown: 'Nieznana',
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  planned: 'Zaplanowane',
  in_progress: 'W realizacji',
  implemented: 'Wdrożone',
  verified: 'Zweryfikowane',
}

export const GPR_CONFIDENCE_LABEL: Record<GprMatch['confidence'], string> = {
  high: 'Pewne (≤ 25 m)',
  approximate: 'Przybliżone',
  ambiguous: 'Niejednoznaczne',
}

export const ORIGIN_LABEL = {
  real: 'Dane realne',
  fictional: 'DANE FIKCYJNE',
  derived: 'Dane pochodne',
} as const
