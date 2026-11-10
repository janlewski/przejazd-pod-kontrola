import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { useEffect, useState } from 'react'
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

const PAGE_SIZE = 50
const V_RANK = { V1: 1, V2: 2, V3: 3 } as const

function roadAadt(row: Row): number | null {
  return row.origin === 'real' ? (row.gpr?.aadt ?? null) : row.assessment.exposure.roadAadt
}

const columns: ColumnDef<Row>[] = [
  {
    id: 'name',
    header: 'Przejazd',
    accessorFn: (r) => r.name,
    sortingFn: (a, b) => a.original.name.localeCompare(b.original.name, 'pl', { numeric: true }),
    cell: ({ row: { original: r } }) => (
      <div className="flex flex-col items-start gap-1">
        <Link to={`/przejazdy/${encodeURIComponent(r.id)}`} className="font-mono font-medium">
          {r.name}
        </Link>
        {r.origin === 'real' && parseCrossingNumber(r.name) ? (
          <KmPlate name={r.name} />
        ) : (
          <span className="text-xs text-muted-foreground">
            {r.origin === 'fictional' ? 'położenie umowne' : r.id}
          </span>
        )}
      </div>
    ),
  },
  {
    id: 'origin',
    header: 'Pochodzenie',
    accessorFn: (r) => r.origin,
    cell: ({ row: { original: r } }) => <OriginBadge origin={r.origin} />,
  },
  {
    id: 'category',
    header: 'Kat.',
    accessorFn: (r) => r.category ?? 'Z',
    cell: ({ row: { original: r } }) => <CategoryBadge category={r.category} />,
  },
  {
    id: 'inspection',
    header: 'Priorytet kontroli',
    accessorFn: (r) => inspectionSortKey(r.assessment.inspection.level),
    cell: ({ row: { original: r } }) => <PriorityBadge level={r.assessment.inspection.level} />,
  },
  {
    id: 'verification',
    header: 'Weryfikacja danych',
    accessorFn: (r) =>
      V_RANK[r.assessment.verification.level] * 100 - r.assessment.verification.missing.length,
    cell: ({ row: { original: r } }) => (
      <span className="inline-flex items-center gap-1.5">
        <VerificationBadge level={r.assessment.verification.level} />
        <span className="text-xs text-muted-foreground tabular-nums">
          braki: {r.assessment.verification.missing.length}
        </span>
      </span>
    ),
  },
  {
    id: 'aadt',
    header: 'Ruch drogowy (SDRR)',
    accessorFn: (r) => roadAadt(r),
    sortUndefined: 'last',
    sortingFn: (a, b) => (roadAadt(a.original) ?? -1) - (roadAadt(b.original) ?? -1),
    cell: ({ row: { original: r } }) => {
      const value = roadAadt(r)
      if (r.origin === 'real') {
        if (!r.gpr) return <span className="text-xs text-muted-foreground">brak danych GPR</span>
        return (
          <span className="flex flex-col">
            <span className="font-mono tabular-nums">{value === null ? 'brak SDRR' : formatInt(value)}</span>
            <span
              className={cn(
                'text-xs',
                r.gpr.confidence === 'high' ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              DK {r.gpr.roadNumber} · {GPR_CONFIDENCE_LABEL[r.gpr.confidence].toLowerCase()} ·{' '}
              {formatMeters(r.gpr.distanceM)}
            </span>
          </span>
        )
      }
      return value === null ? (
        <span className="text-xs text-muted-foreground">brak danych</span>
      ) : (
        <span className="font-mono tabular-nums">{formatInt(value)}</span>
      )
    },
  },
  {
    id: 'unit',
    header: 'Jednostka PLK',
    accessorFn: (r) => r.unit ?? '',
    cell: ({ row: { original: r } }) => (
      <span className="text-xs">{r.unit ? r.unit.replace('PKP PLK ', '') : '—'}</span>
    ),
  },
]

export function CrossingsTable({ rows }: { rows: Row[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'inspection', desc: false }])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: PAGE_SIZE })

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
    <div className="flex min-w-0 flex-col gap-2">
      <div className="rounded-sm border bg-card">
        <Table aria-label="Przejazdy i przypadki — tabela (alternatywa dla mapy)">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                      className="h-8 text-xs"
                    >
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 font-medium hover:underline"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span aria-hidden className="font-mono text-muted-foreground">
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
                <TableRow key={row.id} className={cn(row.original.origin === 'fictional' && 'bg-muted/60')}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-1.5 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
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
