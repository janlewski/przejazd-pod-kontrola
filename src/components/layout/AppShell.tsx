import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { BrandMark } from '@/components/common/BrandMark'
import { Toaster } from '@/components/ui/sonner'
import { sourceById } from '@/data'
import { formatDate, formatInt } from '@/lib/format'
import { cn } from '@/lib/utils'

const STATIONS = [
  { to: '/przeglad', code: '01', label: 'Przegląd', hint: 'cykl i liczby', end: true },
  { to: '/przejazdy', code: '02', label: 'Przejazdy', hint: 'wskazanie', end: false },
  { to: '/srodki', code: '03', label: 'Środki zaradcze', hint: 'katalog', end: false },
  { to: '/wdrozenia', code: '04', label: 'Wdrożenia', hint: 'śledzenie', end: false },
  { to: '/ocena', code: '05', label: 'Ocena przed/po', hint: 'efekt', end: false },
  { to: '/metoda', code: '06', label: 'Metoda i źródła', hint: 'jawne reguły', end: false },
] as const

function LineNav() {
  return (
    <nav aria-label="Główna nawigacja">
      <ol className="relative flex flex-row flex-wrap gap-1 md:flex-col md:gap-0">
        <span
          aria-hidden
          className="absolute top-3 bottom-3 left-[13px] hidden w-[3px] bg-sidebar-foreground/45 md:block"
        />
        {STATIONS.map((s) => (
          <li key={s.to} className="relative">
            <NavLink
              to={s.to}
              end={s.end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-sm px-1 py-2 no-underline md:py-2.5',
                  isActive ? 'text-white' : 'text-sidebar-foreground hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden
                    className={cn(
                      'relative z-10 hidden size-[19px] shrink-0 items-center justify-center rounded-full border-[3px] md:flex',
                      isActive
                        ? 'border-white bg-white'
                        : 'border-sidebar-foreground/70 bg-sidebar group-hover:border-white',
                    )}
                  >
                    {isActive ? <span className="size-[7px] rounded-full bg-sidebar" /> : null}
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className={cn('text-sm', isActive && 'font-semibold')}>{s.label}</span>
                    <span aria-hidden className="hidden text-[11px] text-sidebar-foreground/70 md:block">
                      <span className="font-mono">{s.code}</span> · {s.hint}
                    </span>
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function AppShell() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const wfs = sourceById('gugik-wfs-przejazdy')

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <>
      <a
        href="#tresc"
        onClick={(e) => {
          e.preventDefault()
          mainRef.current?.focus()
        }}
        className="sr-only z-50 bg-card px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Przejdź do treści
      </a>
      <div className="grid min-h-svh grid-cols-1 md:grid-cols-[15rem_1fr]">
        <aside className="bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-svh">
          <div className="flex h-full flex-col gap-6 p-4">
            <Link to="/" className="flex items-center gap-3 no-underline">
              <BrandMark />
              <span className="flex flex-col leading-tight">
                <span className="text-base font-semibold text-white">Przejazd pod kontrolą</span>
                <span className="text-xs text-sidebar-foreground/75">prototyp konkursowy</span>
              </span>
            </Link>
            <LineNav />
            <dl className="mt-auto hidden grid-cols-[auto_1fr] gap-x-2 gap-y-1 border-t border-sidebar-border pt-3 font-mono text-[11px] md:grid">
              <dt className="text-sidebar-foreground/70">Realne</dt>
              <dd>PKP PLK · GDDKiA</dd>
              <dt className="text-sidebar-foreground/70">Fikcyjne</dt>
              <dd>X1–X10</dd>
              <dt className="text-sidebar-foreground/70">Stan</dt>
              <dd>{wfs ? formatDate(wfs.retrievedAt) : '—'}</dd>
            </dl>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-1.5">
            <span className="text-xs text-muted-foreground">
              {wfs?.records !== undefined ? `${formatInt(wfs.records)} przejazdów · ` : ''}trzy wyniki, bez
              jednego wskaźnika
            </span>
            <span className="rounded-sm bg-foreground px-1.5 py-0.5 text-xs font-medium text-background">
              Demo — wersja konkursowa
            </span>
          </header>

          <main
            id="tresc"
            ref={mainRef}
            tabIndex={-1}
            className="flex w-full max-w-[1600px] flex-1 flex-col gap-5 p-5 outline-none"
          >
            <Outlet />
          </main>

          <footer className="border-t bg-card px-5 py-3 text-xs text-muted-foreground">
            <p>
              Dane realne: przejazdy kolejowo-drogowe PKP PLK (usługa WFS GUGiK), Generalny Pomiar Ruchu 2025
              (GDDKiA). Dane o kontrolach, zdarzeniach i naruszeniach to DANE FIKCYJNE. Podkład mapy ©{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                OpenStreetMap contributors
              </a>
              . Szczegóły:{' '}
              <NavLink to="/metoda" className="underline">
                Metoda i źródła
              </NavLink>
              .
            </p>
          </footer>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </>
  )
}
