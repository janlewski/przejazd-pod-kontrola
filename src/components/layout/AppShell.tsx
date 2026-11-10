import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { sourceById } from '@/data'
import { formatDate, formatInt } from '@/lib/format'
import { cn } from '@/lib/utils'

const STATIONS = [
  { to: '/', code: '01', label: 'Przegląd', hint: 'cykl i liczby', end: true },
  { to: '/przejazdy', code: '02', label: 'Przejazdy', hint: 'wskazanie', end: false },
  { to: '/srodki', code: '03', label: 'Środki zaradcze', hint: 'katalog', end: false },
  { to: '/wdrozenia', code: '04', label: 'Wdrożenia', hint: 'śledzenie', end: false },
  { to: '/ocena', code: '05', label: 'Ocena przed/po', hint: 'efekt', end: false },
  { to: '/metoda', code: '06', label: 'Metoda i źródła', hint: 'jawne reguły', end: false },
] as const

/** Crossing plate: a square sign with crossed bars (after the St Andrew's cross). */
function BrandMark() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden className="shrink-0">
      <rect x="1" y="1" width="34" height="34" rx="3" fill="#FAFAF7" />
      <g transform="rotate(45 18 18)">
        <rect x="4" y="15" width="28" height="6" fill="#1F2328" />
        <rect x="15" y="4" width="6" height="28" fill="#1F2328" />
        <rect x="9" y="15" width="3" height="6" fill="#FAFAF7" />
        <rect x="24" y="15" width="3" height="6" fill="#FAFAF7" />
        <rect x="15" y="9" width="6" height="3" fill="#FAFAF7" />
        <rect x="15" y="24" width="6" height="3" fill="#FAFAF7" />
      </g>
    </svg>
  )
}

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
                    <span
                      aria-hidden
                      className="hidden font-mono text-[10px] tracking-wider text-sidebar-foreground/70 uppercase md:block"
                    >
                      {s.code} · {s.hint}
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
            <div className="flex items-center gap-3">
              <BrandMark />
              <div className="flex flex-col leading-tight">
                <span className="text-base font-semibold text-white">Przejazd pod kontrolą</span>
                <span className="font-mono text-[10px] tracking-wider text-sidebar-foreground/75 uppercase">
                  linia demonstracyjna
                </span>
              </div>
            </div>
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
            <span className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
              {wfs?.records !== undefined ? `${formatInt(wfs.records)} przejazdów · ` : ''}trzy wyniki, bez
              jednego wskaźnika
            </span>
            <span className="rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[11px] tracking-wider text-background uppercase">
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
