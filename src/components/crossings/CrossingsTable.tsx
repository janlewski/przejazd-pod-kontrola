import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { MapPin } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CategoryBadge, OriginBadge, PriorityBadge, VerificationBadge } from '@/components/common/badges'
import { KmPlate } from '@/components/common/KmPlate'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Row } from '@/domain/assess'
import { inspectionSortKey } from '@/domain/priority'
import { formatInt, formatMeters, parseCrossingNumber } from '@/lib/format'
import { GPR_CONFIDENCE_LABEL } from '@/lib/labels'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20
const V_RANK = { V1: 1, V2: 2, V3: 3 } as const

function roadAadt(row: Row): number | null {
  return row.origin === 'real' ? (row.gpr?.aadt ?? null) : row.assessment.exposure.roadAadt
}

function buildColumns(onSelect: (id: string) => void): ColumnDef<Row>[] {
  return [
    {
      id: 'name',
      header: 'Przejazd',
      accessorFn: (r) => r.name,
      sortingFn: (a, b) => a.original.name.localeCompare(b.original.name, 'pl', { numeric: true }),
      cell: ({ row: { original: r } }) => (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link to={`/przejazdy/${encodeURIComponent(r.id)}`} className="font-mono font-medium">
            {r.origin === 'fictional' ? (
              <>
                <span className="sr-only">Przejazd </span>
                {r.id}
              </>
            ) : (
              r.name
            )}
          </Link>
          {r.origin === 'fictional' ? (
            <OriginBadge origin="fictional" />
          ) : parseCrossingNumber(r.name) ? (
            <KmPlate name={r.name} />
          ) : null}
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Kat.',
      accessorFn: (r) => r.category ?? 'Z',
      cell: ({ row: { original: r } }) => <CategoryBadge category={r.category} />,
    },
    {
      id: 'inspection',
      header: 'Kontrola',
      accessorFn: (r) => inspectionSortKey(r.assessment.inspection.level),
      cell: ({ row: { original: r } }) => <PriorityBadge level={r.assessment.inspection.level} />,
    },
    {
      id: 'verification',
      header: 'Dane',
      accessorFn: (r) =>
        V_RANK[r.assessment.verification.level] * 100 - r.assessment.verification.missing.length,
      cell: ({ row: { original: r } }) => (
        <span title={`Braki: ${r.assessment.verification.missing.join(', ') || 'brak'}`}>
          <VerificationBadge level={r.assessment.verification.level} />
          <span className="sr-only">, braki: {r.assessment.verification.missing.length}</span>
        </span>
      ),
    },
    {
      id: 'aadt',
      header: 'SDRR',
      accessorFn: (r) => roadAadt(r),
      sortUndefined: 'last',
      sortingFn: (a, b) => (roadAadt(a.original) ?? -1) - (roadAadt(b.original) ?? -1),
      cell: ({ row: { original: r } }) => {
        const value = roadAadt(r)
        if (r.origin === 'real' && !r.gpr)
          return <span className="text-xs text-muted-foreground">brak GPR</span>
        if (value === null) return <span className="text-xs text-muted-foreground">brak danych</span>
        return (
          <span className="flex flex-col">
            <span className="font-mono tabular-nums">{formatInt(value)}</span>
            {r.gpr ? (
              <span
                className={cn(
                  'text-xs',
                  r.gpr.confidence === 'high' ? 'text-muted-foreground' : 'text-foreground',
                )}
                title={`${GPR_CONFIDENCE_LABEL[r.gpr.confidence]}, ${formatMeters(r.gpr.distanceM)} od osi odcinka`}
              >
                DK {r.gpr.roadNumber}
                {r.gpr.confidence === 'high'
                  ? ''
                  : ` · ${GPR_CONFIDENCE_LABEL[r.gpr.confidence].toLowerCase()}`}
              </span>
            ) : null}
          </span>
        )
      },
    },
    {
      id: 'map',
      header: () => <span className="sr-only">Mapa</span>,
      enableSorting: false,
      cell: ({ row: { original: r } }) => (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onSelect(r.id)}
          aria-label={`Pokaż ${r.name} na mapie`}
          title="Pokaż na mapie"
        >
          <MapPin aria-hidden />
        </Button>
      ),
    },
  ]
}

export function CrossingsTable({
  rows,
  selectedId = null,
  onSelect,
  className,
}: {
  rows: Row[]
  selectedId?: string | null
  onSelect: (id: string) => void
  className?: string
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'inspection', desc: false }])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE })
  const columns = useMemo(() => buildColumns(onSelect), [onSelect])

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [rows])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (r) => r.id,
    autoResetPageIndex: false,
  })

  const page = table.getState().pagination
  const from = rows.length === 0 ? 0 : page.pageIndex * page.pageSize + 1
  const to = Math.min(rows.length, (page.pageIndex + 1) * page.pageSize)

  return (
    <div className={cn('flex min-h-0 min-w-0 flex-col rounded-sm border bg-card', className)}>
      {/* The panel scrolls; the table container must not, so the sticky header attaches here. */}
      <div className="min-h-0 flex-1 overflow-auto [&_[data-slot=table-container]]:overflow-visible">
        <Table aria-label="Przejazdy i przypadki — tabela (alternatywa dla mapy)">
          <TableHeader className="sticky top-0 z-10 bg-card">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  if (!header.column.getCanSort()) {
                    return (
                      <TableHead key={header.id} className="w-8 px-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  }
                  return (
                    <TableHead
                      key={header.id}
                      className="px-1.5"
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                    >
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span aria-hidden className="text-muted-foreground">
                          {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
                        </span>
                      </button>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  Żaden przejazd nie spełnia filtrów.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  aria-current={row.id === selectedId ? 'true' : undefined}
                  data-state={row.id === selectedId ? 'selected' : undefined}
                  className={cn(
                    row.original.origin === 'fictional' && 'bg-muted/60',
                    row.id === selectedId && 'outline-2 -outline-offset-2 outline-foreground',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-1.5 py-1.5 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-2 py-1.5 text-xs">
        <span className="tabular-nums" aria-live="polite">
          {formatInt(from)}–{formatInt(to)} z {formatInt(rows.length)}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="xs"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Pierwsza
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Poprzednia
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Następna
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          >
            Ostatnia
          </Button>
        </div>
      </div>
    </div>
  )
}
