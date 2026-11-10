import type { Cause } from '@/domain/types'

/**
 * Repeatable patterns (cause behind a symptom). Starting points: PKBWK annual report 2024
 * (list of causes) and the UTK safety report for 2025. To be validated with experts.
 */
export const causes: readonly Cause[] = [
  {
    id: 'C-DRIVE-AROUND',
    namePl: 'Objeżdżanie opuszczonych półrogatek',
    descriptionPl:
      'Kierowcy omijają półrogatkę lewym pasem. Wzorzec typowy dla kategorii B z rogatkami zamykającymi tylko wjazd.',
    sourceIds: ['pkbwk-raport-2024', 'dzu-2025-1105'],
    sourceNote:
      'PKBWK 2024 — lista przyczyn; §22 ust. 2 Dz.U. 2025 poz. 1105 wprost wymienia ryzyko objazdu opuszczonej rogatki.',
  },
  {
    id: 'C-QUEUE-SPILLBACK',
    namePl: 'Kolejka z pobliskiego skrzyżowania sięgająca torów',
    descriptionPl:
      'Pojazdy zatrzymują się na przejeździe, bo za nim nie ma miejsca (sygnalizacja, rondo, zjazd w pobliżu).',
    sourceIds: ['pkbwk-raport-2024', 'ntsb-rar-17-01', 'dzu-2025-1105'],
    sourceNote:
      'PKBWK 2024 — lista przyczyn; NTSB RAR-17/01 — mechanizm; §22 ust. 1 — wymóg sprawnego wyjazdu z przejazdu.',
  },
  {
    id: 'C-VISIBILITY',
    namePl: 'Ograniczona widoczność nadjeżdżającego pociągu',
    descriptionPl:
      'Roślinność, zabudowa lub ukształtowanie terenu w trójkącie widoczności. Kluczowe dla kategorii D, gdzie kierowca sam ocenia sytuację.',
    sourceIds: ['pkbwk-raport-2024', 'dzu-2025-1105'],
    sourceNote: 'PKBWK 2024 — lista przyczyn; §26 ust. 2 i zał. nr 3 — trójkąty widoczności.',
  },
  {
    id: 'C-STOP-NONCOMPLIANCE',
    namePl: 'Nieprzestrzeganie znaku B-20 STOP',
    descriptionPl: 'Wjazd na przejazd kategorii D bez zatrzymania i upewnienia się, że nie nadjeżdża pociąg.',
    sourceIds: ['utk-raport-2025', 'pkbwk-raport-2024'],
    sourceNote:
      'UTK 2025 i PKBWK 2024 — zdarzenia na przejazdach kategorii D (do weryfikacji szczegółów z ekspertami).',
  },
  {
    id: 'C-RED-VIOLATION',
    namePl: 'Wjazd przy czerwonym świetle',
    descriptionPl:
      'Wjazd na przejazd mimo nadawania sygnału zabraniającego wjazdu, także tuż przed opuszczeniem rogatek.',
    sourceIds: ['utk-raport-2025', 'kolejowyportal-redlight'],
    sourceNote: 'UTK 2025; skala zjawiska — rejestracje systemów RedLight (kolejowyportal.pl).',
  },
  {
    id: 'C-TRAPPED',
    namePl: 'Pojazd uwięziony na przejeździe',
    descriptionPl:
      'Pojazd zostaje między rogatkami lub unieruchomiony na torach (kolejka, awaria, zawieszenie na niwelecie).',
    sourceIds: ['pkbwk-raport-2024', 'gov-112-przejazdy'],
    sourceNote: 'PKBWK 2024 — lista przyczyn; procedura 112 z żółtej naklejki dotyczy właśnie tej sytuacji.',
  },
  {
    id: 'C-PEDESTRIAN',
    namePl: 'Piesi wchodzący na tory przy zamkniętym przejeździe',
    descriptionPl:
      'Obchodzenie rogatek lub przechodzenie przy sygnale, często w pobliżu przystanku lub stacji.',
    sourceIds: ['utk-raport-2025', 'dzu-2025-1105'],
    sourceNote:
      'UTK 2025 — zdarzenia na przejazdach i przejściach; §21 — poręcze utrudniające obejście rogatek.',
  },
  {
    id: 'C-LOW-NEED',
    namePl: 'Przejazd o małym znaczeniu komunikacyjnym',
    descriptionPl:
      'Ekspozycja na ryzyko bez dużej korzyści dla sieci drogowej — kandydat do likwidacji lub konsolidacji.',
    sourceIds: ['cfr-49-222-app-a', 'dzu-2025-1105'],
    sourceNote:
      '49 CFR 222 App. A — likwidacja jako środek; §25 ust. 2 — odległość między przejazdami przy projektowaniu.',
  },
]
