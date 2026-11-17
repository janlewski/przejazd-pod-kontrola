import { useEffect, useId, useLayoutEffect, useRef, useState, type Ref, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import {
  CROSSING,
  planCrossingGap,
  planCrossingMove,
  passClearMs,
} from '@/components/landing/crossingTraffic'

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
      {/* Two red lamps, lit alternately while a train is due. Hidden until the warning starts. */}
      <g className="crossing-lamps">
        <circle className="crossing-lamp crossing-lamp-top" cx={x} cy={y - 6} r={3} />
        <circle className="crossing-lamp crossing-lamp-bottom" cx={x} cy={y + 6} r={3} />
      </g>
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

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * Top-down consist. The diagram's rail gauge is 12 units; a car is 18 across (a little
 * wider than the rails) and 150 along, about 8:1, which is a passenger car seen from above.
 * viewBox 470×18 matches `.crossing-train` in index.css. The nose is on the right.
 */
const CAR_LENGTH = 150
const CAR_HEIGHT = 18
const CAR_GAP = 10
const TRAIN_CARS = [{ lead: false }, { lead: false }, { lead: true }] as const

function TrainCar({ x, lead }: { x: number; lead: boolean }) {
  const roofWidth = CAR_LENGTH - (lead ? 18 : 8)
  const windows = Array.from({ length: 7 }, (_, i) => x + 12 + i * 18)
  return (
    <g>
      <rect x={x} y={0} width={CAR_LENGTH} height={CAR_HEIGHT} rx={2} fill={INK} />
      <rect x={x + 4} y={3.5} width={roofWidth} height={11} rx={1} fill={PAPER} />
      {windows.map((wx) => (
        <g key={wx}>
          <rect x={wx} y={4.5} width={9} height={3} fill={INK} />
          <rect x={wx} y={10.5} width={9} height={3} fill={INK} />
        </g>
      ))}
      {lead ? (
        <rect x={x + CAR_LENGTH - 10} y={4} width={5} height={10} rx={1} fill={PAPER} />
      ) : (
        <rect x={x + CAR_LENGTH} y={8} width={CAR_GAP} height={2} fill={INK} />
      )}
    </g>
  )
}

function TrainConsist({ facing, ref }: { facing: 'right' | 'left'; ref?: Ref<SVGSVGElement> }) {
  const length = TRAIN_CARS.length * CAR_LENGTH + (TRAIN_CARS.length - 1) * CAR_GAP
  const mirror = facing === 'left' ? `translate(${length} 0) scale(-1 1)` : undefined
  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox={`0 0 ${length} ${CAR_HEIGHT}`}
      preserveAspectRatio="none"
      className={facing === 'right' ? 'crossing-train' : 'crossing-train crossing-train-lower'}
    >
      <g transform={mirror}>
        {TRAIN_CARS.map((car, i) => (
          <TrainCar key={i} x={i * (CAR_LENGTH + CAR_GAP)} lead={car.lead} />
        ))}
      </g>
    </svg>
  )
}

function waitWhile(ms: number, paused: () => boolean, cancelled: () => boolean) {
  return new Promise<void>((resolve) => {
    if (ms <= 0) {
      resolve()
      return
    }
    let elapsed = 0
    let last = performance.now()
    const step = (now: number) => {
      if (cancelled()) {
        resolve()
        return
      }
      if (!paused()) elapsed += now - last
      last = now
      if (elapsed >= ms) resolve()
      else requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  })
}

function slide(el: SVGElement, frames: Keyframe[], ms: number, paused: boolean) {
  el.getAnimations().forEach((anim) => anim.cancel())
  const anim = el.animate(frames, { duration: ms, easing: 'linear', fill: 'forwards' })
  if (paused) anim.pause()
}

/**
 * Lamps, the working barrier, and one or two trains. The idle gap and the direction
 * are chosen per pass. Pause freezes the clock and any animation already running.
 */
function useCrossingSchedule(
  reduced: boolean,
  running: boolean,
  setWarning: (on: boolean) => void,
  rootRef: RefObject<HTMLDivElement | null>,
  boomRef: RefObject<SVGGElement | null>,
  upperRef: RefObject<SVGSVGElement | null>,
  lowerRef: RefObject<SVGSVGElement | null>,
) {
  const pausedRef = useRef(!running)

  useLayoutEffect(() => {
    pausedRef.current = !running
    const root = rootRef.current
    if (!root || reduced) return
    root.getAnimations({ subtree: true }).forEach((anim) => {
      if (anim.playState === 'finished') return
      if (running) {
        if (anim.playState === 'paused') anim.play()
      } else if (anim.playState === 'running') anim.pause()
    })
  }, [reduced, rootRef, running])

  useEffect(() => {
    if (reduced) return
    const boom = boomRef.current
    const upper = upperRef.current
    const lower = lowerRef.current
    if (!boom || !upper || !lower) return

    let cancel = false
    const cancelled = () => cancel
    const paused = () => pausedRef.current

    const depart = (el: SVGSVGElement, delay: number, ms: number) => {
      void waitWhile(delay, paused, cancelled).then(() => {
        if (cancel) return
        const parent = el.parentElement
        if (!parent) return
        const distance = parent.getBoundingClientRect().width + el.getBoundingClientRect().width
        const dx = el.classList.contains('crossing-train-lower') ? -distance : distance
        slide(el, [{ transform: 'translateX(0px)' }, { transform: `translateX(${dx}px)` }], ms, paused())
      })
    }

    const run = async () => {
      await waitWhile(400 + Math.random() * 700, paused, cancelled)
      while (!cancel) {
        const move = planCrossingMove()
        setWarning(true)
        await waitWhile(CROSSING.lampsLeadMs, paused, cancelled)
        if (cancel) return
        slide(boom, [{ transform: 'scaleX(0.14)' }, { transform: 'scaleX(1)' }], CROSSING.barrierMs, paused())
        await waitWhile(CROSSING.barrierMs, paused, cancelled)
        if (cancel) return
        if (move.upper) depart(upper, move.upperDelay, move.upperMs)
        if (move.lower) depart(lower, move.lowerDelay, move.lowerMs)
        await waitWhile(passClearMs(move), paused, cancelled)
        if (cancel) return
        slide(boom, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0.14)' }], CROSSING.barrierMs, paused())
        await waitWhile(CROSSING.barrierMs, paused, cancelled)
        if (cancel) return
        setWarning(false)
        await waitWhile(CROSSING.lampsTailMs, paused, cancelled)
        if (cancel) return
        await waitWhile(planCrossingGap(), paused, cancelled)
      }
    }

    void run()
    return () => {
      cancel = true
      setWarning(false)
      for (const el of [boom, upper, lower]) el.getAnimations().forEach((anim) => anim.cancel())
    }
  }, [boomRef, lowerRef, reduced, setWarning, upperRef])
}

/**
 * Top view of a category B crossing (Dz.U. 2025 poz. 1105 §6 ust. 1 pkt 2): signals and
 * half-barriers closing the entry lane only, with the UTK incident type C66 marked.
 * Trains arrive at random gaps, on one track or on both at once in opposite directions.
 * Lamps alternate, the working half-barrier lowers, the train passes, the barrier rises.
 * The broken barrier stays down.
 */
export function CrossingSchematic() {
  const id = useId()
  const reduced = usePrefersReducedMotion()
  const [running, setRunning] = useState(true)
  const [warning, setWarning] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const boomRef = useRef<SVGGElement>(null)
  const upperRef = useRef<SVGSVGElement>(null)
  const lowerRef = useRef<SVGSVGElement>(null)
  useCrossingSchedule(reduced, running, setWarning, rootRef, boomRef, upperRef, lowerRef)
  const rails = [150, 162, 198, 210]
  const sleepers = Array.from({ length: 35 }, (_, i) => i * 14)
  return (
    <div
      ref={rootRef}
      className="crossing-schematic flex flex-col gap-2"
      data-train={running ? 'run' : 'paused'}
      data-warning={warning ? 'on' : 'off'}
    >
      <div className="relative overflow-hidden">
        <svg
          viewBox="0 0 480 360"
          role="img"
          aria-labelledby={`${id}-t ${id}-d`}
          className="block h-auto w-full"
        >
          <title id={`${id}-t`}>Schemat przejazdu kategorii B, widok z góry</title>
          <desc id={`${id}-d`}>
            Droga dwukierunkowa przecina dwa tory. Sygnalizatory i półrogatki zamykają tylko pasy wjazdowe.
            Pojazd nadjeżdżający z dołu nie zatrzymuje się przed zamkniętą półrogatką i ją uszkadza.
          </desc>

          {/* Road with lane edges and centre line. */}
          <rect x="180" y="0" width="120" height="360" fill={ROAD} />
          <line x1="180" y1="0" x2="180" y2="360" stroke="#A9AAA4" strokeWidth="1.5" />
          <line x1="300" y1="0" x2="300" y2="360" stroke="#A9AAA4" strokeWidth="1.5" />
          <line x1="240" y1="0" x2="240" y2="130" stroke="#A9AAA4" strokeWidth="2" strokeDasharray="10 10" />
          <line
            x1="240"
            y1="230"
            x2="240"
            y2="360"
            stroke="#A9AAA4"
            strokeWidth="2"
            strokeDasharray="10 10"
          />

          {/* Two tracks on sleepers; the crossing deck covers them on the road. */}
          {[143, 191].map((top) =>
            sleepers.map((x) => (
              <rect
                key={`${top}-${x}`}
                x={x + 2}
                y={top}
                width="5"
                height="26"
                fill="#545A61"
                opacity="0.45"
              />
            )),
          )}
          <rect x="180" y="136" width="120" height="88" fill={DECK} />
          {rails.map((y) => (
            <line key={y} x1="0" y1={y} x2="480" y2={y} stroke={INK} strokeWidth="3" />
          ))}

          {/* Southbound entry (top, left lane): signal + closed half-barrier. Exit lane open. */}
          <Signal x={160} y={98} />
          <rect x="171" y="94" width="8" height="8" fill={INK} />
          {/* Raised between trains (foreshortened in plan); lowered across the entry lane for the pass. */}
          <g ref={boomRef} className="crossing-boom">
            <Boom x1={175} x2={238} y={98} />
          </g>

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
        <TrainConsist ref={upperRef} facing="right" />
        <TrainConsist ref={lowerRef} facing="left" />
      </div>
      {reduced ? null : (
        <Button
          type="button"
          variant="link"
          size="xs"
          className="h-auto min-h-6 self-end px-0"
          onClick={() => setRunning((value) => !value)}
        >
          {running ? 'Zatrzymaj animację' : 'Wznów animację'}
        </Button>
      )}
    </div>
  )
}
