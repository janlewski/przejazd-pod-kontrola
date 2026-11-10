# Przejazd pod kontrolą

Demonstracyjna aplikacja webowa dla zespołów utrzymania i bezpieczeństwa przejazdów kolejowo-drogowych. Prowadzi przez cykl:
**wskazanie** przejazdu do kontroli → **diagnoza** wzorca (objaw → przyczyna) → **środki zaradcze** z siłą dowodu i źródłem → **śledzenie** wdrożenia → **ocena przed/po** z jawnymi zastrzeżeniami.

Praca konkursowa „Kolej na bezpieczeństwo” (PKP PLK S.A.).

> **DANE FIKCYJNE.** Dane o kontrolach, zdarzeniach, naruszeniach i liczbie pociągów (przypadki X1–X10) są fikcyjne i oznaczone w interfejsie etykietą „DANE FIKCYJNE”. Każdy przypadek osadzono na realnym przejeździe PKP PLK (numer, położenie, kategoria są prawdziwe), ale zdarzenia tego przejazdu nie dotyczą — w karcie widać obie etykiety. Realne są wyłącznie: położenie, numer i kategoria przejazdów PKP PLK oraz średni dobowy ruch roczny z GPR 2025.

## Co aplikacja robi, a czego nie

- Zwraca **trzy osobne wyniki**: priorytet kontroli (P1–P3), priorytet weryfikacji danych (V1–V3) i kontekst ekspozycji. Nie łączy ich w jeden „wskaźnik niebezpieczeństwa”.
- Każdy wynik ma listę powodów (`reasons[]`) z kodem i, gdzie się da, źródłem.
- **Brak danych nigdy nie obniża priorytetu kontroli** — podnosi priorytet weryfikacji danych. Realne przejazdy bez danych o kontrolach mają status „brak oceny”, sortowany powyżej P3.
- Iloczyn ruchu i progi 60 000 / 150 000 (Dz.U. 2025 poz. 1105, §8–§10) to wyłącznie **kontekst regulacyjny**, nie miara ryzyka.
- Nie przewiduje wypadków, nie korzysta z ruchu w czasie rzeczywistym, nie przetwarza danych osobowych.

## Uruchomienie

Wymagany Node.js 22+ (LTS) i pnpm (wersja w polu `packageManager`; `corepack enable`).

```bash
pnpm install
pnpm dev             # http://localhost:5173/
pnpm lint            # oxlint
pnpm typecheck       # tsc -b --noEmit
pnpm test            # Vitest (reguły, dane, transformacje)
pnpm test:e2e        # Playwright: testy dymne i WCAG 2.1 AA (axe); wymaga `pnpm exec playwright install chromium`
pnpm build           # produkcja → dist/
```

Wdrożenie: GitHub Pages przez GitHub Actions (`.github/workflows/deploy.yml`; Settings → Pages → Source: GitHub Actions). Ścieżki zasobów są względne (`base: './'`), więc build działa pod dowolnym adresem. Routing hashowy (`#/przejazdy/X1`), więc głębokie linki działają po odświeżeniu bez `404.html`.

### Odtworzenie danych

Snapshoty źródeł są w repozytorium (`data/raw/`), więc dane można odbudować bez dostępu do sieci:

```bash
pnpm exec tsx scripts/build-dataset.ts                 # offline: snapshoty → src/data/*.json + walidacja Zod
pnpm exec tsx scripts/fetch-crossings.ts               # nowe pobranie z WFS (snapshot data/raw/crossings-RRRRMMDD/)
pnpm exec tsx scripts/fetch-crossings.ts --bbox=14,49,24.2,55   # ograniczenie zasięgu (WGS84, filtr lokalny)
pnpm exec tsx scripts/parse-gpr.ts                     # nowe pobranie GPR 2025 (ZIP do data/raw/)
pnpm exec tsx scripts/match-gpr.ts                     # dopasowanie przejazd ↔ odcinek GPR
pnpm exec tsx scripts/assign-cases.ts                  # osadzenie X1–X10 na realnych przejazdach
```

Skrypty kończą się czytelnym błędem, gdy usługa jest niedostępna; wtedy wystarczy `build-dataset.ts` ze snapshotów.

## Struktura

```
scripts/              pobranie i przetworzenie danych (Node, uruchamiane ręcznie)
data/raw/             snapshoty źródeł z datą pobrania (GML.gz z WFS, ZIP GPR)
data/derived/         odcinki GPR po reprojekcji
src/config/           progi z Dz.U. 2025 poz. 1105, parametry dopasowania GPR, mapa
src/data/             przejazdy, dopasowania GPR, przypadki fikcyjne, rejestr źródeł, reguły
src/domain/           czyste funkcje bez Reacta: priority.ts, diagnose.ts, evaluate.ts, schematy Zod
src/store/            zadania wdrożeń (Zustand + localStorage, walidacja Zod przy odczycie)
src/components/       komponenty domenowe i shadcn/ui (src/components/ui)
src/pages/            7 widoków
tests/                Vitest; tests/e2e — Playwright
```

## Źródła danych i dokumenty

Pełny rejestr (URL, data pobrania, warunki, opis przetworzenia) jest w [`src/data/sources.json`](src/data/sources.json) i w widoku „Metoda i źródła”.

| Źródło                                                                                                                                                                                                                                                                                                                                                                                           | Pobrano    | Warunki                                                                                                                    | Przetworzenie                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [Przejazdy kolejowo-drogowe PKP PLK — WFS GUGiK](https://mapy.geoportal.gov.pl/wss/service/wfs/sdi/Przejazdy?SERVICE=WFS&REQUEST=GetCapabilities) (warstwa `ms:PKP_PLK`)                                                                                                                                                                                                                         | 10.11.2026 | Warunki nieopublikowane w opisie usługi — dane publiczne, wykorzystane z podaniem źródła (do weryfikacji przed publikacją) | GML 3.2, paginacja; EPSG:2180 → WGS84; 11 728 przejazdów; pola NAZWA, KATEGORIA, STAC_SZLAK, IDDE |
| [GDDKiA — Generalny Pomiar Ruchu 2025 (SHP)](https://www.gov.pl/attachment/7f8ca805-e384-4802-bf10-d36538e6ef84)                                                                                                                                                                                                                                                                                 | 10.11.2026 | Jak wyżej (do weryfikacji)                                                                                                 | 2 422 odcinki dróg krajowych; pole SDRR2025                                                       |
| Dopasowanie przejazd ↔ GPR (opracowanie własne)                                                                                                                                                                                                                                                                                                                                                  | 10.11.2026 | Dane pochodne                                                                                                              | 352 dopasowania: 90 pewnych, 255 przybliżonych, 7 niejednoznacznych                               |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) — podkład mapy                                                                                                                                                                                                                                                                                                                          | —          | ODbL 1.0; [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)                                   | Kafle tylko podczas przeglądania, bez prefetchu; atrybucja „© OpenStreetMap contributors”         |
| [Dz.U. 2025 poz. 1105](https://eli.gov.pl/api/acts/DU/2025/1105/text.pdf)                                                                                                                                                                                                                                                                                                                        | 10.11.2026 | Akt normatywny (art. 4 pkt 2 pr. aut.)                                                                                     | Progi iloczynu ruchu, częstotliwość pomiarów, §21, §22, §24, §26, §73                             |
| [UTK — Raport w sprawie bezpieczeństwa za 2025](https://dziennikurzedowy.utk.gov.pl/download/6/3436/Raportwsprawiebezpieczenstwaza2025-sig.pdf), [PKBWK — Raport roczny 2024](https://www.gov.pl/attachment/b1288d86-5f9c-4d46-9829-0bc03b855257)                                                                                                                                                | 10.11.2026 | Dokumenty urzędowe                                                                                                         | Punkt wyjścia do listy przyczyn                                                                   |
| [49 CFR 222 App. A](https://www.law.cornell.edu/cfr/text/49/appendix-A_to_part_222), [TxDOT Quiet Zones](https://www.txdot.gov/manuals/rrd/rho/quiet_zones/approving_quiet_zone-i1001063.html), [CMF Clearinghouse 494](https://cmfclearinghouse.fhwa.dot.gov/detail.php?facid=494), [NTSB RAR-17/01](https://www.ntsb.gov/investigations/AccidentReports/Reports/RAR1701.pdf)                   | 10.11.2026 | Publikacje rządowe USA                                                                                                     | Współczynniki skuteczności (dowód zagraniczny)                                                    |
| [Kolejowy Portal — RedLight](https://kolejowyportal.pl/kolejne-przejazdy-pod-nadzorem-red-light-pkp-plk-wskazuja-kryteria-wyboru/), [Rail Engineer — obstacle detection](https://www.railengineer.co.uk/obstacle-detection-for-level-crossings/), [ORR — MCB-OD](https://www.orr.gov.uk/media/11793), [gov.pl — numer 112](https://www.gov.pl/web/numer-alarmowy-112/przejazdy-kolejowo-drogowe) | 10.11.2026 | Cytowane z podaniem źródła                                                                                                 | Opis środków bez wartości liczbowych                                                              |

**Weryfikacja położenia.** Reprojekcję sprawdzono na 4 przejazdach z różnych regionów: węzły OpenStreetMap `railway=level_crossing` z tym samym `ref` (numer z żółtej naklejki) leżą w odległości ≤ 2 m. Współrzędne kontrolne są w `tests/geo.test.ts`.

## Biblioteki i licencje

| Biblioteka                                      | Licencja | Biblioteka                         | Licencja     |
| ----------------------------------------------- | -------- | ---------------------------------- | ------------ |
| React, React DOM                                | MIT      | Leaflet                            | BSD-2-Clause |
| React Router                                    | MIT      | TanStack Table                     | MIT          |
| Zustand                                         | MIT      | Zod                                | MIT          |
| Tailwind CSS, @tailwindcss/vite                 | MIT      | tw-animate-css                     | MIT          |
| shadcn/ui (kod w `src/components/ui`), radix-ui | MIT      | class-variance-authority           | Apache-2.0   |
| clsx, tailwind-merge                            | MIT      | lucide-react                       | ISC          |
| sonner                                          | MIT      | IBM Plex Sans / Mono (@fontsource) | OFL-1.1      |

Narzędzia (nie trafiają do aplikacji): Vite, Vitest, @vitest/coverage-v8, oxlint, Prettier, tsx, proj4, fast-xml-parser, shpjs — MIT; TypeScript, Playwright — Apache-2.0; jszip — MIT lub GPL-3.0 (wybrano MIT); @axe-core/playwright — MPL-2.0.

Kod aplikacji: licencja MIT ([`LICENSE`](LICENSE)).

## Świadome decyzje projektowe

- **Przypadki fikcyjne osadzone na realnych przejazdach według stałej reguły** (`scripts/assign-cases.ts`): ta sama kategoria co wzorzec, rozłożenie na jednostki PLK, brak dopasowania GPR (fikcyjny ruch nie przeczy danym realnym), najniższy numer obiektu WFS. Karta i mapa pokazują, że przejazd jest realny, a zdarzenia fikcyjne.
- **Kolejność osi EPSG:2180** wynika z deklaracji CRS (`urn:ogc:def:crs:EPSG::2180` → northing, easting), a nie z testu bboxa: zamienione osie typowego punktu też trafiają w obszar Polski. Dodatkowa kontrola regionalna (PLK Lublin na wschodzie, PLK Szczecin na zachodzie).
- **GPR 2025 obejmuje tylko drogi krajowe**, a odcinki są uproszczone (zwykle 2 wierzchołki). Dlatego oprócz progu 25 m („pewne”) jest pasmo 25–100 m („przybliżone”), które podnosi priorytet weryfikacji danych. Autostrady i drogi ekspresowe są pomijane (§39 ust. 1 pkt 1 — skrzyżowania bezkolizyjne).
- **Progi iloczynu ruchu przypisane do kategorii wg tekstu rozporządzenia:** ≥ 150 000 → kategoria B (§8 ust. 1); 60 000–150 000 → C (§9 pkt 1); D wymaga < 60 000 (§10 pkt 1). Dodano regułę aktualności pomiaru ruchu z zał. nr 1.
- **Wykres przed/po** jako lekki SVG z tabelą danych obok zamiast Recharts (jeden wykres nie uzasadnia zależności).
- **Mapa bez react-leaflet**: react-leaflet 5 jest na licencji Hippocratic 2.1 (spoza MIT/BSD/ISC), więc mapa używa bezpośrednio Leaflet (BSD-2-Clause).
- **Lint: oxlint** (domyślny w aktualnym szablonie Vite) zamiast ESLint; TypeScript 7.
- **Dodatkowy środek CM-PED-FENCE** (poręcze/labirynty, §21 i §11) z `evidence: "none"`; usunięto niepotwierdzone źródłem stwierdzenie o „pilotażach PLK” przy detekcji przeszkód.

## Ograniczenia

- Reguły objaw → przyczyna → środek wymagają walidacji z ekspertami; progi dopasowania GPR są heurystyką.
- Dowody skuteczności pochodzą głównie z USA i Wielkiej Brytanii; przenoszalność do Polski jest niepotwierdzona.
- Podział kompetencji PLK / zarządca drogi jest uproszczony — do potwierdzenia z zarządcami.
- Kategoria z WFS nie obejmuje prędkości pociągów, widoczności ani liczby torów, które też decydują o kategorii (§7–§10).
- Warunki licencyjne danych WFS i GPR należy potwierdzić u źródła przed publikacją.
