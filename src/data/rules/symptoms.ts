import type { Symptom } from '@/domain/types'

/**
 * Observable symptoms recorded during an inspection. `severity: "high"` raises
 * inspection priority to P1; "medium" to P2.
 */
export const symptoms: readonly Symptom[] = [
  {
    id: 'S-GATE-BREAK',
    namePl: 'Wyłamania drąga półrogatki (powtarzalne)',
    indicates: ['C-DRIVE-AROUND'],
    severity: 'high',
  },
  {
    id: 'S-DRIVE-AROUND',
    namePl: 'Objazdy opuszczonych półrogatek (obserwacja lub nagranie)',
    indicates: ['C-DRIVE-AROUND'],
    severity: 'high',
  },
  {
    id: 'S-QUEUE',
    namePl: 'Kolejka pojazdów sięgająca torów',
    indicates: ['C-QUEUE-SPILLBACK'],
    severity: 'high',
  },
  {
    id: 'S-SIGHT',
    namePl: 'Niepełny trójkąt widoczności',
    indicates: ['C-VISIBILITY'],
    severity: 'high',
  },
  {
    id: 'S-VEGETATION',
    namePl: 'Roślinność lub obiekty w trójkącie widoczności',
    indicates: ['C-VISIBILITY'],
    severity: 'medium',
  },
  {
    id: 'S-STOP-IGN',
    namePl: 'Niezatrzymanie przed znakiem B-20 STOP',
    indicates: ['C-STOP-NONCOMPLIANCE'],
    severity: 'high',
  },
  {
    id: 'S-RED-IGN',
    namePl: 'Wjazdy przy czerwonym świetle sygnalizatora',
    indicates: ['C-RED-VIOLATION'],
    severity: 'high',
  },
  {
    id: 'S-TRAPPED',
    namePl: 'Pojazd uwięziony między rogatkami lub zatrzymany na torach',
    indicates: ['C-TRAPPED', 'C-QUEUE-SPILLBACK'],
    severity: 'high',
  },
  {
    id: 'S-PED-BYPASS',
    namePl: 'Piesi przechodzący przy opuszczonych rogatkach lub sygnale',
    indicates: ['C-PEDESTRIAN'],
    severity: 'high',
  },
  {
    id: 'S-ALT-ROUTE',
    namePl: 'Niewielki ruch i dostępny objazd przez inny przejazd lub wiadukt',
    indicates: ['C-LOW-NEED'],
    severity: 'medium',
  },
]
