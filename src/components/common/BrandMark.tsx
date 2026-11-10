/** Crossing plate: a square sign with crossed bars (after the St Andrew's cross). */
export function BrandMark({ size = 36, inverted = false }: { size?: number; inverted?: boolean }) {
  const plate = inverted ? '#1F2328' : '#FAFAF7'
  const ink = inverted ? '#FAFAF7' : '#1F2328'
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden className="shrink-0">
      <rect x="1" y="1" width="34" height="34" rx="3" fill={plate} />
      <g transform="rotate(45 18 18)">
        <rect x="4" y="15" width="28" height="6" fill={ink} />
        <rect x="15" y="4" width="6" height="28" fill={ink} />
        <rect x="9" y="15" width="3" height="6" fill={plate} />
        <rect x="24" y="15" width="3" height="6" fill={plate} />
        <rect x="15" y="9" width="6" height="3" fill={plate} />
        <rect x="15" y="24" width="6" height="3" fill={plate} />
      </g>
    </svg>
  )
}
