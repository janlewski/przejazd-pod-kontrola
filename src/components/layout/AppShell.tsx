import { Menu } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { BrandMark } from '@/components/common/BrandMark'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Toaster } from '@/components/ui/sonner'
import { sourceById } from '@/data'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

const STATIONS = [
  { to: '/przeglad', label: 'Przegląd', end: true },
  { to: '/przejazdy', label: 'Przejazdy', end: false },
  { to: '/srodki', label: 'Środki zaradcze', end: false },
  { to: '/wdrozenia', label: 'Wdrożenia', end: false },
  { to: '/ocena', label: 'Ocena przed/po', end: false },
  { to: '/metoda', label: 'Metoda i źródła', end: false },
] as const

function LineNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Główna nawigacja">
      <ol className="relative flex flex-col">
        <span aria-hidden className="absolute top-3 bottom-3 left-[13px] w-[3px] bg-sidebar-foreground/45" />
        {STATIONS.map((s) => (
          <li key={s.to} className="relative">
            <NavLink
              to={s.to}
              end={s.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex min-h-11 items-center gap-3 rounded-sm px-1 py-2 no-underline',
                  isActive ? 'text-white' : 'text-sidebar-foreground hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden
                    className={cn(
                      'relative z-10 flex size-[19px] shrink-0 items-center justify-center rounded-full border-[3px]',
                      isActive
                        ? 'border-white bg-white'
                        : 'border-sidebar-foreground/70 bg-sidebar group-hover:border-white',
                    )}
                  >
                    {isActive ? <span className="size-[7px] rounded-full bg-sidebar" /> : null}
                  </span>
                  <span className={cn('text-sm leading-tight', isActive && 'font-semibold')}>{s.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 no-underline">
      <BrandMark size={compact ? 28 : 36} />
      <span className="flex flex-col leading-tight">
        <span className={cn('font-semibold text-white', compact ? 'text-sm' : 'text-base')}>
          Przejazd pod kontrolą
        </span>
        <span className="text-xs text-sidebar-foreground/75">prototyp konkursowy</span>
      </span>
    </Link>
  )
}

export function AppShell() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const wfs = sourceById('gugik-wfs-przejazdy')

  const firstRender = useRef(true)

  useEffect(() => {
    // On route changes (not the first load), move focus to the new page's heading so
    // screen readers announce the page.
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const heading = mainRef.current?.querySelector<HTMLElement>('h1[tabindex="-1"]')
    ;(heading ?? mainRef.current)?.focus({ preventScroll: true })
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
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-sidebar px-4 py-2 text-sidebar-foreground md:hidden">
        <Brand compact />
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="h-11 gap-2 px-3 text-white hover:bg-sidebar-accent hover:text-white"
            >
              <Menu aria-hidden />
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar text-sidebar-foreground">
            <SheetHeader>
              <SheetTitle className="text-white">Przejazd pod kontrolą</SheetTitle>
              <SheetDescription className="text-sidebar-foreground/75">Nawigacja</SheetDescription>
            </SheetHeader>
            <div className="px-4">
              <LineNav onNavigate={() => setMenuOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </header>
      <div className="grid min-h-svh grid-cols-1 md:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:block md:h-svh">
          <div className="flex h-full flex-col gap-6 p-4">
            <Brand />
            <LineNav />
            <dl className="mt-auto hidden grid-cols-[auto_1fr] gap-x-2 gap-y-1 border-t border-sidebar-border pt-3 font-mono text-[11px] md:grid">
              <dt className="text-sidebar-foreground/70">Realne</dt>
              <dd>PKP PLK, GDDKiA</dd>
              <dt className="text-sidebar-foreground/70">Fikcyjne</dt>
              <dd>X1–X10</dd>
              <dt className="text-sidebar-foreground/70">Stan</dt>
              <dd>{wfs ? formatDate(wfs.retrievedAt) : '—'}</dd>
            </dl>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <main
            id="tresc"
            ref={mainRef}
            tabIndex={-1}
            className="flex w-full max-w-[1600px] flex-1 flex-col gap-5 p-4 md:p-5"
          >
            <Outlet />
          </main>

          <footer className="border-t bg-card px-4 py-3 text-xs text-muted-foreground md:px-5">
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
