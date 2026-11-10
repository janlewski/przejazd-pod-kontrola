import type { ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { FictionalDataBanner } from '@/components/common/FictionalDataBanner'
import { KmPlate } from '@/components/common/KmPlate'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/common/PageHeader'
import { SourceFootnote, SourceLink } from '@/components/common/SourceFootnote'
import { CategoryBadge, OriginBadge, PriorityBadge, VerificationBadge } from '@/components/common/badges'
import { RankedCountermeasureTable } from '@/components/countermeasures/CountermeasureTable'
import { AssessmentPanels } from '@/components/diagnosis/AssessmentPanels'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { caseByCrossingId, caseById, caseRows, sourceById } from '@/data'
import { symptoms } from '@/data/rules/symptoms'
import type { Row } from '@/domain/assess'
import { diagnose } from '@/domain/diagnose'
import type { FictionalCase } from '@/domain/types'
import { useRealData } from '@/hooks/useRealData'
import {
  formatCoord,
  formatDate,
  formatInt,
  formatMeters,
  formatMonth,
  parseCrossingNumber,
} from '@/lib/format'
import { CATEGORY_LABEL, GPR_CONFIDENCE_LABEL } from '@/lib/labels'

const symptomName = new Map(symptoms.map((s) => [s.id, s.namePl]))

export default function CrossingDetailPage() {
  const { id = '' } = useParams()
  const fictional = caseById(id)
  const real = useRealData()

  if (fictional) {
    const row = caseRows.find((r) => r.id === id)!
    return <Detail row={row} record={fictional} />
  }
  const linkedCase = caseByCrossingId(id)
  if (linkedCase) return <Navigate to={`/przejazdy/${linkedCase.id}`} replace />
  if (real.status === 'loading')
    return <p className="text-sm text-muted-foreground">Wczytywanie danych przejazdu…</p>
  if (real.status === 'error')
    return (
      <Alert variant="destructive">
        <AlertTitle>Nie udało się wczytać danych</AlertTitle>
        <AlertDescription>{real.error.message}</AlertDescription>
      </Alert>
    )
  const row = real.data.rows.find((r) => r.id === id)
  if (!row) {
    return (
      <>
        <PageHeader title="Nie znaleziono przejazdu" />
        <p className="text-sm">
          Brak przejazdu o identyfikatorze <code className="font-mono">{id}</code>.{' '}
          <Link to="/przejazdy">Wróć do listy</Link>.
        </p>
      </>
    )
  }
  return <Detail row={row} record={null} />
}

function Detail({ row, record }: { row: Row; record: FictionalCase | null }) {
  const isFictional = record !== null
  const parsed = row.crossingName ? parseCrossingNumber(row.crossingName) : null
  const diagnosis = record ? diagnose(record) : null

  return (
    <>
      <PageHeader
        title={isFictional ? row.name : `Przejazd ${row.name}`}
        description={isFictional ? record.summary : (row.unit ?? undefined)}
        meta={
          <>
            {parsed && row.crossingName ? <KmPlate name={row.crossingName} /> : null}
            {isFictional ? (
              <>
                <span className="text-xs text-muted-foreground">przejazd</span>
                <OriginBadge origin="real" />
                <span className="text-xs text-muted-foreground">zdarzenia</span>
              </>
            ) : null}
            <OriginBadge origin={row.origin} />
            <Separator orientation="vertical" className="h-4!" />
            <CategoryBadge category={row.category} />
            <span className="text-xs text-muted-foreground">
              {row.category ? CATEGORY_LABEL[row.category] : 'Brak kategorii'}
            </span>
            <Separator orientation="vertical" className="h-4!" />
            <PriorityBadge level={row.assessment.inspection.level} />
            <VerificationBadge level={row.assessment.verification.level} />
          </>
        }
        actions={
          <Link to="/przejazdy" className="text-sm">
            ← Lista przejazdów
          </Link>
        }
      />
      {isFictional ? (
        <FictionalDataBanner>
          Numer <span className="font-mono">{record.crossing.name}</span>, położenie i kategoria tego
          przejazdu są realne (WFS GUGiK / PKP PLK). Objawy, kontrole, naruszenia, ruch drogowy i pociągi są
          zmyślone i nie opisują tego przejazdu.
        </FictionalDataBanner>
      ) : null}

      <Tabs defaultValue="priorytet" className="gap-3">
        <TabsList variant="line" className="w-full justify-start border-b">
          <TabsTrigger
            value="priorytet"
            className="flex-none text-muted-foreground data-[state=active]:text-foreground"
          >
            Priorytet
          </TabsTrigger>
          <TabsTrigger
            value="diagnoza"
            className="flex-none text-muted-foreground data-[state=active]:text-foreground"
          >
            Diagnoza
          </TabsTrigger>
          <TabsTrigger
            value="srodki"
            className="flex-none text-muted-foreground data-[state=active]:text-foreground"
          >
            Środki
          </TabsTrigger>
          <TabsTrigger
            value="dane"
            className="flex-none text-muted-foreground data-[state=active]:text-foreground"
          >
            Dane
          </TabsTrigger>
        </TabsList>

        <TabsContent value="priorytet">
          <AssessmentPanels assessment={row.assessment} fictional={isFictional} />
        </TabsContent>

        <TabsContent value="diagnoza" className="flex flex-col gap-3">
          {record && diagnosis ? (
            <>
              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold">Objawy z kontroli</h2>
                {record.observations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Brak zarejestrowanych objawów.</p>
                ) : (
                  <div className="rounded-sm border bg-card">
                    <Table aria-label="Objawy z kontroli">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Data</TableHead>
                          <TableHead className="text-xs">Objaw</TableHead>
                          <TableHead className="text-xs">Notatka z kontroli</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {record.observations.map((o, i) => (
                          <TableRow key={i}>
                            <TableCell className="align-top text-xs tabular-nums">
                              {formatDate(o.observedAt)}
                            </TableCell>
                            <TableCell className="align-top whitespace-normal">
                              {symptomName.get(o.symptomId) ?? o.symptomId}
                              <code className="ml-1 font-mono text-[11px] text-muted-foreground">
                                {o.symptomId}
                              </code>
                            </TableCell>
                            <TableCell className="align-top text-sm whitespace-normal">{o.note}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>
              <section className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold">Przyczyny (wzorce)</h2>
                {diagnosis.causes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{diagnosis.reasons[0]?.textPl}</p>
                ) : (
                  <ul className="grid gap-3 md:grid-cols-2">
                    {diagnosis.causes.map((hit) => (
                      <li key={hit.cause.id} className="flex flex-col gap-1.5 rounded-sm border bg-card p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-medium">{hit.cause.namePl}</span>
                          <code className="font-mono text-[11px] text-muted-foreground">{hit.cause.id}</code>
                        </div>
                        <p className="text-sm">{hit.cause.descriptionPl}</p>
                        <p className="text-xs text-muted-foreground">
                          Na podstawie:{' '}
                          {hit.evidence
                            .map((e) => `${e.symptom.namePl} (${e.observations.length}×)`)
                            .join('; ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hit.cause.sourceNote}{' '}
                          {hit.cause.sourceIds.map((s) => {
                            const src = sourceById(s)
                            return src ? (
                              <span key={s} className="mr-2">
                                <SourceLink url={src.url} />
                              </span>
                            ) : null
                          })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Brak danych o objawach i kontrolach dla realnych przejazdów — to dane wewnętrzne zarządcy.
              Diagnoza działa na przypadkach X1–X10, np. <Link to="/przejazdy/X1">Przejazd X1</Link>.
            </p>
          )}
        </TabsContent>

        <TabsContent value="srodki" className="flex flex-col gap-3">
          {diagnosis && diagnosis.countermeasures.length > 0 ? (
            <>
              {diagnosis.reasons.some((r) => r.code === 'D-EVIDENCE-GAP') ? (
                <Alert>
                  <AlertTitle>Luka w dowodach</AlertTitle>
                  <AlertDescription>
                    Żaden ze środków odpowiadających na rozpoznane przyczyny nie ma udokumentowanej
                    skuteczności. Wdrożenie warto połączyć z oceną przed/po.
                  </AlertDescription>
                </Alert>
              ) : null}
              <RankedCountermeasureTable subjectId={row.id} ranked={diagnosis.countermeasures} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {diagnosis
                ? 'Brak przyczyn — brak wskazanych środków.'
                : 'Środki dobiera się na podstawie diagnozy, której dla realnych przejazdów nie ma (brak danych o objawach).'}{' '}
              Pełny katalog: <Link to="/srodki">Środki zaradcze</Link>.
            </p>
          )}
        </TabsContent>

        <TabsContent value="dane" className="flex flex-col gap-3">
          {record ? <FictionalData record={record} /> : <RealData row={row} />}
        </TabsContent>
      </Tabs>
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </>
  )
}

type CrossingInfo = Pick<Row, 'id' | 'category' | 'unit' | 'lat' | 'lon'> & { name: string }

function RealCrossingSection({ crossing }: { crossing: CrossingInfo }) {
  const wfs = sourceById('gugik-wfs-przejazdy')
  const parsed = parseCrossingNumber(crossing.name)
  return (
    <section className="flex flex-col gap-2 rounded-sm border bg-card p-3">
      <h2 className="text-sm font-semibold">Przejazd (WFS GUGiK / PKP PLK)</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <Field label="Numer identyfikacyjny (NAZWA)">
          <span className="font-mono">{crossing.name}</span>
        </Field>
        <Field label="Linia i kilometr">
          {parsed ? `linia ${parsed.line}, km ${parsed.km}` : 'brak'}{' '}
          <SourceFootnote sourceId="gov-112-przejazdy" />
        </Field>
        <Field label="Identyfikator obiektu">
          <span className="font-mono">{crossing.id}</span>
        </Field>
        <Field label="Kategoria">{crossing.category ?? 'brak danych'}</Field>
        <Field label="Jednostka (IDDE)">{crossing.unit ?? 'brak danych'}</Field>
        <Field label="Współrzędne (WGS84)">
          <span className="font-mono tabular-nums">
            {formatCoord(crossing.lat)}, {formatCoord(crossing.lon)}
          </span>{' '}
          <a
            href={`https://www.openstreetmap.org/?mlat=${crossing.lat}&mlon=${crossing.lon}#map=17/${crossing.lat}/${crossing.lon}`}
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap
          </a>
        </Field>
        <Field label="Stan danych">{wfs ? formatDate(wfs.retrievedAt) : 'brak'}</Field>
      </dl>
      <SourceFootnote sourceId="gugik-wfs-przejazdy" />
    </section>
  )
}

function RealData({ row }: { row: Row }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <RealCrossingSection crossing={row} />
      <section className="flex flex-col gap-2 rounded-sm border bg-card p-3">
        <h2 className="text-sm font-semibold">Ruch drogowy (GPR 2025, GDDKiA)</h2>
        {row.gpr ? (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <Field label="Droga krajowa">
                <span className="font-mono">{row.gpr.roadNumber}</span>
              </Field>
              <Field label="Odcinek">{row.gpr.segmentName ?? 'brak nazwy'}</Field>
              <Field label="SDRR 2025">
                <span className="font-mono tabular-nums">
                  {row.gpr.aadt === null ? 'brak' : `${formatInt(row.gpr.aadt)} poj./dobę`}
                </span>
              </Field>
              <Field label="Odległość od osi odcinka">{formatMeters(row.gpr.distanceM)}</Field>
              <Field label="Pewność dopasowania">{GPR_CONFIDENCE_LABEL[row.gpr.confidence]}</Field>
            </dl>
            <p className="text-xs text-muted-foreground">
              Geometria odcinków GPR jest uproszczona (zwykle linia prosta między węzłami), dlatego odległość
              jest przybliżona. Dopasowanie inne niż „pewne” podnosi priorytet weryfikacji danych.
            </p>
            <SourceFootnote sourceId="gddkia-gpr-2025" />
          </>
        ) : (
          <p className="text-sm">
            Brak danych GPR. Warstwa GPR 2025 obejmuje drogi krajowe; brak dopasowania oznacza zwykle drogę
            lokalną. To brak danych, a nie zerowy ruch.
          </p>
        )}
      </section>
    </div>
  )
}

function FictionalData({ record }: { record: FictionalCase }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <RealCrossingSection crossing={{ ...record.crossing, category: record.category }} />
      <section className="fictional-stamp flex flex-col gap-2 rounded-sm bg-card p-3 pt-4">
        <h2 className="text-sm font-semibold">Dane przypadku (fikcyjne)</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <Field label="Pochodzenie">DANE FIKCYJNE, zmyślone na potrzeby demonstracji</Field>
          <Field label="Przejazd">
            realny (<span className="font-mono">{record.crossing.name}</span>), ale nie dotyczą go te
            zdarzenia
          </Field>
          <Field label="Ostatnia kontrola">
            {record.lastInspectionAt ? formatDate(record.lastInspectionAt) : 'brak danych'}
          </Field>
          <Field label="Pomiar ruchu">
            {record.trafficMeasuredAt ? formatDate(record.trafficMeasuredAt) : 'brak danych'}
          </Field>
          <Field label="Ruch drogowy">
            {record.roadAadt === null ? 'brak danych' : `${formatInt(record.roadAadt)} poj./dobę`}
          </Field>
          <Field label="Pociągi na dobę">
            {record.trainsPerDay === null ? 'brak danych' : formatInt(record.trainsPerDay)}
          </Field>
        </dl>
      </section>
      <section className="fictional-stamp flex flex-col gap-2 rounded-sm bg-card p-3 pt-4 lg:col-span-2">
        <h2 className="text-sm font-semibold">Naruszenia (fikcyjne)</h2>
        {record.violations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak zarejestrowanych pomiarów naruszeń.</p>
        ) : (
          <Table aria-label="Naruszenia w miesiącach">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Miesiąc</TableHead>
                <TableHead className="text-right text-xs">Liczba</TableHead>
                <TableHead className="text-xs">Metoda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {record.violations.map((v) => (
                <TableRow key={v.period}>
                  <TableCell className="text-xs">{formatMonth(v.period)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{formatInt(v.count)}</TableCell>
                  <TableCell className="text-xs whitespace-normal">{v.method}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}
