import { Link } from 'react-router'
import { Metric } from '@/components/common/Metric'
import { PageHeader } from '@/components/common/PageHeader'
import { SourceFootnote } from '@/components/common/SourceFootnote'
import { OriginBadge } from '@/components/common/badges'
import { caseRows, sourceById } from '@/data'
import { formatInt } from '@/lib/format'

const STEPS = [
  {
    name: 'Wskazanie',
    text: 'Które przejazdy skontrolować najpierw — z jawną listą powodów.',
    to: '/przejazdy',
  },
  {
    name: 'Diagnoza',
    text: 'Jaki powtarzalny wzorzec (objaw → przyczyna) występuje na przejeździe.',
    to: '/przejazdy/X1',
  },
  {
    name: 'Środki',
    text: 'Menu środków z siłą dowodu, źródłem, podmiotem odpowiedzialnym i odniesieniem do Dz.U. 2025 poz. 1105.',
    to: '/srodki',
  },
  {
    name: 'Wdrożenie',
    text: 'Status zadania: zaplanowane, w realizacji, wdrożone, zweryfikowane.',
    to: '/wdrozenia',
  },
  { name: 'Ocena', text: 'Zmiana liczby naruszeń przed i po, zawsze z zastrzeżeniami.', to: '/ocena' },
]

export default function OverviewPage() {
  const crossingsSource = sourceById('gugik-wfs-przejazdy')
  const gprMatch = sourceById('derived-gpr-match')
  const p1 = caseRows.filter((r) => r.assessment.inspection.level === 'P1').length
  const v1 = caseRows.filter((r) => r.assessment.verification.level === 'V1').length

  return (
    <>
      <PageHeader
        title="Przegląd"
        description="Narzędzie prowadzi przez cykl: wskazanie przejazdu do kontroli, diagnoza wzorca, dobór środka, śledzenie wdrożenia i ocena efektu."
      />

      <section aria-labelledby="liczby" className="grid gap-4 sm:grid-cols-3">
        <h2 id="liczby" className="sr-only">
          Liczby
        </h2>
        <Metric
          label="Przejazdy w zbiorze"
          value={crossingsSource?.records !== undefined ? formatInt(crossingsSource.records) : 'brak danych'}
          note={
            <>
              <OriginBadge origin="real" /> <SourceFootnote sourceId="gugik-wfs-przejazdy" />
            </>
          }
        />
        <Metric
          label="Przypadki P1 — kontrola w pierwszej kolejności"
          value={`${formatInt(p1)} z ${formatInt(caseRows.length)}`}
          note={
            <>
              <OriginBadge origin="fictional" /> przypadki X1–X10
            </>
          }
        />
        <Metric
          label="Przypadki V1 — najpierw weryfikacja danych"
          value={`${formatInt(v1)} z ${formatInt(caseRows.length)}`}
          note={
            <>
              <OriginBadge origin="fictional" /> przypadki X1–X10
            </>
          }
        />
      </section>

      <section aria-labelledby="cykl" className="flex flex-col gap-2">
        <h2 id="cykl" className="text-base font-semibold">
          Cykl pracy
        </h2>
        <ol className="grid gap-px overflow-hidden rounded-sm border bg-border md:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.name} className="flex flex-col gap-1 bg-card p-3">
              <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
              <Link to={s.to} className="font-medium">
                {s.name}
              </Link>
              <span className="text-sm text-muted-foreground">{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="wyniki" className="flex flex-col gap-2">
        <h2 id="wyniki" className="text-base font-semibold">
          Trzy osobne wyniki zamiast jednego wskaźnika
        </h2>
        <div className="grid gap-px overflow-hidden rounded-sm border bg-border md:grid-cols-3">
          <div className="flex flex-col gap-1 bg-card p-3">
            <span className="font-medium">Priorytet kontroli (P1–P3)</span>
            <span className="text-sm text-muted-foreground">
              Wynika z objawów i naruszeń stwierdzonych na przejeździe. Brak danych nigdy go nie obniża.
            </span>
          </div>
          <div className="flex flex-col gap-1 bg-card p-3">
            <span className="font-medium">Priorytet weryfikacji danych (V1–V3)</span>
            <span className="text-sm text-muted-foreground">
              Mówi, czego brakuje, aby reguły działały: kategoria, kontrole, ruch drogowy, pociągi na dobę.
            </span>
          </div>
          <div className="flex flex-col gap-1 bg-card p-3">
            <span className="font-medium">Kontekst ekspozycji</span>
            <span className="text-sm text-muted-foreground">
              Ruch drogowy, pociągi na dobę i iloczyn ruchu porównany z progami 60 000 i 150 000 (Dz.U. 2025
              poz. 1105). Kontekst regulacyjny, nie miara ryzyka.
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="dane" className="flex flex-col gap-2">
        <h2 id="dane" className="text-base font-semibold">
          Dane realne i fikcyjne
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-sm border bg-card p-3">
            <OriginBadge origin="real" />
            <ul className="list-disc pl-5 text-sm">
              <li>
                Położenie, numer identyfikacyjny i kategoria{' '}
                {crossingsSource?.records !== undefined ? formatInt(crossingsSource.records) : ''} przejazdów
                PKP PLK — usługa WFS GUGiK.
              </li>
              <li>
                Średni dobowy ruch roczny (SDRR) z Generalnego Pomiaru Ruchu 2025 — tylko drogi krajowe;
                dopasowanie do {gprMatch?.records !== undefined ? formatInt(gprMatch.records) : ''}{' '}
                przejazdów.
              </li>
            </ul>
          </div>
          <div className="fictional-frame flex flex-col gap-2 rounded-sm bg-card p-3">
            <OriginBadge origin="fictional" />
            <ul className="list-disc pl-5 text-sm">
              <li>Przypadki X1–X10: objawy, wyniki kontroli, naruszenia, pociągi na dobę.</li>
              <li>Położenie przypadków na mapie jest umowne — nie wskazują rzeczywistych przejazdów.</li>
              <li>Dane o zdarzeniach i kontrolach są danymi wewnętrznymi zarządców i nie są publiczne.</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
