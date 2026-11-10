import { useId } from 'react'

const INK = '#1F2328'
const PAPER = '#FAFAF7'
const ROAD = '#E6E6E0'
const DECK = '#D2D2CB'

/** Striped boom from (x1) to (x2) at height y. */
function Boom({ x1, x2, y, broken = false }: { x1: number; x2: number; y: number; broken?: boolean }) {
  const uid = useId()
  const left = Math.min(x1, x2)
  const width = Math.abs(x2 - x1)
  const stripes = Array.from({ length: Math.ceil(width / 12) }, (_, i) => i)
  const body = (
    <g>
      <rect x={left} y={y - 3.5} width={width} height={7} fill={PAPER} stroke={INK} strokeWidth="1.25" />
      {stripes
        .filter((i) => i % 2 === 0)
        .map((i) => (
          <rect
            key={i}
            x={left + i * 12}
            y={y - 3.5}
            width={Math.min(12, width - i * 12)}
            height={7}
            fill={INK}
          />
        ))}
    </g>
  )
  if (!broken) return body
  // Broken: the boom tip is knocked out of line.
  return (
    <g>
      <clipPath id={`${uid}-base`}>
        <rect x={left + width * 0.45} y={y - 10} width={width} height={20} />
      </clipPath>
      <clipPath id={`${uid}-tip`}>
        <rect x={left - 4} y={y - 10} width={width * 0.45 + 4} height={20} />
      </clipPath>
      <g clipPath={`url(#${uid}-base)`}>{body}</g>
      <g clipPath={`url(#${uid}-tip)`} transform={`rotate(-24 ${left + width * 0.45} ${y})`}>
        {body}
      </g>
    </g>
  )
}

function Signal({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 7} y={y - 15} width={14} height={30} rx={2} fill={INK} />
      <circle cx={x} cy={y - 6} r={4} fill="none" stroke={PAPER} strokeWidth="1.5" />
      <circle cx={x} cy={y + 6} r={4} fill="none" stroke={PAPER} strokeWidth="1.5" />
    </g>
  )
}

function Marker({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill={PAPER} stroke={INK} strokeWidth="2" />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
        fill={INK}
        fontFamily="IBM Plex Sans"
      >
        {n}
      </text>
    </g>
  )
}

/**
 * Top view of a category B crossing (Dz.U. 2025 poz. 1105 §6 ust. 1 pkt 2): signals and
 * half-barriers closing the entry lane only, with the UTK incident type C66 marked.
 */
export function CrossingSchematic() {
  const id = useId()
  const rails = [150, 162, 198, 210]
  const sleepers = Array.from({ length: 35 }, (_, i) => i * 14)
  return (
    <svg viewBox="0 0 480 360" role="img" aria-labelledby={`${id}-t ${id}-d`} className="h-auto w-full">
      <title id={`${id}-t`}>Schemat przejazdu kategorii B, widok z góry</title>
      <desc id={`${id}-d`}>
        Droga dwukierunkowa przecina dwa tory. Sygnalizatory i półrogatki zamykają tylko pasy wjazdowe. Pojazd
        nadjeżdżający z dołu nie zatrzymuje się przed zamkniętą półrogatką i ją uszkadza.
      </desc>

      {/* Road with lane edges and centre line. */}
      <rect x="180" y="0" width="120" height="360" fill={ROAD} />
      <line x1="180" y1="0" x2="180" y2="360" stroke="#A9AAA4" strokeWidth="1.5" />
      <line x1="300" y1="0" x2="300" y2="360" stroke="#A9AAA4" strokeWidth="1.5" />
      <line x1="240" y1="0" x2="240" y2="130" stroke="#A9AAA4" strokeWidth="2" strokeDasharray="10 10" />
      <line x1="240" y1="230" x2="240" y2="360" stroke="#A9AAA4" strokeWidth="2" strokeDasharray="10 10" />

      {/* Two tracks on sleepers; the crossing deck covers them on the road. */}
      {[143, 191].map((top) =>
        sleepers.map((x) => (
          <rect key={`${top}-${x}`} x={x + 2} y={top} width="5" height="26" fill="#545A61" opacity="0.45" />
        )),
      )}
      <rect x="180" y="136" width="120" height="88" fill={DECK} />
      {rails.map((y) => (
        <line key={y} x1="0" y1={y} x2="480" y2={y} stroke={INK} strokeWidth="3" />
      ))}

      {/* Southbound entry (top, left lane): signal + closed half-barrier. Exit lane open. */}
      <Signal x={160} y={98} />
      <rect x="171" y="94" width="8" height="8" fill={INK} />
      <Boom x1={175} x2={238} y={98} />

      {/* Northbound entry (bottom, right lane): signal + half-barrier, broken by a vehicle. */}
      <Signal x={320} y={262} />
      <rect x="301" y="258" width="8" height="8" fill={INK} />
      <Boom x1={305} x2={242} y={262} broken />

      {/* Vehicle that did not stop. */}
      <rect x="252" y="286" width="34" height="52" rx="5" fill={PAPER} stroke={INK} strokeWidth="2" />
      <rect x="257" y="292" width="24" height="10" rx="2" fill={INK} opacity="0.85" />
      <path d="M269 284 V270" stroke={INK} strokeWidth="2" strokeDasharray="4 3" />
      <path d="M263 276 L269 268 L275 276" fill="none" stroke={INK} strokeWidth="2" />

      <Marker x={136} y={98} n={1} />
      <Marker x={206} y={76} n={2} />
      <Marker x={336} y={312} n={3} />
      <line x1="326" y1="306" x2="290" y2="290" stroke={INK} strokeWidth="1.25" />
    </svg>
  )
}
