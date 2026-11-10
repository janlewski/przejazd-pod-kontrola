import { Link } from 'react-router'
import { toast } from 'sonner'
import { EvidenceBadge, ResponsiblePartyBadge } from '@/components/common/badges'
import { SourceLink } from '@/components/common/SourceFootnote'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { causes } from '@/data/rules/causes'
import type { RankedCountermeasure } from '@/domain/diagnose'
import { COST_LABEL, TASK_STATUS_LABEL } from '@/lib/labels'
import { useTasks } from '@/store/tasks'

const causeName = new Map(causes.map((c) => [c.id, c.namePl]))

export function ResponsibilityNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Podział kompetencji uproszczony — do potwierdzenia z zarządcami. Urządzenia kolejowe i kategoria
      przejazdu: zarządca kolei; jezdnia, separatory i znaki: zarządca drogi.
    </p>
  )
}

export function RankedCountermeasureTable({
  subjectId,
  ranked,
}: {
  subjectId: string
  ranked: RankedCountermeasure[]
}) {
  const tasks = useTasks((s) => s.tasks)
  const addTask = useTasks((s) => s.addTask)

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-sm border bg-card">
        <Table aria-label="Środki zaradcze uszeregowane według siły dowodu">
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-xs">#</TableHead>
              <TableHead className="text-xs">Środek</TableHead>
              <TableHead className="text-xs">Dowód</TableHead>
              <TableHead className="text-xs">Efekt według źródła</TableHead>
              <TableHead className="text-xs">Odpowiada na</TableHead>
              <TableHead className="text-xs">Odpowiedzialny</TableHead>
              <TableHead className="text-xs">Koszt (klasa)</TableHead>
              <TableHead className="text-xs">Wdrożenie</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((r, i) => {
              const cm = r.countermeasure
              const task = tasks.find((t) => t.subjectId === subjectId && t.countermeasureId === cm.id)
              return (
                <TableRow key={cm.id}>
                  <TableCell className="align-top font-mono text-xs tabular-nums">{i + 1}</TableCell>
                  <TableCell className="max-w-64 align-top whitespace-normal">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{cm.namePl}</span>
                      <code className="font-mono text-[11px] text-muted-foreground">{cm.id}</code>
                      {r.categoryFit === 'not_listed' ? (
                        <span className="text-xs">
                          Nietypowy dla tej kategorii ({cm.applicableCategories.join(', ')})
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <EvidenceBadge evidence={cm.evidence} />
                  </TableCell>
                  <TableCell className="max-w-80 align-top text-xs whitespace-normal">
                    <p>{cm.effectNote}</p>
                    <p className="text-muted-foreground">{cm.evidenceContext}</p>
                    <p className="mt-1 flex flex-wrap gap-x-2">
                      {cm.sourceUrls.map((u) => (
                        <SourceLink key={u} url={u} />
                      ))}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-48 align-top text-xs whitespace-normal">
                    {r.addresses.map((id) => causeName.get(id) ?? id).join('; ')}
                  </TableCell>
                  <TableCell className="align-top">
                    <ResponsiblePartyBadge party={cm.responsible} />
                  </TableCell>
                  <TableCell className="align-top text-xs">{COST_LABEL[cm.costClass]}</TableCell>
                  <TableCell className="align-top">
                    {task ? (
                      <Link to="/wdrozenia" className="text-xs">
                        {TASK_STATUS_LABEL[task.status]}
                      </Link>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          addTask({ subjectId, countermeasureId: cm.id, responsible: cm.responsible })
                          toast.success(`Dodano zadanie: ${cm.namePl}`, {
                            description: `${subjectId} · status: zaplanowane`,
                          })
                        }}
                      >
                        Dodaj do wdrożeń
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <ResponsibilityNote />
      <p className="text-xs text-muted-foreground">
        Kolejność: siła dowodu, zgodność z kategorią przejazdu, liczba rozpoznanych przyczyn, klasa kosztu.
        Bez sumowania w jedną liczbę. Klasa kosztu jest orientacyjna — bez wyceny.
      </p>
    </div>
  )
}
