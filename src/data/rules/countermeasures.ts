import type { Countermeasure } from '@/domain/types'

const CFR_222 = 'https://www.law.cornell.edu/cfr/text/49/appendix-A_to_part_222'
const DZU_1105 = 'https://eli.gov.pl/api/acts/DU/2025/1105/text.pdf'
const PKBWK_2024 = 'https://www.gov.pl/attachment/b1288d86-5f9c-4d46-9829-0bc03b855257'
const NTSB_RAR_17_01 = 'https://www.ntsb.gov/investigations/AccidentReports/Reports/RAR1701.pdf'

/**
 * Countermeasure catalogue. `effectNote` holds only values published by the cited source,
 * with their context (country, metric). No source value → `evidence: "none"`.
 * `costClass` is an indicative class, never an amount.
 */
export const countermeasures: readonly Countermeasure[] = [
  {
    id: 'CM-MEDIAN',
    namePl: 'Separatory w osi jezdni',
    addressesCauses: ['C-DRIVE-AROUND'],
    evidence: 'strong',
    evidenceContext: 'Dowód zagraniczny (USA, FRA) — współczynnik skuteczności środka w strefach ciszy.',
    effectNote: 'FRA (USA), skuteczność 0,75; z nieprzejezdnym krawężnikiem 0,80.',
    sourceUrls: [
      CFR_222,
      'https://www.txdot.gov/manuals/rrd/rho/quiet_zones/approving_quiet_zone-i1001063.html',
    ],
    responsible: 'road_authority',
    legalNote:
      '§22 ust. 2 Dz.U. 2025 poz. 1105 — wyspy kanalizujące lub separatory na dojazdach do kat. B, przejezdne dla pojazdu w sytuacji awaryjnej. Wariant z nieprzejezdnym krawężnikiem wymaga sprawdzenia zgodności z tym wymogiem.',
    costClass: 'low',
    applicableCategories: ['B'],
  },
  {
    id: 'CM-4Q',
    namePl: 'Rogatki zamykające całą jezdnię (4 rogatki) z opóźnieniem zjazdowych',
    addressesCauses: ['C-DRIVE-AROUND'],
    evidence: 'strong',
    evidenceContext: 'Dowód zagraniczny (USA, FRA) — współczynnik skuteczności środka w strefach ciszy.',
    effectNote:
      'FRA: 0,82 bez detekcji pojazdów, 0,77 z detekcją, 0,92 z medianą ≥60 ft. PL: §73 Dz.U. 2025 poz. 1105.',
    sourceUrls: [CFR_222, DZU_1105],
    responsible: 'PLK',
    legalNote:
      '§73 ust. 1 pkt 2 — dwie pary rogatek zamykających całą szerokość jezdni, najpierw wjazdowe, potem zjazdowe; §73 ust. 2–3 — opóźnienie uwzględnia zjazd zespołu pojazdów o długości 22 m.',
    costClass: 'high',
    applicableCategories: ['B'],
  },
  {
    id: 'CM-GATES',
    namePl: 'Rogatki tam, gdzie są tylko światła i dźwięk',
    addressesCauses: ['C-RED-VIOLATION'],
    evidence: 'strong',
    evidenceContext: 'Dowód zagraniczny (USA) — meta-analiza, Highway Safety Manual.',
    effectNote: 'CMF 0,55 (meta-analiza, HSM).',
    sourceUrls: ['https://cmfclearinghouse.fhwa.dot.gov/detail.php?facid=494'],
    responsible: 'PLK',
    legalNote:
      '§8 ust. 2 — przejazd kategorii niższej niż B może zostać zaliczony do kategorii B, jeżeli uzasadniają to warunki miejscowe lub poprawa bezpieczeństwa.',
    costClass: 'high',
    applicableCategories: ['C'],
  },
  {
    id: 'CM-REDLIGHT',
    namePl: 'Rejestracja wykroczeń (RedLight / CANARD)',
    addressesCauses: ['C-RED-VIOLATION', 'C-DRIVE-AROUND'],
    evidence: 'weak',
    evidenceContext: 'Dane o skali wdrożenia w Polsce; brak opublikowanej oceny efektu.',
    effectNote: '2024: 4 systemy, 12,3 tys. zarejestrowanych naruszeń; brak opublikowanego % spadku.',
    sourceUrls: [
      'https://kolejowyportal.pl/kolejne-przejazdy-pod-nadzorem-red-light-pkp-plk-wskazuja-kryteria-wyboru/',
    ],
    responsible: 'joint',
    legalNote:
      'Poza zakresem Dz.U. 2025 poz. 1105; podstawa w przepisach o ruchu drogowym i automatycznym nadzorze (do weryfikacji).',
    costClass: 'medium',
    applicableCategories: ['A', 'B', 'C'],
  },
  {
    id: 'CM-VEG',
    namePl: 'Wycinka i przywrócenie trójkąta widoczności',
    addressesCauses: ['C-VISIBILITY'],
    evidence: 'none',
    evidenceContext: 'Przyczyna wskazana przez PKBWK; brak liczbowej oceny skuteczności.',
    effectNote: 'PKBWK wskazuje brak trójkąta jako przyczynę; brak liczbowej skuteczności.',
    sourceUrls: [PKBWK_2024, DZU_1105],
    responsible: 'joint',
    legalNote:
      '§26 ust. 2 — w trójkątach widoczności (zał. nr 3 cz. B i C) nie sytuuje się m.in. drzew, krzewów i upraw wysokopiennych.',
    costClass: 'low',
    applicableCategories: ['C', 'D', 'E'],
  },
  {
    id: 'CM-QUEUE',
    namePl: 'Przedsygnalizator, koordynacja z sygnalizacją drogową, detekcja kolejki',
    addressesCauses: ['C-QUEUE-SPILLBACK', 'C-TRAPPED'],
    evidence: 'moderate',
    evidenceContext: 'Mechanizm udokumentowany w raportach z USA; brak liczbowej oceny.',
    effectNote: 'Mechanizm udokumentowany (NTSB RAR-17/01, FHWA Handbook); brak liczbowej skuteczności.',
    sourceUrls: [NTSB_RAR_17_01, DZU_1105],
    responsible: 'joint',
    legalNote:
      '§22 ust. 1 — sprawny wyjazd z przejazdu, w szczególności przez uzależnienie działania systemów przejazdowych od systemów kierowania ruchem drogowym.',
    costClass: 'medium',
    applicableCategories: ['A', 'B', 'C'],
  },
  {
    id: 'CM-OBSTACLE',
    namePl: 'Detekcja przeszkód (radar, LiDAR)',
    addressesCauses: ['C-TRAPPED'],
    evidence: 'weak',
    evidenceContext: 'Wdrożenia zagraniczne (Wielka Brytania); brak opublikowanej oceny efektu w Polsce.',
    effectNote: 'Wdrożenia w Wielkiej Brytanii (MCB-OD); brak polskich wyników.',
    sourceUrls: [
      'https://www.railengineer.co.uk/obstacle-detection-for-level-crossings/',
      'https://www.orr.gov.uk/media/11793',
    ],
    responsible: 'PLK',
    legalNote: 'Dz.U. 2025 poz. 1105 nie wymaga detekcji przeszkód (do weryfikacji z zarządcą).',
    costClass: 'high',
    applicableCategories: ['A', 'B'],
  },
  {
    id: 'CM-PED-FENCE',
    namePl: 'Poręcze i ogrodzenie utrudniające obejście rogatek; labirynty na przejściach',
    addressesCauses: ['C-PEDESTRIAN'],
    evidence: 'none',
    evidenceContext: 'Wymóg techniczny; brak liczbowej oceny skuteczności.',
    effectNote: 'Wymóg z §21 Dz.U. 2025 poz. 1105; brak liczbowej skuteczności.',
    sourceUrls: [DZU_1105],
    responsible: 'PLK',
    legalNote:
      '§21 — odcinki między torem a rogatkami odgradza się poręczami; §11 ust. 3–6 — labirynty i barierki na przejściach kategorii E.',
    costClass: 'low',
    applicableCategories: ['A', 'B', 'E'],
  },
  {
    id: 'CM-CLOSE',
    namePl: 'Likwidacja lub konsolidacja przejazdu',
    addressesCauses: ['C-LOW-NEED'],
    evidence: 'strong',
    evidenceContext: 'Dowód zagraniczny (USA, FRA); wynika z definicji — przejazd przestaje istnieć.',
    effectNote: 'Skuteczność 1,0 (FRA) — przejazd przestaje istnieć.',
    sourceUrls: [CFR_222],
    responsible: 'joint',
    legalNote:
      'Decyzja zarządcy kolei i zarządcy drogi. §25 ust. 2 — nowego przejazdu nie projektuje się, jeśli w promieniu 3 km jest inny przejazd lub skrzyżowanie wielopoziomowe.',
    costClass: 'unknown',
    applicableCategories: ['A', 'B', 'C', 'D', 'E', 'F'],
  },
  {
    id: 'CM-EDU',
    namePl: 'Edukacja, żółta naklejka PLK z numerem 112',
    addressesCauses: ['C-STOP-NONCOMPLIANCE', 'C-TRAPPED', 'C-PEDESTRIAN'],
    evidence: 'none',
    evidenceContext: 'Brak liczbowej oceny skuteczności.',
    effectNote:
      'Brak liczbowej skuteczności. Naklejka zawiera 9-cyfrowy numer identyfikacyjny przejazdu i numer 112.',
    sourceUrls: ['https://www.gov.pl/web/numer-alarmowy-112/przejazdy-kolejowo-drogowe'],
    responsible: 'other',
    legalNote: 'Poza zakresem Dz.U. 2025 poz. 1105.',
    costClass: 'low',
    applicableCategories: ['A', 'B', 'C', 'D', 'E', 'F'],
  },
]
