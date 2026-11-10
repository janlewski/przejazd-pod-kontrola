import { useId, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { FictionalDataBanner } from '@/components/common/FictionalDataBanner'
import { FilterSelect } from '@/components/common/FilterSelect'
import { PageHeader } from '@/components/common/PageHeader'
import { ResponsiblePartyBadge } from '@/components/common/badges'
import { ResponsibilityNote } from '@/components/countermeasures/CountermeasureTable'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { caseById } from '@/data'
import { countermeasures } from '@/data/rules/countermeasures'
import type { ResponsibleParty, Task, TaskStatus } from '@/domain/types'
import { formatDateTime } from '@/lib/format'
import { RESPONSIBLE_LABEL, TASK_STATUS_LABEL } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { TASK_STATUSES, useTasks } from '@/store/tasks'

const cmName = new Map(countermeasures.map((c) => [c.id, c.namePl]))

function StatusSteps({ status }: { status: TaskStatus }) {
  const index = TASK_STATUSES.indexOf(status)
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="flex gap-0.5">
        {TASK_STATUSES.map((s, i) => (
          <span
            key={s}
            className={cn(
              'h-2 w-3 border border-foreground',
              i <= index ? 'bg-foreground' : 'bg-transparent',
            )}
          />
        ))}
      </span>
      <span className="text-sm">{TASK_STATUS_LABEL[status]}</span>
    </span>
  )
}

export default function TrackingPage() {
  const tasks = useTasks((s) => s.tasks)
  const recovered = useTasks((s) => s.recoveredFromInvalidStorage)
  const resetToDemo = useTasks((s) => s.resetToDemo)
  const [editing, setEditing] = useState<Task | null>(null)

  return (
    <>
      <PageHeader
        station="04"
        title="Wdrożenia"
        description="Zadania wdrożenia środków: przejazd, środek, status, podmiot odpowiedzialny i notatka. Zapis w pamięci przeglądarki (localStorage) — bez serwera."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Przywróć dane demonstracyjne
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Przywrócić dane demonstracyjne?</DialogTitle>
                <DialogDescription>
                  Wszystkie zmiany statusów, notatki i dodane zadania zostaną zastąpione przykładowymi
                  zadaniami.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Anuluj</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    onClick={() => {
                      resetToDemo()
                      toast.success('Przywrócono dane demonstracyjne')
                    }}
                  >
                    Przywróć
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <FictionalDataBanner>
        Zadania dotyczą przypadków X1–X10 i mają charakter przykładowy.
      </FictionalDataBanner>

      {recovered ? (
        <Alert>
          <AlertTitle>Zapisane dane były nieczytelne</AlertTitle>
          <AlertDescription>
            Zawartość pamięci przeglądarki nie przeszła walidacji, dlatego przywrócono dane demonstracyjne.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-sm border bg-card">
        <Table aria-label="Zadania wdrożenia">
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Przejazd</TableHead>
              <TableHead className="text-xs">Środek</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Odpowiedzialny</TableHead>
              <TableHead className="text-xs">Notatka</TableHead>
              <TableHead className="text-xs">Zmiana</TableHead>
              <TableHead className="text-xs">
                <span className="sr-only">Edycja</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                  Brak zadań. Dodaj środek z karty przejazdu, zakładka „Środki”, np.{' '}
                  <Link to="/przejazdy/X2">Przejazd X2</Link>.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="align-top">
                    <Link to={`/przejazdy/${encodeURIComponent(t.subjectId)}`} className="font-mono">
                      {caseById(t.subjectId)?.name ?? t.subjectId}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-64 align-top whitespace-normal">
                    {cmName.get(t.countermeasureId) ?? t.countermeasureId}
                  </TableCell>
                  <TableCell className="align-top">
                    <StatusSteps status={t.status} />
                  </TableCell>
                  <TableCell className="align-top">
                    <ResponsiblePartyBadge party={t.responsible} />
                  </TableCell>
                  <TableCell className="max-w-72 align-top text-sm whitespace-normal">
                    {t.note || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground tabular-nums">
                    {formatDateTime(t.updatedAt)}
                  </TableCell>
                  <TableCell className="align-top">
                    <Button size="xs" variant="outline" onClick={() => setEditing(t)}>
                      Edytuj<span className="sr-only"> zadanie {t.id}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <ResponsibilityNote />

      <TaskSheet task={editing} onClose={() => setEditing(null)} />
    </>
  )
}

function TaskSheet({ task, onClose }: { task: Task | null; onClose: () => void }) {
  return (
    <Sheet open={task !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        {task ? <TaskForm key={task.id} task={task} onClose={onClose} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function TaskForm({ task, onClose }: { task: Task; onClose: () => void }) {
  const updateTask = useTasks((s) => s.updateTask)
  const removeTask = useTasks((s) => s.removeTask)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [responsible, setResponsible] = useState<ResponsibleParty>(task.responsible)
  const [note, setNote] = useState(task.note)
  const noteId = useId()

  return (
    <form
      className="flex h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        updateTask(task.id, { status, responsible, note: note.trim() })
        toast.success('Zapisano zadanie', { description: `${task.subjectId} · ${TASK_STATUS_LABEL[status]}` })
        onClose()
      }}
    >
      <SheetHeader>
        <SheetTitle>{cmName.get(task.countermeasureId) ?? task.countermeasureId}</SheetTitle>
        <SheetDescription>
          {caseById(task.subjectId)?.name ?? task.subjectId} · DANE FIKCYJNE
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-4 px-4">
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABEL[s] }))}
        />
        <FilterSelect
          label="Podmiot odpowiedzialny"
          value={responsible}
          onChange={setResponsible}
          options={(Object.keys(RESPONSIBLE_LABEL) as ResponsibleParty[]).map((p) => ({
            value: p,
            label: RESPONSIBLE_LABEL[p],
          }))}
        />
        <div className="flex flex-col gap-1">
          <Label htmlFor={noteId} className="text-xs text-muted-foreground">
            Notatka
          </Label>
          <Textarea
            id={noteId}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            maxLength={1000}
          />
        </div>
      </div>
      <SheetFooter className="mt-auto flex-row justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            removeTask(task.id)
            toast('Usunięto zadanie')
            onClose()
          }}
        >
          Usuń zadanie
        </Button>
        <Button type="submit">Zapisz</Button>
      </SheetFooter>
    </form>
  )
}
