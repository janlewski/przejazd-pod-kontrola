import { PageHeader } from '@/components/common/PageHeader'
import { SourceLink } from '@/components/common/SourceFootnote'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GPR_MATCH_HIGH_M, GPR_MATCH_MAX_M } from '@/config/gpr'
import {
  TRAFFIC_COUNT_INTERVAL_ABC_YEARS,
  TRAFFIC_PRODUCT_B,
  TRAFFIC_PRODUCT_C,
  TRAFFIC_PRODUCT_D_GPR_LIMIT,
} from '@/config/thresholds'
import { sources } from '@/data'
import { causes } from '@/data/rules/causes'
import { symptoms } from '@/data/rules/symptoms'
import { formatDate, formatInt } from '@/lib/format'

const causeName = new Map(causes.map((c) => [c.id, c.namePl]))

const NOT_DOING = [
  'Nie liczy jednego „wskaźnika niebezpieczeństwa” — zwraca trzy osobne wyniki.',
  'Nie przewiduje wypadków (brak uczenia maszynowego, brak prawdopodobieństw).',
  'Nie korzysta z ruchu w czasie rzeczywistym; do planowania kontroli właściwy jest średni ruch roczny.',
  'Nie przetwarza danych osobowych, informacji niejawnych ani tajemnicy przedsiębiorstwa.',
  'Nie podejmuje decyzji — wskazuje podmiot odpowiedzialny i źródła, decyzja należy do zarządców.',
  'Nie traktuje kategorii przejazdu ani iloczynu ruchu jako rankingu ryzyka.',
]

export default function MethodPage() {
  const sorted = [...sources].sort(
    (a, b) => a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title, 'pl'),
  )
  return (
    <>
      <PageHeader
        title="Metoda i źródła"
        description="Jak liczone są wyniki, czego aplikacja nie robi, skąd pochodzą dane i jakie są ograniczenia. Reguły są jawne i wymagają walidacji z ekspertami w pilotażu."
      />

      <Accordion type="multiple" defaultValue={['wyniki', 'nie']} className="rounded-sm border bg-card px-3">
        <AccordionItem value="wyniki">
          <AccordionTrigger>Trzy osobne wyniki</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-3 text-sm">
            <div>
              <h3 className="font-medium">Priorytet kontroli (P1–P3)</h3>
              <ul className="list-disc pl-5">
                <li>
                  P1 — zaobserwowano objaw o wysokiej wadze (np. wyłamania drąga, kolejka do torów, wjazdy
                  przy czerwonym).
                </li>
                <li>P2 — objaw o średniej wadze, odnotowane naruszenia albo brak daty ostatniej kontroli.</li>
                <li>P3 — kontrola przeprowadzona, bez objawów i naruszeń w danych.</li>
                <li>
                  „Brak oceny” — realne przejazdy bez danych o kontrolach. W sortowaniu stoi nad P3: brak
                  danych nie obniża priorytetu.
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium">Priorytet weryfikacji danych (V1–V3)</h3>
              <ul className="list-disc pl-5">
                <li>
                  V1 — brak danych krytycznych: kategoria, kontrole, ruch drogowy lub pociągi na dobę
                  (potrzebne do iloczynu ruchu, §14), niejednoznaczne dopasowanie GPR.
                </li>
                <li>
                  V2 — brak danych uzupełniających: data lub aktualność pomiaru ruchu, przybliżone dopasowanie
                  GPR.
                </li>
                <li>
                  Aktualność pomiaru wg zał. nr 1: kategorie A–C co najmniej co{' '}
                  {TRAFFIC_COUNT_INTERVAL_ABC_YEARS} lat; kategoria D co 5 lat, 2 lata albo rok zależnie od
                  ostatniego iloczynu (≤ 20 000, 20 000–40 000, &gt; 40 000). Przy nieznanym iloczynie
                  przyjmujemy najkrótszy okres.
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium">Kontekst ekspozycji</h3>
              <p>
                Iloczyn ruchu = pojazdy drogowe na dobę × pociągi na dobę (w rozporządzeniu: pojazdy kolejowe
                i manewry). Porównanie z progami {formatInt(TRAFFIC_PRODUCT_C)} i{' '}
                {formatInt(TRAFFIC_PRODUCT_B)} (§8–§10 Dz.U. 2025 poz. 1105) daje wyłącznie notatkę
                regulacyjną, np. „iloczyn ≥ 150 000 przy kategorii C — sprawdź zgodność kategorii”. To nie
                jest miara ryzyka. Dla dróg krajowych i wojewódzkich zał. nr 1 pkt 9 przyjmuje SDRR z
                ostatniego GPR; pkt 10 wyłącza tę zasadę dla kategorii D z ostatnim iloczynem powyżej{' '}
                {formatInt(TRAFFIC_PRODUCT_D_GPR_LIMIT)}.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="diagnoza">
          <AccordionTrigger>Diagnoza i dobór środków</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-3 text-sm">
            <p>
              Objaw z kontroli wskazuje przyczynę (wzorzec), a przyczyna — środki. Środki są szeregowane
              kolejno według: siły dowodu, zgodności z kategorią przejazdu, liczby rozpoznanych przyczyn i
              klasy kosztu. Nie ma sumowania w jedną liczbę. Wartości skuteczności z USA (FRA, CMF) są
              oznaczone jako dowód zagraniczny.
            </p>
            <Table aria-label="Objawy i wskazywane przyczyny">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Objaw</TableHead>
                  <TableHead className="text-xs">Waga</TableHead>
                  <TableHead className="text-xs">Wskazuje przyczynę</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {symptoms.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-normal">{s.namePl}</TableCell>
                    <TableCell className="text-xs">
                      {s.severity === 'high' ? 'wysoka (P1)' : 'średnia (P2)'}
                    </TableCell>
                    <TableCell className="text-xs whitespace-normal">
                      {s.indicates.map((c) => causeName.get(c) ?? c).join('; ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ocena">
          <AccordionTrigger>Ocena przed/po</AccordionTrigger>
          <AccordionContent className="text-sm">
            Porównujemy średnią miesięczną liczbę naruszeń przed i po wdrożeniu; miesiąc wdrożenia jest
            pomijany. Zawsze pokazujemy zastrzeżenia: regresja do średniej, krótkie okno, mała liczba zdarzeń
            (naruszenia jako wskaźnik zastępczy), zmiany ruchu i sezonowość, brak grupy kontrolnej. Docelowo:
            grupa porównawcza lub metoda empirical Bayes.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="gpr">
          <AccordionTrigger>Dopasowanie przejazdów do GPR 2025</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2 text-sm">
            <p>
              Opublikowana warstwa GPR 2025 obejmuje drogi krajowe, a odcinek pomiarowy to zwykle linia prosta
              między węzłami. Dlatego odległość przejazdu od osi odcinka jest przybliżona.
            </p>
            <ul className="list-disc pl-5">
              <li>„Pewne” — najbliższy odcinek w odległości do {GPR_MATCH_HIGH_M} m.</li>
              <li>
                „Przybliżone” — {GPR_MATCH_HIGH_M}–{GPR_MATCH_MAX_M} m; podnosi priorytet weryfikacji danych.
              </li>
              <li>„Niejednoznaczne” — w promieniu jest inna droga albo odcinek z innym SDRR.</li>
              <li>
                Autostrady i drogi ekspresowe są pomijane: krzyżują się z koleją bezkolizyjnie (§39 ust. 1 pkt
                1).
              </li>
              <li>Brak dopasowania oznacza brak danych GPR (zwykle droga lokalna), a nie zerowy ruch.</li>
            </ul>
            <p>Progi są heurystyką, nie zweryfikowaną wartością — do sprawdzenia w pilotażu.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="nie">
          <AccordionTrigger>Czego aplikacja nie robi</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5 text-sm">
              {NOT_DOING.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ograniczenia">
          <AccordionTrigger>Ograniczenia</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-5 text-sm">
              <li>
                Dane o kontrolach, zdarzeniach, naruszeniach i liczbie pociągów są fikcyjne (X1–X10); w
                pilotażu potrzebne są dane wewnętrzne zarządców.
              </li>
              <li>
                Przypadki X1–X10 osadzono na realnych przejazdach według stałej reguły (ta sama kategoria,
                różne jednostki PLK, brak danych GPR, najniższy numer obiektu WFS; scripts/assign-cases.ts).
                Zdarzenia nie dotyczą tych przejazdów.
              </li>
              <li>
                Reguły objaw → przyczyna → środek oparto na raportach PKBWK i UTK; wymagają walidacji z
                ekspertami.
              </li>
              <li>
                Dowody skuteczności pochodzą głównie z USA i Wielkiej Brytanii; przenoszalność do Polski jest
                niepotwierdzona.
              </li>
              <li>Podział kompetencji między zarządcę kolei i zarządcę drogi jest uproszczony.</li>
              <li>
                Kategoria w WFS nie zawiera informacji o prędkości pociągów, widoczności ani liczbie torów,
                które również decydują o kategorii (§7–§10).
              </li>
              <li>
                Warunki licencyjne danych WFS i GPR nie są opublikowane przy źródłach — do potwierdzenia przed
                publikacją.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <section aria-labelledby="zrodla" className="flex flex-col gap-2">
        <h2 id="zrodla" className="text-base font-semibold">
          Źródła i licencje
        </h2>
        <ul
          aria-label="Rejestr źródeł"
          className="flex flex-col divide-y rounded-sm border bg-card md:hidden"
        >
          {sorted.map((s) => (
            <li key={s.id} className="flex flex-col gap-1.5 p-3 text-sm">
              <span className="text-xs text-muted-foreground">
                {s.kind === 'dataset' ? 'Dane' : 'Dokument'}, pobrano {formatDate(s.retrievedAt)}
              </span>
              <span className="font-medium">{s.title}</span>
              <span className="text-xs text-muted-foreground">{s.publisher}</span>
              <SourceLink url={s.url} />
              <span className="text-xs">
                <span className="text-muted-foreground">Warunki: </span>
                {s.license}
              </span>
              <span className="text-xs">
                <span className="text-muted-foreground">Przetworzenie: </span>
                {s.processing}
              </span>
            </li>
          ))}
        </ul>
        <div className="hidden rounded-sm border bg-card md:block">
          <Table aria-label="Rejestr źródeł">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Rodzaj</TableHead>
                <TableHead className="text-xs">Źródło</TableHead>
                <TableHead className="text-xs">Pobrano</TableHead>
                <TableHead className="text-xs">Licencja / warunki</TableHead>
                <TableHead className="text-xs">Przetworzenie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="align-top text-xs">
                    {s.kind === 'dataset' ? 'Dane' : 'Dokument'}
                  </TableCell>
                  <TableCell className="max-w-80 align-top whitespace-normal">
                    <span className="block font-medium">{s.title}</span>
                    <span className="block text-xs text-muted-foreground">{s.publisher}</span>
                    <SourceLink url={s.url} />
                    {s.records !== undefined ? (
                      <span className="block text-xs tabular-nums">rekordów: {formatInt(s.records)}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="align-top text-xs whitespace-nowrap">
                    {formatDate(s.retrievedAt)}
                  </TableCell>
                  <TableCell className="max-w-64 align-top text-xs whitespace-normal">{s.license}</TableCell>
                  <TableCell className="max-w-96 align-top text-xs whitespace-normal">
                    {s.processing}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </>
  )
}
