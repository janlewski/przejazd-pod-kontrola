import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { FictionalDataBanner } from '@/components/common/FictionalDataBanner'
import { FilterSelect } from '@/components/common/FilterSelect'
import { PageHeader } from '@/components/common/PageHeader'
import { SourceFootnote } from '@/components/common/SourceFootnote'
import {
  CategoryBadge,
  OriginBadge,
  PriorityBadge,
  PriorityShape,
  VerificationBadge,
} from '@/components/common/badges'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CrossingMap } from '@/components/crossings/CrossingMap'
import { CATEGORY_COLOR, PRIORITY_COLOR, type ColorMode } from '@/components/crossings/mapColors'
import { CrossingsTable } from '@/components/crossings/CrossingsTable'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Label } from '@/components/ui/label'
import { caseById, caseRows } from '@/data'
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
  const selectedId = params.get('wybrany')
  const selected = selectedId ? allRows.find((r) => r.id === selectedId) : undefined
  const clearSelection = () =>
    setParams(
      (p) => {
        p.delete('wybrany')
        return p
      },
      { replace: true },
    )
  const { origin, category, inspection, verification, gpr } = filters
  const filtered = useMemo(
    () => applyFilters(allRows, { q: deferredQuery, origin, category, inspection, verification, gpr }),
    [allRows, deferredQuery, origin, category, inspection, verification, gpr],
  )

  const select = useCallback(
    (id: string) =>
      setParams(
        (p) => {
          p.set('wybrany', id)
          return p
        },
        { replace: true },
      ),
    [setParams],
  )

  return (
    <>
      <PageHeader
        station="02"
        title="Przejazdy"
        description="Mapa i lista realnych przejazdów PKP PLK oraz przypadków fikcyjnych X1–X10. Priorytet kontroli, weryfikacja danych i ruch drogowy są osobnymi kolumnami — nie są sumowane."
      />

      {real.status === 'error' ? (
        <Alert variant="destructive">
          <AlertTitle>Nie udało się wczytać danych o przejazdach</AlertTitle>
          <AlertDescription>{real.error.message}. Widoczne są tylko przypadki fikcyjne.</AlertDescription>
        </Alert>
      ) : null}

      <form
        role="search"
        aria-label="Filtry przejazdów"
        className="flex flex-wrap items-end gap-x-3 gap-y-2"
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
            className="h-8 w-52 bg-card"
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
        <p className="ml-auto self-end pb-1.5 text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {real.status === 'loading'
            ? 'Wczytywanie realnych przejazdów…'
            : `${formatInt(filtered.length)} z ${formatInt(allRows.length)} pozycji`}
        </p>
      </form>

      <FictionalDataBanner>
        X1–X10 (romby na mapie, szare wiersze) mają umowne położenie. Realne przejazdy nie mają w zbiorze
        danych o kontrolach, stąd „brak oceny”.
      </FictionalDataBanner>

      <div className="grid gap-3 lg:h-[max(560px,calc(100svh-19.5rem))] lg:grid-cols-[minmax(0,13fr)_minmax(0,11fr)] 2xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section aria-label="Mapa" className="flex min-h-0 flex-col gap-2">
          <CrossingMap
            rows={filtered}
            colorMode={colorMode}
            selectedId={selectedId}
            className="h-[55svh] min-h-[360px] lg:h-auto lg:min-h-0 lg:flex-1"
          />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <MapLegend colorMode={colorMode} />
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              aria-label="Kolor punktów na mapie"
              value={colorMode}
              onValueChange={(v) => v && setColorMode(v as ColorMode)}
              className="bg-card"
            >
              <ToggleGroupItem
                value="priority"
                className="data-[state=on]:bg-foreground data-[state=on]:text-background"
              >
                Kolor: priorytet
              </ToggleGroupItem>
              <ToggleGroupItem
                value="category"
                className="data-[state=on]:bg-foreground data-[state=on]:text-background"
              >
                Kolor: kategoria
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </section>

        <div className="flex min-h-0 flex-col gap-2">
          {selected ? <SelectedRow row={selected} onClear={clearSelection} /> : null}
          <CrossingsTable
            rows={filtered}
            selectedId={selectedId}
            onSelect={select}
            className="h-[70svh] lg:h-auto lg:flex-1"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        <SourceFootnote sourceId="gugik-wfs-przejazdy" /> · <SourceFootnote sourceId="gddkia-gpr-2025" />
      </p>
    </>
  )
}

function SelectedRow({ row, onClear }: { row: Row; onClear: () => void }) {
  const record = row.origin === 'fictional' ? caseById(row.id) : undefined
  return (
    <Card
      role="region"
      aria-label={`Wybrany przejazd: ${row.name}`}
      className="gap-2 border-2 border-foreground px-3 py-2.5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{row.name}</span>
        <OriginBadge origin={row.origin} />
        <CategoryBadge category={row.category} />
        <PriorityBadge level={row.assessment.inspection.level} />
        <VerificationBadge level={row.assessment.verification.level} />
      </div>
      <p className="text-sm text-muted-foreground">
        {record?.summary ?? row.unit ?? 'Przejazd z danych WFS.'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" className="rounded-sm">
          <Link to={`/przejazdy/${encodeURIComponent(row.id)}`}>Otwórz kartę przejazdu</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Usuń zaznaczenie
        </Button>
      </div>
    </Card>
  )
}

function Dot({ fill }: { fill: string }) {
  return (
    <svg width="10" height="10" aria-hidden>
      <circle cx="5" cy="5" r="4" fill={fill} stroke="#1F2328" />
    </svg>
  )
}

function MapLegend({ colorMode }: { colorMode: ColorMode }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" aria-label="Legenda mapy">
      <li className="inline-flex items-center gap-1.5">
        <svg width="12" height="12" aria-hidden>
          <path d="M6 1 11 6 6 11 1 6Z" fill="#fff" stroke="#1F2328" strokeDasharray="2 1.5" />
        </svg>
        DANE FIKCYJNE
      </li>
      {colorMode === 'priority' ? (
        <>
          {(['P1', 'P2', 'P3'] as const).map((p) => (
            <li key={p} className="inline-flex items-center gap-1.5">
              <span style={{ color: PRIORITY_COLOR[p] }}>
                <PriorityShape level={p} />
              </span>
              {p}
            </li>
          ))}
          <li className="inline-flex items-center gap-1.5">
            <Dot fill={PRIORITY_COLOR.none} />
            realny, brak oceny
          </li>
        </>
      ) : (
        (['A', 'B', 'C', 'D', 'E', 'F'] as const).map((c) => (
          <li key={c} className="inline-flex items-center gap-1.5">
            <Dot fill={CATEGORY_COLOR[c]} />
            Kat. {c}
          </li>
        ))
      )}
    </ul>
  )
}
