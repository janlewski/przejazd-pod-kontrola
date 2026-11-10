import { NavLink, Outlet, useLocation } from 'react-router'
import { useEffect, useRef } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Przegląd', end: true },
  { to: '/przejazdy', label: 'Przejazdy', end: false },
  { to: '/srodki', label: 'Środki zaradcze', end: false },
  { to: '/wdrozenia', label: 'Wdrożenia', end: false },
  { to: '/ocena', label: 'Ocena przed/po', end: false },
  { to: '/metoda', label: 'Metoda i źródła', end: false },
] as const

export function AppShell() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

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
      <div className="grid min-h-svh grid-cols-1 md:grid-cols-[14rem_1fr]">
        <aside className="border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-svh md:border-r">
          <div className="flex h-full flex-col gap-4 p-4">
            <div className="flex flex-col gap-1">
              <span className="text-base leading-tight font-semibold text-white">Przejazd pod kontrolą</span>
              <span className="text-xs text-sidebar-foreground/80">
                Wskazanie → diagnoza → środek → wdrożenie → ocena
              </span>
            </div>
            <nav aria-label="Główna nawigacja">
              <ul className="flex flex-row flex-wrap gap-1 md:flex-col">
                {NAV.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          'block rounded-sm border-l-2 px-2 py-1.5 text-sm no-underline',
                          isActive
                            ? 'border-warning bg-sidebar-accent font-medium text-white'
                            : 'border-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-white',
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-auto hidden text-xs text-sidebar-foreground/80 md:block">
              Realne: przejazdy PKP PLK (WFS GUGiK), ruch GDDKiA GPR 2025. Fikcyjne: przypadki X1–X10.
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-2">
            <span className="text-xs text-muted-foreground">
              Demonstracja dla zespołów utrzymania i bezpieczeństwa przejazdów kolejowo-drogowych
            </span>
            <span className="rounded-sm border border-foreground px-1.5 py-0.5 font-mono text-[11px] tracking-wide uppercase">
              Demo — wersja konkursowa
            </span>
          </header>

          <main
            id="tresc"
            ref={mainRef}
            tabIndex={-1}
            className="flex w-full max-w-[1600px] flex-1 flex-col gap-4 p-4 outline-none"
          >
            <Outlet />
          </main>

          <footer className="border-t bg-card px-4 py-3 text-xs text-muted-foreground">
            <p>
              Dane realne: przejazdy kolejowo-drogowe PKP PLK (usługa WFS GUGiK, stan na 10.11.2026),
              Generalny Pomiar Ruchu 2025 (GDDKiA). Dane o kontrolach, zdarzeniach i naruszeniach to DANE
              FIKCYJNE. Podkład mapy ©{' '}
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
