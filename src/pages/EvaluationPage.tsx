import { useState } from 'react'
import { Link } from 'react-router'
import { FictionalDataBanner } from '@/components/common/FictionalDataBanner'
import { Metric } from '@/components/common/Metric'
import { PageHeader } from '@/components/common/PageHeader'
import { ReasonList } from '@/components/common/ReasonList'
import { EvidenceBadge } from '@/components/common/badges'
import { BeforeAfterChart } from '@/components/evaluation/BeforeAfterChart'
import { CaveatsPanel } from '@/components/evaluation/CaveatsPanel'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fictionalCases } from '@/data'
import { countermeasures } from '@/data/rules/countermeasures'
import { evaluateBeforeAfter } from '@/domain/evaluate'
import type { FictionalCase } from '@/domain/types'
import { formatDate, formatDecimal, formatInt, formatMonth, formatPercent } from '@/lib/format'
import { TASK_STATUS_LABEL } from '@/lib/labels'
import { useTasks } from '@/store/tasks'

const evaluated = fictionalCases.filter(
  (c): c is FictionalCase & { evaluation: NonNullable<FictionalCase['evaluation']> } => c.evaluation !== null,
)

export default function EvaluationPage() {
  const [selected, setSelected] = useState(evaluated[0]?.id ?? '')
  return (
    <>
      <PageHeader
        station="05"
        title="Ocena przed/po"
        description="Porównanie liczby naruszeń przed i po wdrożeniu środka. Wynik nie dowodzi skuteczności — to sygnał do dalszej obserwacji."
      />
      <FictionalDataBanner>Liczby naruszeń w tym widoku to dane fikcyjne.</FictionalDataBanner>

      {evaluated.length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak wdrożonych środków z danymi do oceny.</p>
      ) : (
        <Tabs value={selected} onValueChange={setSelected} className="gap-3">
          <TabsList variant="line" className="w-full justify-start border-b">
            {evaluated.map((c) => (
              <TabsTrigger
                key={c.id}
                value={c.id}
                className="flex-none text-muted-foreground data-[state=active]:text-foreground"
              >
                {c.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {evaluated.map((c) => (
            <TabsContent key={c.id} value={c.id}>
              <CaseEvaluation record={c} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </>
  )
}

function CaseEvaluation({
  record,
}: {
  record: FictionalCase & { evaluation: NonNullable<FictionalCase['evaluation']> }
}) {
  const e = evaluateBeforeAfter(record.violations, record.evaluation.implementedAt)
  const cm = countermeasures.find((m) => m.id === record.evaluation.countermeasureId)
  const task = useTasks((s) =>
    s.tasks.find(
      (t) => t.subjectId === record.id && t.countermeasureId === record.evaluation.countermeasureId,
    ),
  )

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link to={`/przejazdy/${record.id}`} className="font-medium">
            {record.name}
          </Link>
          <span aria-hidden>·</span>
          <span>{cm?.namePl ?? record.evaluation.countermeasureId}</span>
          {cm ? <EvidenceBadge evidence={cm.evidence} /> : null}
          <span aria-hidden>·</span>
          <span>wdrożono {formatDate(record.evaluation.implementedAt)}</span>
          {task ? (
            <span className="text-muted-foreground">(status zadania: {TASK_STATUS_LABEL[task.status]})</span>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Metric
            label="Średnio przed / mies."
            value={e.before.meanPerPeriod === null ? 'brak' : formatDecimal(e.before.meanPerPeriod)}
            note={`${e.before.periods.length} mies., łącznie ${formatInt(e.before.total)}`}
          />
          <Metric
            label="Średnio po / mies."
            value={e.after.meanPerPeriod === null ? 'brak' : formatDecimal(e.after.meanPerPeriod)}
            note={`${e.after.periods.length} mies., łącznie ${formatInt(e.after.total)}`}
          />
          <Metric
            label="Zmiana średniej"
            value={e.relativeChange === null ? 'nie do obliczenia' : formatPercent(e.relativeChange)}
            note={
              e.absoluteChange === null
                ? 'brak danych w jednym z okien'
                : `${formatDecimal(e.absoluteChange)} naruszeń / mies. — nie dowodzi skuteczności`
            }
          />
        </div>

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <figure className="flex flex-col gap-2 rounded-sm border bg-card p-3">
            <BeforeAfterChart violations={record.violations} evaluation={e} />
            <figcaption className="text-xs text-muted-foreground">
              Szare słupki — przed, kreskowany — miesiąc wdrożenia (pominięty), granatowe — po. Linie
              przerywane — średnie w oknach.
            </figcaption>
          </figure>
          <div className="rounded-sm border bg-card">
            <Table aria-label="Dane wykresu: naruszenia w miesiącach">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Miesiąc</TableHead>
                  <TableHead className="text-xs">Okres</TableHead>
                  <TableHead className="text-right text-xs">Naruszenia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...record.violations]
                  .sort((a, b) => a.period.localeCompare(b.period))
                  .map((v) => (
                    <TableRow key={v.period}>
                      <TableCell className="text-xs">{formatMonth(v.period)}</TableCell>
                      <TableCell className="text-xs">
                        {v.period < e.implementedPeriod
                          ? 'przed'
                          : v.period > e.implementedPeriod
                            ? 'po'
                            : 'wdrożenie (pominięty)'}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatInt(v.count)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <ReasonList reasons={e.reasons} />
      </div>
      <CaveatsPanel caveats={e.caveats} />
    </div>
  )
}
