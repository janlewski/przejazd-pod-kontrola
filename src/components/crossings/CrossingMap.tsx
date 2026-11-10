import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import {
  POLAND_BOUNDS,
  POLAND_CENTER,
  POLAND_ZOOM,
  TILE_ATTRIBUTION,
  TILE_MAX_ZOOM,
  TILE_URL,
} from '@/config/map'
import type { Row } from '@/domain/assess'
import { formatInt } from '@/lib/format'
import { CATEGORY_COLOR, PRIORITY_COLOR, type ColorMode } from './mapColors'

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

function popupHtml(row: Row): string {
  const level = row.assessment.inspection.level ?? 'brak oceny'
  const fictional = row.origin === 'fictional'
  const aadt =
    row.origin === 'real'
      ? row.gpr?.aadt != null
        ? `SDRR ${formatInt(row.gpr.aadt)}`
        : 'brak danych GPR'
      : row.assessment.exposure.roadAadt != null
        ? `ruch ${formatInt(row.assessment.exposure.roadAadt)} poj./dobę`
        : 'brak danych o ruchu'
  return [
    `<div class="flex flex-col gap-1 text-xs">`,
    fictional ? `<strong class="tracking-wide">DANE FIKCYJNE na realnym przejeździe</strong>` : '',
    `<strong class="text-sm">${escapeHtml(row.name)}${
      fictional && row.crossingName ? ` · <span class="font-mono">${escapeHtml(row.crossingName)}</span>` : ''
    }</strong>`,
    `<span>Kategoria ${row.category ?? '?'}, kontrola: ${escapeHtml(level)}, dane: ${row.assessment.verification.level}</span>`,
    `<span>${escapeHtml(aadt)}</span>`,
    `<a href="#/przejazdy/${encodeURIComponent(row.id)}">Otwórz kartę przejazdu</a>`,
    `</div>`,
  ].join('')
}

/** ~11 700 points: keep them small and unoutlined at country scale so the network stays readable. */
function pointStyle(zoom: number): { radius: number; weight: number } {
  if (zoom <= 6) return { radius: 1.6, weight: 0 }
  if (zoom === 7) return { radius: 2, weight: 0 }
  if (zoom <= 9) return { radius: 2.5, weight: 0.5 }
  return { radius: 4, weight: 0.75 }
}

function fictionalIcon(row: Row): L.DivIcon {
  const color = PRIORITY_COLOR[row.assessment.inspection.level ?? 'none']
  return L.divIcon({
    className: '',
    iconSize: [44, 22],
    iconAnchor: [11, 11],
    html: `<div style="display:flex;align-items:center;gap:2px">
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <path d="M11 1 21 11 11 21 1 11Z" fill="${color}" stroke="#1F2328" stroke-width="1.5" stroke-dasharray="3 2"/>
      </svg>
      <span style="font:600 11px 'IBM Plex Mono',monospace;background:#fff;border:1px dashed #1F2328;padding:0 2px">${escapeHtml(row.id)}</span>
    </div>`,
  })
}

/**
 * Plain Leaflet (BSD-2-Clause). Real crossings are drawn on one canvas layer; the ten
 * fictional cases are DOM markers with a dashed outline so they stay keyboard-focusable.
 */
export function CrossingMap({
  rows,
  colorMode,
  selectedId = null,
  className,
}: {
  rows: Row[]
  colorMode: ColorMode
  /** Row to centre on with its popup open (e.g. the demo case from the landing page). */
  selectedId?: string | null
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const userMovedRef = useRef(false)
  const centeredRef = useRef<string | null>(null)
  const markersRef = useRef(new Map<string, L.Marker | L.CircleMarker>())
  const [map, setMap] = useState<L.Map | null>(null)
  const [renderer] = useState(() => L.canvas({ padding: 0.5 }))

  useEffect(() => {
    if (!containerRef.current) return
    const instance = L.map(containerRef.current, {
      center: POLAND_CENTER,
      zoom: POLAND_ZOOM,
      minZoom: 5,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      preferCanvas: true,
    })
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: TILE_MAX_ZOOM }).addTo(instance)
    instance.attributionControl.setPrefix(
      '<a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a>',
    )
    // The container settles its size after layout; keep Poland fitted until the user moves the map.
    const moved = () => (userMovedRef.current = true)
    instance.on('dragstart', moved)
    containerRef.current.addEventListener('wheel', moved, { passive: true })
    instance.zoomControl.getContainer()?.addEventListener('click', moved)
    const observer = new ResizeObserver(() => {
      instance.invalidateSize()
      if (!userMovedRef.current && containerRef.current && containerRef.current.clientWidth > 0) {
        instance.fitBounds(POLAND_BOUNDS)
      }
    })
    observer.observe(containerRef.current)
    setMap(instance)
    return () => {
      observer.disconnect()
      instance.remove()
      setMap(null)
    }
  }, [])

  useEffect(() => {
    if (!map) return
    const layer = L.layerGroup()
    const points: L.CircleMarker[] = []
    const markers = markersRef.current
    markers.clear()
    const initial = pointStyle(map.getZoom())
    for (const row of rows) {
      if (row.origin === 'fictional') {
        const marker = L.marker([row.lat, row.lon], {
          icon: fictionalIcon(row),
          title: `${row.name}: DANE FIKCYJNE na realnym przejeździe ${row.crossingName ?? ''}`,
          keyboard: true,
          zIndexOffset: 1000,
        })
          .bindPopup(popupHtml(row))
          .addTo(layer)
        markers.set(row.id, marker)
        continue
      }
      const fill =
        colorMode === 'priority'
          ? PRIORITY_COLOR[row.assessment.inspection.level ?? 'none']
          : CATEGORY_COLOR[row.category ?? 'none']
      const point = L.circleMarker([row.lat, row.lon], {
        renderer,
        ...initial,
        color: '#545A61',
        fillColor: fill,
        fillOpacity: 0.85,
      })
        .bindPopup(popupHtml(row))
        .addTo(layer)
      points.push(point)
      markers.set(row.id, point)
    }
    const restyle = () => {
      const style = pointStyle(map.getZoom())
      for (const p of points) p.setStyle({ weight: style.weight }).setRadius(style.radius)
    }
    map.on('zoomend', restyle)
    layer.addTo(map)
    return () => {
      map.off('zoomend', restyle)
      layer.remove()
    }
  }, [map, renderer, rows, colorMode])

  useEffect(() => {
    if (!map || !selectedId) return
    const marker = markersRef.current.get(selectedId)
    if (!marker) return
    // Centre once per selection; markers are rebuilt on filter changes, so the popup is reopened.
    if (centeredRef.current !== selectedId) {
      centeredRef.current = selectedId
      userMovedRef.current = true
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 7.5))
    }
    marker.openPopup()
  }, [map, selectedId, rows, colorMode])

  return (
    <div
      className={className}
      role="region"
      aria-label="Mapa przejazdów kolejowo-drogowych. Te same dane są dostępne w tabeli."
    >
      <div ref={containerRef} className="h-full w-full rounded-sm border" />
    </div>
  )
}
