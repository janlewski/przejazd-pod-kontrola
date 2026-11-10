import { formatDecimal, formatInt } from '@/lib/format'
import type { Reason, ViolationCount } from './types'

export type Caveat = { code: string; titlePl: string; textPl: string }

export type WindowSummary = {
  periods: ViolationCount[]
  total: number
  meanPerPeriod: number | null
}

export type Evaluation = {
  implementedPeriod: string
  before: WindowSummary
  after: WindowSummary
  /** Mean per period after minus before; null when either window is empty. */
  absoluteChange: number | null
  /** (after − before) / before; null when before is 0 or a window is empty. */
  relativeChange: number | null
  caveats: Caveat[]
  reasons: Reason[]
}

/** Always shown in full — never hidden in a tooltip. */
export const BASE_CAVEATS: readonly Caveat[] = [
  {
    code: 'C-REGRESSION',
    titlePl: 'Regresja do średniej',
    textPl: 'Przejazdy wybiera się do działań po złym okresie. Część spadku pojawiłaby się także bez środka.',
  },
  {
    code: 'C-SHORT-WINDOW',
    titlePl: 'Krótkie okno obserwacji',
    textPl: 'Kilka miesięcy przed i po wdrożeniu nie wystarcza, by oddzielić efekt od wahań.',
  },
  {
    code: 'C-SMALL-NUMBERS',
    titlePl: 'Mała liczba zdarzeń',
    textPl:
      'Wypadków na pojedynczym przejeździe jest bardzo mało, dlatego mierzymy naruszenia — wskaźnik zastępczy, nie wypadki.',
  },
  {
    code: 'C-SEASONALITY',
    titlePl: 'Zmiany ruchu i sezonowość',
    textPl: 'Natężenie ruchu, pora roku, objazdy i remonty zmieniają liczbę naruszeń niezależnie od środka.',
  },
  {
    code: 'C-NO-CONTROL',
    titlePl: 'Brak grupy kontrolnej',
    textPl:
      'W demie nie ma porównania z podobnymi przejazdami bez środka. Docelowo: grupa porównawcza lub metoda empirical Bayes.',
  },
]

function summarize(periods: ViolationCount[]): WindowSummary {
  const total = periods.reduce((s, p) => s + p.count, 0)
  return { periods, total, meanPerPeriod: periods.length ? total / periods.length : null }
}

/**
 * Before/after comparison of violation counts around the implementation month.
 * The implementation month itself is excluded (transition period).
 */
export function evaluateBeforeAfter(violations: ViolationCount[], implementedAt: string): Evaluation {
  const implementedPeriod = implementedAt.slice(0, 7)
  const sorted = [...violations].sort((a, b) => a.period.localeCompare(b.period))
  const before = summarize(sorted.filter((v) => v.period < implementedPeriod))
  const after = summarize(sorted.filter((v) => v.period > implementedPeriod))

  const caveats: Caveat[] = [...BASE_CAVEATS]
  const reasons: Reason[] = [
    {
      code: 'E-TRANSITION',
      textPl: `Miesiąc wdrożenia (${implementedPeriod}) pominięty jako okres przejściowy.`,
    },
  ]

  const methods = new Set(sorted.map((v) => v.method))
  if (methods.size > 1) {
    caveats.push({
      code: 'C-METHOD-CHANGE',
      titlePl: 'Zmiana metody pomiaru',
      textPl: `W danych występuje kilka metod liczenia naruszeń (${[...methods].join('; ')}). Porównanie może mierzyć zmianę metody, nie efekt.`,
    })
  }
  if (before.periods.length !== after.periods.length) {
    caveats.push({
      code: 'C-UNEQUAL-WINDOWS',
      titlePl: 'Nierówne okna',
      textPl: `Okno przed: ${before.periods.length} mies., po: ${after.periods.length} mies. Porównujemy średnie miesięczne.`,
    })
  }

  let absoluteChange: number | null = null
  let relativeChange: number | null = null
  if (before.meanPerPeriod === null || after.meanPerPeriod === null) {
    reasons.push({
      code: 'E-EMPTY-WINDOW',
      textPl: 'Brak danych przed lub po wdrożeniu — nie można porównać.',
    })
  } else {
    absoluteChange = after.meanPerPeriod - before.meanPerPeriod
    relativeChange = before.meanPerPeriod === 0 ? null : absoluteChange / before.meanPerPeriod
    reasons.push({
      code: 'E-MEANS',
      textPl: `Średnio ${formatDecimal(before.meanPerPeriod)} naruszeń/mies. przed (łącznie ${formatInt(before.total)}) i ${formatDecimal(after.meanPerPeriod)} po (łącznie ${formatInt(after.total)}).`,
    })
  }

  return { implementedPeriod, before, after, absoluteChange, relativeChange, caveats, reasons }
}
