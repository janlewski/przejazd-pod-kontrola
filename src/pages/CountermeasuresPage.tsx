import { useMemo, useState } from 'react'
import { EvidenceBadge, ResponsiblePartyBadge } from '@/components/common/badges'
import { FilterSelect } from '@/components/common/FilterSelect'
import { PageHeader } from '@/components/common/PageHeader'
import { SourceLink } from '@/components/common/SourceFootnote'
import { ResponsibilityNote } from '@/components/countermeasures/CountermeasureTable'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { causes } from '@/data/rules/causes'
import { countermeasures } from '@/data/rules/countermeasures'
import { EVIDENCE_ORDER } from '@/domain/diagnose'
import type { Countermeasure, EvidenceStrength } from '@/domain/types'
import { COST_LABEL, EVIDENCE_DESCRIPTION, EVIDENCE_LABEL, RESPONSIBLE_LABEL } from '@/lib/labels'

const causeName = new Map(causes.map((c) => [c.id, c.namePl]))

export default function CountermeasuresPage() {
  const [evidence, setEvidence] = useState<'all' | EvidenceStrength>('all')
  const [open, setOpen] = useState<Countermeasure | null>(null)

  const list = useMemo(
    () =>
      [...countermeasures]
        .filter((c) => evidence === 'all' || c.evidence === evidence)
        .sort((a, b) => EVIDENCE_ORDER[a.evidence] - EVIDENCE_ORDER[b.evidence] || a.id.localeCompare(b.id)),
    [evidence],
  )

  return (
    <>
      <PageHeader
        station="03"
        title="Środki zaradcze"
        description="Katalog środków z siłą dowodu, efektem według źródła, podmiotem odpowiedzialnym, orientacyjną klasą kosztu i odniesieniem do Dz.U. 2025 poz. 1105. Wartości z USA to dowód zagraniczny."
      />

      <div className="flex flex-wrap items-end gap-4">
        <FilterSelect
          label="Siła dowodu"
          value={evidence}
          onChange={setEvidence}
          options={[
            { value: 'all', label: 'Wszystkie' },
            ...(['strong', 'moderate', 'weak', 'none'] as const).map((e) => ({
              value: e,
              label: EVIDENCE_LABEL[e],
            })),
          ]}
        />
        <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
          {(['strong', 'moderate', 'weak', 'none'] as const).map((e) => (
            <div key={e} className="contents">
              <dt className="font-medium">{EVIDENCE_LABEL[e]}</dt>
              <dd className="text-muted-foreground">{EVIDENCE_DESCRIPTION[e]}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-sm border bg-card">
        <Table aria-label="Katalog środków zaradczych">
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Środek</TableHead>
              <TableHead className="text-xs">Dowód</TableHead>
              <TableHead className="text-xs">Efekt według źródła</TableHead>
              <TableHead className="text-xs">Odpowiada na</TableHead>
              <TableHead className="text-xs">Odpowiedzialny</TableHead>
              <TableHead className="text-xs">Koszt (klasa)</TableHead>
              <TableHead className="text-xs">Kategorie</TableHead>
              <TableHead className="text-xs">
                <span className="sr-only">Szczegóły</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((cm) => (
              <TableRow key={cm.id}>
                <TableCell className="max-w-64 align-top whitespace-normal">
                  <span className="block font-medium">{cm.namePl}</span>
                  <code className="font-mono text-[11px] text-muted-foreground">{cm.id}</code>
                </TableCell>
                <TableCell className="align-top">
                  <EvidenceBadge evidence={cm.evidence} />
                </TableCell>
                <TableCell className="max-w-80 align-top text-xs whitespace-normal">
                  {cm.effectNote}
                </TableCell>
                <TableCell className="max-w-48 align-top text-xs whitespace-normal">
                  {cm.addressesCauses.map((id) => causeName.get(id) ?? id).join('; ')}
                </TableCell>
                <TableCell className="align-top">
                  <ResponsiblePartyBadge party={cm.responsible} />
                </TableCell>
                <TableCell className="align-top text-xs">{COST_LABEL[cm.costClass]}</TableCell>
                <TableCell className="align-top font-mono text-xs">
                  {cm.applicableCategories.join(' ')}
                </TableCell>
                <TableCell className="align-top">
                  <Button size="xs" variant="outline" onClick={() => setOpen(cm)}>
                    Szczegóły<span className="sr-only">: {cm.namePl}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ResponsibilityNote />
      <p className="text-xs text-muted-foreground">
        Klasa kosztu jest orientacyjna, bez wyceny. Kwot nie podajemy bez kosztorysu.
      </p>

      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open ? (
            <>
              <SheetHeader>
                <SheetTitle>{open.namePl}</SheetTitle>
                <SheetDescription>
                  <code className="font-mono">{open.id}</code>
                </SheetDescription>
              </SheetHeader>
              <dl className="flex flex-col gap-3 px-4 pb-6 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Siła dowodu</dt>
                  <dd className="flex flex-col gap-1">
                    <EvidenceBadge evidence={open.evidence} />
                    <span>{open.evidenceContext}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Efekt według źródła</dt>
                  <dd>{open.effectNote}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Odpowiada na przyczyny</dt>
                  <dd>
                    <ul className="list-disc pl-5">
                      {open.addressesCauses.map((id) => (
                        <li key={id}>{causeName.get(id) ?? id}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Dz.U. 2025 poz. 1105</dt>
                  <dd>{open.legalNote}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Podmiot odpowiedzialny</dt>
                  <dd>{RESPONSIBLE_LABEL[open.responsible]}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Klasa kosztu (orientacyjna)</dt>
                  <dd>{COST_LABEL[open.costClass]}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Kategorie przejazdów</dt>
                  <dd className="font-mono">{open.applicableCategories.join(', ')}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Źródła</dt>
                  <dd>
                    <ul className="flex flex-col gap-1">
                      {open.sourceUrls.map((u) => (
                        <li key={u}>
                          <SourceLink url={u} />
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
