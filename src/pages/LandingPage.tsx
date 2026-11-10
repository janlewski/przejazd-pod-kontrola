import {
  ArrowDown,
  ArrowRight,
  ChartColumn,
  Check,
  Crosshair,
  Minus,
  Stethoscope,
  Wrench,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { BrandMark } from '@/components/common/BrandMark'
import { FictionalDataBanner } from '@/components/common/FictionalDataBanner'
import { TrackRule } from '@/components/common/TrackRule'
import { CrossingSchematic } from '@/components/landing/CrossingSchematic'
import { Button } from '@/components/ui/button'
import { PROJECT } from '@/config/project'
import { sourceById } from '@/data'
import { UTK_USER_INCIDENTS_2021_2025 as UTK } from '@/data/facts'
import { formatDate, formatInt } from '@/lib/format'

const STEPS = [
  {
    icon: Crosshair,
    name: 'Wskaż',
    text: 'Lista i mapa pokazują, które przejazdy skontrolować najpierw — z powodem każdej oceny.',
    to: '/przejazdy',
  },
  {
    icon: Stethoscope,
    name: 'Zdiagnozuj',
    text: 'Objawy z kontroli wskazują przyczynę: objazd półrogatki, kolejkę do torów, brak widoczności.',
    to: `/przejazdy/${PROJECT.demoCaseId}`,
  },
  {
    icon: Wrench,
    name: 'Zaproponuj środki',
    text: 'Każdy środek ma siłę dowodu, źródło, podmiot odpowiedzialny i odniesienie do Dz.U. 2025 poz. 1105.',
    to: '/srodki',
  },
  {
    icon: ChartColumn,
    name: 'Oceń efekt',
    text: 'Naruszenia przed i po wdrożeniu, zawsze z zastrzeżeniami: jeden spadek niczego nie dowodzi.',
    to: '/ocena',
  },
]

const IS = [
  'Narzędzie do planowania kontroli i doboru środków na przejazdach kolejowo-drogowych.',
  'Każda ocena pokazuje swoje powody i źródła, więc da się ją sprawdzić i podważyć.',
  'Trzy osobne wyniki: priorytet kontroli, braki w danych i kontekst ruchu.',
]

const IS_NOT = [
  'Jeden „wskaźnik niebezpieczeństwa” — celowo go nie liczymy.',
  'Prognoza wypadków ani obietnica, że będzie ich mniej.',
  'System decyzyjny: decyzja należy do zarządcy kolei i zarządcy drogi.',
]

const DATA_SOURCES = [
  { id: 'gugik-wfs-przejazdy', what: 'położenie, numer i kategoria przejazdów PKP PLK' },
  { id: 'gddkia-gpr-2025', what: 'średni dobowy ruch roczny na drogach krajowych' },
  { id: 'pkbwk-raport-2024', what: 'przyczyny zdarzeń — punkt wyjścia do wzorców' },
  { id: 'utk-raport-2025', what: 'zdarzenia i incydenty na przejazdach 2021–2025' },
  { id: 'osm-tiles', what: 'podkład mapy' },
]

export default function LandingPage() {
  const howRef = useRef<HTMLHeadingElement>(null)
  const utk = sourceById(UTK.sourceId)
  const wfs = sourceById('gugik-wfs-przejazdy')

  useEffect(() => {
    document.title = `${PROJECT.name} — ${PROJECT.tagline}`
  }, [])

  const showHow = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    howRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    howRef.current?.focus({ preventScroll: true })
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <BrandMark size={28} inverted />
            <p className="text-sm">
              Prototyp konkursowy · {PROJECT.contest}{' '}
              <span className="text-muted-foreground">· {PROJECT.contestOrganizer}</span>
            </p>
          </div>
          <a href={PROJECT.repoUrl} target="_blank" rel="noreferrer" className="text-sm">
            Kod źródłowy na GitHubie
          </a>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-10 lg:min-h-[calc(100svh-3.5rem)] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:py-12">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance">
                {PROJECT.name}
              </h1>
              <p className="text-xl text-muted-foreground">
                Od diagnozy do sprawdzonej poprawy bezpieczeństwa.
              </p>
            </div>

            <TrackRule className="max-w-xl" />

            <div className="flex max-w-[62ch] flex-col gap-3">
              <p className="text-lg leading-relaxed">
                W latach {UTK.years} doszło do{' '}
                <strong className="font-semibold tabular-nums">{formatInt(UTK.total)}</strong> incydentów z
                winy użytkowników przejazdów i przejść.{' '}
                <strong className="font-semibold tabular-nums">{formatInt(UTK.categoryB)}</strong> z nich —
                ponad 90% — na przejazdach kategorii B, wyposażonych w półrogatki i sygnalizację.
              </p>
              <p className="text-sm text-muted-foreground">
                Źródło:{' '}
                <a href={utk?.url} target="_blank" rel="noreferrer">
                  UTK, Raport w sprawie bezpieczeństwa za 2025
                </a>
                , s. {UTK.page} — incydenty kategorii {UTK.incidentCategories}.
              </p>
              <p className="leading-relaxed">
                Takie zdarzenia układają się w powtarzalne wzorce. Aplikacja pomaga wskazać przejazdy do
                kontroli, rozpoznać wzorzec, dobrać środek z udokumentowanym dowodem i sprawdzić, czy
                zadziałał.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <Button asChild size="lg" className="h-12 rounded-sm px-6 text-base">
                  <Link to={`/przejazdy?wybrany=${PROJECT.demoCaseId}`}>
                    Otwórz demo
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button variant="link" className="px-0 text-base" onClick={showHow}>
                  Jak to działa
                  <ArrowDown aria-hidden />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Demo otwiera mapę z przykładowym przypadkiem {PROJECT.demoCaseId}. Przypadki X1–X10 to dane
                fikcyjne.
              </p>
            </div>
          </div>

          <figure className="flex flex-col gap-3">
            <div className="rounded-sm border bg-card p-3">
              <CrossingSchematic />
            </div>
            <figcaption className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Przejazd kategorii B — schemat, widok z góry</span>
              <ol className="flex flex-col gap-1 text-muted-foreground">
                <li>1 — sygnalizator świetlny i dźwiękowy;</li>
                <li>2 — półrogatka zamyka tylko pas wjazdowy;</li>
                <li>3 — incydent C66: niezatrzymanie się przed zamkniętą półrogatką i jej uszkodzenie.</li>
              </ol>
            </figcaption>
          </figure>
        </section>

        <div className="border-t bg-card">
          <div className="mx-auto flex max-w-6xl flex-col gap-14 px-5 py-14">
            <section aria-labelledby="jak-to-dziala" className="flex flex-col gap-8">
              <h2
                id="jak-to-dziala"
                ref={howRef}
                tabIndex={-1}
                className="scroll-mt-6 text-2xl font-semibold tracking-tight outline-none"
              >
                Jak to działa
              </h2>
              <ol className="relative grid gap-8 md:grid-cols-4 md:gap-6">
                <span
                  aria-hidden
                  className="absolute top-5 right-[12%] left-[12%] hidden h-[3px] bg-foreground md:block"
                />
                {STEPS.map(({ icon: Icon, name, text, to }) => (
                  <li key={name} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                    <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-[3px] border-foreground bg-card">
                      <Icon aria-hidden className="size-[18px]" strokeWidth={2} />
                    </span>
                    <span className="flex flex-col gap-1">
                      <Link to={to} className="text-lg font-semibold">
                        {name}
                      </Link>
                      <span className="text-sm text-muted-foreground">{text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="czym-jest" className="flex flex-col gap-6">
              <h2 id="czym-jest" className="text-2xl font-semibold tracking-tight">
                Czym jest, a czym nie jest
              </h2>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <h3 className="font-semibold">Jest</h3>
                  <ul className="flex flex-col gap-2.5">
                    {IS.map((t) => (
                      <li key={t} className="flex gap-3">
                        <Check aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="font-semibold">Nie jest</h3>
                  <ul className="flex flex-col gap-2.5">
                    {IS_NOT.map((t) => (
                      <li key={t} className="flex gap-3">
                        <Minus aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section aria-labelledby="dane" className="flex flex-col gap-6">
              <h2 id="dane" className="text-2xl font-semibold tracking-tight">
                Dane i przejrzystość
              </h2>
              <FictionalDataBanner>
                Przypadki X1–X10 — objawy, kontrole, naruszenia i liczba pociągów — są zmyślone, żeby pokazać
                działanie aplikacji. Nie opisują rzeczywistych przejazdów, a ich położenie na mapie jest
                umowne.
              </FictionalDataBanner>
              <ul className="divide-y border-y">
                {DATA_SOURCES.map(({ id, what }) => {
                  const s = sourceById(id)
                  if (!s) return null
                  return (
                    <li
                      key={id}
                      className="grid gap-1 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-6"
                    >
                      <span className="flex flex-col">
                        <a href={s.url} target="_blank" rel="noreferrer" className="font-medium">
                          {s.publisher}
                        </a>
                        <span className="text-sm text-muted-foreground">{what}</span>
                      </span>
                      <span className="text-sm">
                        <span className="text-muted-foreground">Warunki: </span>
                        {s.license}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <Link to="/metoda" className="self-start">
                Pełny rejestr źródeł, licencji i sposobu przetworzenia
              </Link>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-5 text-sm text-muted-foreground">
          <span>{PROJECT.authors.join(', ')}</span>
          <a href={PROJECT.repoUrl} target="_blank" rel="noreferrer">
            {PROJECT.repoUrl.replace('https://', '')}
          </a>
          <span>Stan danych: {wfs ? formatDate(wfs.retrievedAt) : 'brak'}</span>
          <span>Kod na licencji MIT</span>
        </div>
      </footer>
    </div>
  )
}
