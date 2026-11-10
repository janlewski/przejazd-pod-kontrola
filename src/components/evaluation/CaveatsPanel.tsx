import type { Caveat } from '@/domain/evaluate'

/** Always rendered in full — never collapsed or moved into a tooltip. */
export function CaveatsPanel({ caveats }: { caveats: Caveat[] }) {
  return (
    <section
      aria-labelledby="zastrzezenia"
      className="flex flex-col gap-2 rounded-sm border-2 border-foreground bg-card p-3"
    >
      <h2 id="zastrzezenia" className="text-sm font-semibold">
        Zastrzeżenia — przeczytaj przed interpretacją wyniku
      </h2>
      <ol className="flex flex-col gap-2">
        {caveats.map((c, i) => (
          <li key={c.code} className="grid grid-cols-[1.5rem_1fr] text-sm">
            <span className="font-mono text-xs text-muted-foreground">{i + 1}.</span>
            <span>
              <strong className="font-medium">{c.titlePl}.</strong> {c.textPl}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
