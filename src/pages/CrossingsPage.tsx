import { useDeferredValue, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { FictionalDataBanner } from '@/components/common/FictionalDataBanner'
import { FilterSelect } from '@/components/common/FilterSelect'
import { PageHeader } from '@/components/common/PageHeader'
import { SourceFootnote } from '@/components/common/SourceFootnote'
import { PriorityShape } from '@/components/common/badges'
import { CrossingMap } from '@/components/crossings/CrossingMap'
import { CATEGORY_COLOR, PRIORITY_COLOR, type ColorMode } from '@/components/crossings/mapColors'
import { CrossingsTable } from '@/components/crossings/CrossingsTable'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { caseRows } from '@/data'
import type { Row } from '@/domain/assess'
import { useRealData } from '@/hooks/useRealData'
import { formatInt } from '@/lib/format'

type Filters = {
  q: string
  origin: 'all' | 'real' | 'fictional'
  category: 'all' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'none'
  inspection: 'all' | 'P1' | 'P2' | 'P3' | 'none'
  verification: 'all' | 'V1' | 'V2' | 'V3'
  gpr: 'all' | 'matched' | 'unmatched'
}

const DEFAULTS: Filters = {
  q: '',
  origin: 'all',
  category: 'all',
  inspection: 'all',
  verification: 'all',
  gpr: 'all',
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '')
}

function applyFilters(rows: Row[], f: Filters): Row[] {
  const q = normalize(f.q)
  return rows.filter((r) => {
    if (f.origin !== 'all' && r.origin !== f.origin) return false
    if (f.category !== 'all' && (r.category ?? 'none') !== f.category) return false
    if (f.inspection !== 'all' && (r.assessment.inspection.level ?? 'none') !== f.inspection) return false
    if (f.verification !== 'all' && r.assessment.verification.level !== f.verification) return false
    if (f.gpr === 'matched' && r.gpr === null) return false
    if (f.gpr === 'unmatched' && (r.gpr !== null || r.origin !== 'real')) return false
    if (q && !normalize(`${r.name} ${r.id} ${r.unit ?? ''}`).includes(q)) return false
    return true
  })
}

export default function CrossingsPage() {
  const real = useRealData()
  const [params, setParams] = useSearchParams()
  const filters: Filters = {
    q: params.get('q') ?? DEFAULTS.q,
    origin: (params.get('pochodzenie') as Filters['origin']) ?? DEFAULTS.origin,
    category: (params.get('kategoria') as Filters['category']) ?? DEFAULTS.category,
    inspection: (params.get('kontrola') as Filters['inspection']) ?? DEFAULTS.inspection,
    verification: (params.get('weryfikacja') as Filters['verification']) ?? DEFAULTS.verification,
    gpr: (params.get('gpr') as Filters['gpr']) ?? DEFAULTS.gpr,
  }
  const [colorMode, setColorMode] = useState<ColorMode>('priority')
  const [query, setQuery] = useState(filters.q)
  const deferredQuery = useDeferredValue(query)

  const keys: Record<Exclude<keyof Filters, 'q'>, string> = {
    origin: 'pochodzenie',
    category: 'kategoria',
    inspection: 'kontrola',
    verification: 'weryfikacja',
    gpr: 'gpr',
  }
  const setFilter = <K extends Exclude<keyof Filters, 'q'>>(key: K, value: Filters[K]) => {
    setParams(
      (p) => {
        if (value === DEFAULTS[key]) p.delete(keys[key])
        else p.set(keys[key], value)
        return p
      },
      { replace: true },
    )
  }

  const allRows = useMemo(() => [...caseRows, ...(real.data?.rows ?? [])], [real.data])
  const { origin, category, inspection, verification, gpr } = filters
  const filtered = useMemo(
    () => applyFilters(allRows, { q: deferredQuery, origin, category, inspection, verification, gpr }),
    [allRows, deferredQuery, origin, category, inspection, verification, gpr],
  )

  return (
    <>
      <PageHeader
        title="Przejazdy"
        description="Lista łączy realne przejazdy PKP PLK z przypadkami fikcyjnymi X1–X10. Priorytet kontroli, priorytet weryfikacji danych i ruch drogowy to trzy osobne kolumny — nie są sumowane."
      />

      <FictionalDataBanner>
        Wiersze X1–X10 (tło szare, romb na mapie) to przykłady działania z umownym położeniem. Dla realnych
        przejazdów zbiór nie zawiera danych o kontrolach i zdarzeniach, dlatego ich priorytet kontroli to
        „brak oceny”.
      </FictionalDataBanner>

      {real.status === 'error' ? (
        <Alert variant="destructive">
          <AlertTitle>Nie udało się wczytać danych o przejazdach</AlertTitle>
          <AlertDescription>{real.error.message}. Widoczne są tylko przypadki fikcyjne.</AlertDescription>
        </Alert>
      ) : null}

      <form
        role="search"
        aria-label="Filtry przejazdów"
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor="q" className="text-xs text-muted-foreground">
            Numer, identyfikator lub jednostka
          </Label>
          <Input
            id="q"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setParams(
                (p) => {
                  if (e.target.value) p.set('q', e.target.value)
                  else p.delete('q')
                  return p
                },
                { replace: true },
              )
            }}
            placeholder="np. 082 006 629 lub X1"
            className="h-8 w-56 bg-card"
          />
        </div>
        <FilterSelect
          label="Pochodzenie"
          value={filters.origin}
          onChange={(v) => setFilter('origin', v)}
          options={[
            { value: 'all', label: 'Wszystkie' },
            { value: 'real', label: 'Realne' },
            { value: 'fictional', label: 'Fikcyjne (X1–X10)' },
          ]}
        />
        <FilterSelect
          label="Kategoria"
          value={filters.category}
          onChange={(v) => setFilter('category', v)}
          options={[
            { value: 'all', label: 'Wszystkie' },
            ...(['A', 'B', 'C', 'D', 'E', 'F'] as const).map((c) => ({ value: c, label: `Kategoria ${c}` })),
            { value: 'none', label: 'Brak kategorii' },
          ]}
        />
        <FilterSelect
          label="Priorytet kontroli"
          value={filters.inspection}
          onChange={(v) => setFilter('inspection', v)}
          options={[
            { value: 'all', label: 'Wszystkie' },
            { value: 'P1', label: 'P1' },
            { value: 'P2', label: 'P2' },
            { value: 'P3', label: 'P3' },
            { value: 'none', label: 'Brak oceny' },
          ]}
        />
        <FilterSelect
          label="Weryfikacja danych"
          value={filters.verification}
          onChange={(v) => setFilter('verification', v)}
          options={[
            { value: 'all', label: 'Wszystkie' },
            { value: 'V1', label: 'V1' },
            { value: 'V2', label: 'V2' },
            { value: 'V3', label: 'V3' },
          ]}
        />
        <FilterSelect
          label="Dane GPR"
          value={filters.gpr}
          onChange={(v) => setFilter('gpr', v)}
          options={[
            { value: 'all', label: 'Wszystkie' },
            { value: 'matched', label: 'Z dopasowaniem GPR' },
            { value: 'unmatched', label: 'Bez danych GPR' },
          ]}
        />
        <FilterSelect
          label="Kolor punktów na mapie"
          value={colorMode}
          onChange={setColorMode}
          options={[
            { value: 'priority', label: 'Priorytet kontroli' },
            { value: 'category', label: 'Kategoria' },
          ]}
        />
      </form>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {real.status === 'loading'
          ? 'Wczytywanie realnych przejazdów…'
          : `Wyświetlono ${formatInt(filtered.length)} z ${formatInt(allRows.length)} pozycji.`}{' '}
        <SourceFootnote sourceId="gugik-wfs-przejazdy" /> · <SourceFootnote sourceId="gddkia-gpr-2025" />
      </p>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <CrossingsTable rows={filtered} />
        <div className="flex flex-col gap-2 xl:sticky xl:top-4 xl:self-start">
          <CrossingMap
            rows={filtered}
            colorMode={colorMode}
            className="h-[420px] xl:h-[calc(100svh-12rem)]"
          />
          <MapLegend colorMode={colorMode} />
        </div>
      </div>
    </>
  )
}

function MapLegend({ colorMode }: { colorMode: ColorMode }) {
  return (
    <div className="flex flex-col gap-1.5 text-xs" aria-label="Legenda mapy">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <svg width="10" height="10" aria-hidden>
            <circle cx="5" cy="5" r="4" fill="#B9BAB4" stroke="#1F2328" />
          </svg>
          Koło — przejazd realny
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="12" height="12" aria-hidden>
            <path d="M6 1 11 6 6 11 1 6Z" fill="#fff" stroke="#1F2328" strokeDasharray="2 1.5" />
          </svg>
          Romb z kreskowaną ramką — DANE FIKCYJNE (położenie umowne)
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {colorMode === 'priority'
          ? (['P1', 'P2', 'P3'] as const).map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5">
                <span style={{ color: PRIORITY_COLOR[p] }}>
                  <PriorityShape level={p} />
                </span>
                {p}
              </span>
            ))
          : (['A', 'B', 'C', 'D', 'E', 'F'] as const).map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5">
                <svg width="10" height="10" aria-hidden>
                  <circle cx="5" cy="5" r="4" fill={CATEGORY_COLOR[c]} stroke="#1F2328" />
                </svg>
                Kat. {c}
              </span>
            ))}
        {colorMode === 'priority' ? (
          <span className="inline-flex items-center gap-1.5">
            <svg width="10" height="10" aria-hidden>
              <circle cx="5" cy="5" r="4" fill={PRIORITY_COLOR.none} stroke="#1F2328" />
            </svg>
            Brak oceny (realne przejazdy)
          </span>
        ) : null}
      </div>
      <p className="text-muted-foreground">
        Kolor fikcyjnych rombów zawsze oznacza priorytet kontroli. Mapa pokazuje te same pozycje co tabela.
      </p>
    </div>
  )
}
