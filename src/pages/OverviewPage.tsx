import { Link } from 'react-router'
import { PageHeader } from '@/components/common/PageHeader'
import { SourceFootnote } from '@/components/common/SourceFootnote'
import { OriginBadge } from '@/components/common/badges'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { caseRows, sourceById } from '@/data'
import { formatInt } from '@/lib/format'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    name: 'Wskazanie',
    text: 'Które przejazdy skontrolować najpierw, z jawną listą powodów.',
    to: '/przejazdy',
  },
  { name: 'Diagnoza', text: 'Powtarzalny wzorzec: objaw → przyczyna.', to: '/przejazdy/X1' },
  {
    name: 'Środki',
    text: 'Siła dowodu, źródło, podmiot odpowiedzialny, Dz.U. 2025 poz. 1105.',
    to: '/srodki',
  },
  { name: 'Wdrożenie', text: 'Zaplanowane, w realizacji, wdrożone, zweryfikowane.', to: '/wdrozenia' },
  { name: 'Ocena', text: 'Naruszenia przed i po, zawsze z zastrzeżeniami.', to: '/ocena' },
]

const OUTPUTS = [
  {
    code: 'P1–P3',
    title: 'Priorytet kontroli',
    text: 'Wynika z objawów i naruszeń stwierdzonych na przejeździe. Brak danych nigdy go nie obniża.',
  },
  {
    code: 'V1–V3',
    title: 'Priorytet weryfikacji danych',
    text: 'Czego brakuje, aby reguły działały: kategoria, kontrole, ruch drogowy, pociągi na dobę.',
  },
  {
    code: 'progi 60 000 i 150 000',
    title: 'Kontekst ekspozycji',
    text: 'Iloczyn ruchu porównany z progami Dz.U. 2025 poz. 1105. Kontekst regulacyjny, nie miara ryzyka.',
  },
]

function BoardCell({
  label,
  value,
  note,
  fictional = false,
}: {
  label: string
  value: string
  note: string
  fictional?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4',
        fictional && 'm-2 rounded-sm border border-dashed border-background/60',
      )}
    >
      <span className="text-sm text-background/85">{label}</span>
      <span className="font-mono text-[2.75rem] leading-none font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-background/75">{note}</span>
    </div>
  )
}

/** The five-step cycle drawn as a railway line with stations. */
function CycleLine() {
  return (
    <ol className="relative grid gap-4 md:grid-cols-5 md:gap-0">
      <span
        aria-hidden
        className="absolute top-[9px] right-[10%] left-[10%] hidden h-[3px] bg-foreground md:block"
      />
      {STEPS.map((s) => (
        <li key={s.name} className="relative flex gap-3 md:flex-col md:items-center md:px-3 md:text-center">
          <span
            aria-hidden
            className="relative z-10 flex size-[21px] shrink-0 items-center justify-center rounded-full border-[3px] border-foreground bg-background"
          >
            <span className="size-[7px] rounded-full bg-foreground" />
          </span>
          <span className="flex flex-col gap-0.5">
            <Link to={s.to} className="text-base font-semibold">
              {s.name}
            </Link>
            <span className="text-sm text-muted-foreground">{s.text}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

export default function OverviewPage() {
  const crossingsSource = sourceById('gugik-wfs-przejazdy')
  const gprMatch = sourceById('derived-gpr-match')
  const p1 = caseRows.filter((r) => r.assessment.inspection.level === 'P1').length
  const v1 = caseRows.filter((r) => r.assessment.verification.level === 'V1').length

  return (
    <>
      <PageHeader
        title="Przegląd"
        description="Od wskazania przejazdu do sprawdzenia efektu: wskazanie, diagnoza, dobór środka, śledzenie wdrożenia i ocena przed/po."
      />

      <section aria-labelledby="tablica" className="rounded-sm bg-foreground text-background">
        <h2 id="tablica" className="sr-only">
          Liczby
        </h2>
        <div className="grid divide-background/20 sm:grid-cols-3 sm:divide-x">
          <BoardCell
            label="Przejazdy w zbiorze"
            value={crossingsSource?.records !== undefined ? formatInt(crossingsSource.records) : '—'}
            note="dane realne, WFS GUGiK / PKP PLK"
          />
          <BoardCell
            label="Przypadki P1: kontrola w pierwszej kolejności"
            value={`${p1}/${caseRows.length}`}
            note="dane fikcyjne, X1–X10"
            fictional
          />
          <BoardCell
            label="Przypadki V1: najpierw uzupełnić dane"
            value={`${v1}/${caseRows.length}`}
            note="dane fikcyjne, X1–X10"
            fictional
          />
        </div>
      </section>

      <section aria-labelledby="cykl" className="flex flex-col gap-4">
        <h2 id="cykl" className="text-base font-semibold">
          Cykl pracy
        </h2>
        <CycleLine />
      </section>

      <section aria-labelledby="wyniki" className="flex flex-col gap-3">
        <h2 id="wyniki" className="text-base font-semibold">
          Trzy osobne wyniki zamiast jednego wskaźnika
        </h2>
        <dl className="divide-y rounded-sm border bg-card">
          {OUTPUTS.map((o) => (
            <div
              key={o.title}
              className="grid gap-1 px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-6"
            >
              <dt className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold">{o.title}</span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{o.code}</span>
              </dt>
              <dd className="text-sm text-muted-foreground">{o.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="dane" className="flex flex-col gap-3">
        <h2 id="dane" className="text-base font-semibold">
          Dane realne i fikcyjne
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="gap-3 py-4">
            <CardHeader className="px-4">
              <OriginBadge origin="real" />
              <CardDescription>
                <SourceFootnote sourceId="gugik-wfs-przejazdy" />.{' '}
                <SourceFootnote sourceId="gddkia-gpr-2025" />
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4">
              <ul className="list-disc pl-5 text-sm">
                <li>
                  Położenie, numer identyfikacyjny i kategoria{' '}
                  {crossingsSource?.records !== undefined ? formatInt(crossingsSource.records) : ''}{' '}
                  przejazdów PKP PLK.
                </li>
                <li>
                  Średni dobowy ruch roczny (SDRR) z GPR 2025, tylko drogi krajowe. Dopasowanie do{' '}
                  {gprMatch?.records !== undefined ? formatInt(gprMatch.records) : ''} przejazdów.
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card className="gap-3 border-dashed border-foreground py-4">
            <CardHeader className="px-4">
              <OriginBadge origin="fictional" />
              <CardDescription>Przykład działania, nie opis rzeczywistych przejazdów.</CardDescription>
            </CardHeader>
            <CardContent className="px-4">
              <ul className="list-disc pl-5 text-sm">
                <li>Przypadki X1–X10: objawy, wyniki kontroli, naruszenia, pociągi na dobę.</li>
                <li>
                  Przypadki osadzono na realnych przejazdach (numer, położenie, kategoria), ale zdarzenia ich
                  nie dotyczą.
                </li>
                <li>Dane o zdarzeniach i kontrolach są danymi wewnętrznymi zarządców i nie są publiczne.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  )
}
