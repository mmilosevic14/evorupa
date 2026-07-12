'use client'

import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { getReportPhotoUrl } from '@/lib/reportMedia'
import type { PlaceGroup } from '@/lib/reportLocation'
import type { Report } from '@/lib/supabase'
import { groupReportsByPlace } from '@/lib/reportLocation'
import { SERBIA_DISTRICT_BOUNDARIES } from '@/lib/serbiaDistricts'

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" aria-label="OpenStreetMap">OSM</a>'
const DEFAULT_MAP_CENTER: [number, number] = [44.8176, 20.4554]
const INDIVIDUAL_MARKER_ZOOM = 13
const DEFAULT_MAP_HEIGHT_CLASS = 'h-96'
const EXPANDED_MAP_HEIGHT_CLASS = 'h-[min(78vh,720px)]'
const MAP_VIEW_ANIMATION = {
  animate: true,
  duration: 0.35,
  easeLinearity: 0.2,
}

function preserveMapViewport(map: L.Map, delay = 320) {
  const center = map.getCenter()
  const zoom = map.getZoom()

  const restoreView = () => {
    map.invalidateSize({ pan: false, debounceMoveend: true })
    map.setView(center, zoom, MAP_VIEW_ANIMATION)
  }

  requestAnimationFrame(restoreView)
  window.setTimeout(restoreView, delay)
}

function fitActiveMarkers(map: L.Map, markersLayer: L.FeatureGroup | null, delay = 320) {
  if (!markersLayer) {
    preserveMapViewport(map, delay)
    return
  }

  const fitMarkers = () => {
    map.invalidateSize({ pan: false, debounceMoveend: true })

    const markerBounds = markersLayer.getBounds()

    if (!markerBounds.isValid()) {
      return
    }

    const markerCount = markersLayer.getLayers().length

    if (markerCount > 1) {
      map.fitBounds(markerBounds, {
        padding: [32, 32],
        ...MAP_VIEW_ANIMATION,
      })
      return
    }

    map.setView(markerBounds.getCenter(), map.getZoom(), MAP_VIEW_ANIMATION)
  }

  requestAnimationFrame(fitMarkers)
  window.setTimeout(fitMarkers, delay)
}

// Fix Leaflet marker icons
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

export default function MapComponent({
  reports = [],
  selectedDistrict = null,
  onPlaceGroupSelect,
  onReportsViewed,
  statusLabels,
}: {
  reports?: Report[]
  selectedDistrict?: string | null
  onPlaceGroupSelect?: (group: PlaceGroup) => void
  onReportsViewed?: (reportIds: string[]) => void
  statusLabels?: Record<string, string>
}) {
  const [isPopupExpanded, setIsPopupExpanded] = useState(false)
  const [isFullscreenActive, setIsFullscreenActive] = useState(false)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.FeatureGroup | null>(null)
  const districtLayerRef = useRef<L.LayerGroup | null>(null)
  const fullscreenButtonRef = useRef<HTMLAnchorElement | null>(null)
  const isFullscreenActiveRef = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    const shell = shellRef.current

    if (!container || !shell || mapRef.current) {
      return
    }

    const map = L.map(container, {
      center: DEFAULT_MAP_CENTER,
      zoom: 7,
      attributionControl: false,
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
    })

    L.control.attribution({ prefix: false }).addTo(map)

    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      updateWhenIdle: true,
      keepBuffer: 2,
    }).addTo(map)

    const FullscreenControl = L.Control.extend({
      onAdd() {
        const controlContainer = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-compact-fullscreen')
        const button = L.DomUtil.create('a', '', controlContainer) as HTMLAnchorElement
        button.href = '#'
        button.innerHTML = '&#x26F6;'
        button.title = 'Prikaži mapu preko celog ekrana'
        button.setAttribute('aria-label', button.title)
        fullscreenButtonRef.current = button

        L.DomEvent.disableClickPropagation(controlContainer)
        L.DomEvent.disableScrollPropagation(controlContainer)
        L.DomEvent.on(button, 'click', (event: Event) => {
          L.DomEvent.stop(event)

          if (document.fullscreenElement === shell) {
            void document.exitFullscreen()
            return
          }

          void shell.requestFullscreen()
        })

        return controlContainer
      },
    })

    new FullscreenControl({ position: 'topleft' }).addTo(map)

    markersLayerRef.current = L.featureGroup().addTo(map)
    districtLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    const syncFullscreenState = () => {
      const active = document.fullscreenElement === shell
      isFullscreenActiveRef.current = active
      setIsFullscreenActive(active)

      if (fullscreenButtonRef.current) {
        fullscreenButtonRef.current.innerHTML = active ? '&#x2715;' : '&#x26F6;'
        fullscreenButtonRef.current.title = active
          ? 'Izađi iz prikaza preko celog ekrana'
          : 'Prikaži mapu preko celog ekrana'
        fullscreenButtonRef.current.setAttribute('aria-label', fullscreenButtonRef.current.title)
      }

      preserveMapViewport(map)
    }

    const handlePopupOpen = () => {
      if (!isFullscreenActiveRef.current) {
        setIsPopupExpanded(true)
      }
    }

    const handlePopupClose = () => {
      if (!isFullscreenActiveRef.current) {
        setIsPopupExpanded(false)
      }

      fitActiveMarkers(map, markersLayerRef.current)
    }

    const handleBeforePrint = () => {
      preserveMapViewport(map, 420)
    }

    const handleAfterPrint = () => {
      preserveMapViewport(map, 420)
    }

    document.addEventListener('fullscreenchange', syncFullscreenState)
    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
    map.on('popupopen', handlePopupOpen)
    map.on('popupclose', handlePopupClose)

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState)
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
      map.off('popupopen', handlePopupOpen)
      map.off('popupclose', handlePopupClose)
      markersLayerRef.current?.clearLayers()
      markersLayerRef.current = null
      districtLayerRef.current?.clearLayers()
      districtLayerRef.current = null
      fullscreenButtonRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const markersLayer = markersLayerRef.current
    const districtLayer = districtLayerRef.current

    if (!map || !markersLayer || !districtLayer) {
      return
    }

    const placeGroups = groupReportsByPlace(reports)
    const selectedDistrictBoundary = selectedDistrict
      ? SERBIA_DISTRICT_BOUNDARIES.find((feature) => feature.district === selectedDistrict) ?? null
      : null

    districtLayer.clearLayers()

    SERBIA_DISTRICT_BOUNDARIES.forEach((feature) => {
      const isSelected = feature.district === selectedDistrict
      const latLngPolygons = feature.polygons.map((polygon) =>
        polygon.map((ring) => ring.map(([longitude, latitude]) => [latitude, longitude] as [number, number])),
      )

      L.polygon(latLngPolygons, {
        color: isSelected ? '#0f172a' : '#64748b',
        weight: isSelected ? 2.5 : 1,
        opacity: isSelected ? 0.8 : 0.35,
        fillColor: isSelected ? '#2563eb' : '#94a3b8',
        fillOpacity: isSelected ? 0.08 : 0.02,
        interactive: false,
      }).addTo(districtLayer)
    })

    const renderMarkers = () => {
      markersLayer.clearLayers()

      const shouldKeepPlaceClusters = Boolean(selectedDistrict) && placeGroups.length > 1
      const shouldShowIndividualReports =
        placeGroups.length <= 1 || (!shouldKeepPlaceClusters && map.getZoom() >= INDIVIDUAL_MARKER_ZOOM)

      if (shouldShowIndividualReports) {
        reports.forEach((report) => {
          const photoUrl = getReportPhotoUrl(report.photo_url)
          const marker = L.marker([report.latitude, report.longitude])
          marker.bindPopup(`
            <div class="text-sm" style="min-width:260px;max-width:320px;">
              <img
                src="${photoUrl}"
                alt="${report.title}"
                style="width:100%;height:128px;object-fit:cover;border-radius:0.5rem;margin-bottom:0.75rem;background:#f3f4f6;"
              />
              <h3 style="font-weight:700;margin-bottom:0.25rem;">${report.title}</h3>
              <p style="font-size:12px;color:#4b5563;margin-bottom:0.5rem;">${report.description.substring(0, 160)}...</p>
              <p style="font-size:12px;margin-bottom:0.25rem;"><strong>Status:</strong> ${statusLabels?.[report.status] ?? report.status}</p>
              <p style="font-size:12px;"><strong>Koordinate:</strong> ${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}</p>
            </div>
          `)
          marker.on('popupopen', () => {
            onReportsViewed?.([report.id])
          })
          marker.addTo(markersLayer)
        })

        return
      }

      placeGroups.forEach((group) => {
        const unresolvedReports = group.reports.filter(
          (report) => report.status !== 'resolved' && report.status !== 'rejected',
        )
        const marker = L.marker([group.latitude, group.longitude], {
          icon: L.divIcon({
            className: 'place-cluster-icon',
            html: `
              <div style="
                width:44px;
                height:44px;
                border-radius:9999px;
                background:${group.openCount > 0 ? '#dc2626' : '#2563eb'};
                color:#fff;
                display:flex;
                align-items:center;
                justify-content:center;
                font-weight:700;
                border:3px solid rgba(255,255,255,0.9);
                box-shadow:0 10px 15px rgba(0,0,0,0.2);
              ">${group.reportCount}</div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          }),
        })
        if (onPlaceGroupSelect) {
          marker.on('click', () => {
            onPlaceGroupSelect(group)
          })
          marker.bindTooltip(
            `${group.label} (${group.reportCount})${group.district ? ` - ${group.district}` : ''}`,
            {
              direction: 'top',
              offset: [0, -18],
            },
          )
        } else {
          const popupHtml = `
            <div class="text-sm" style="min-width:280px;max-width:320px;">
              <h3 class="font-bold text-base" style="margin-bottom:0.25rem;">${group.label}</h3>
              ${group.municipality ? `<p class="text-xs text-gray-600" style="margin-bottom:0.25rem;">Opština/grad: ${group.municipality}</p>` : ''}
              ${group.district ? `<p class="text-xs text-gray-600" style="margin-bottom:0.5rem;">Okrug: ${group.district}</p>` : ''}
              <p class="text-xs" style="margin-bottom:0.75rem;">Ukupno prijava: <strong>${group.reportCount}</strong> | Otvoreno: <strong>${group.openCount}</strong></p>
              <div style="display:flex;flex-direction:column;gap:0.75rem;max-height:320px;overflow:auto;">
                ${group.reports
                  .map((report) => {
                    const photoUrl = getReportPhotoUrl(report.photo_url)

                    return `
                      <div style="border-top:1px solid #e5e7eb;padding-top:0.75rem;">
                        <img
                          src="${photoUrl}"
                          alt="${report.title}"
                          style="width:100%;height:128px;object-fit:cover;border-radius:0.5rem;margin-bottom:0.5rem;background:#f3f4f6;"
                        />
                        <h4 style="font-weight:700;margin-bottom:0.25rem;">${report.title}</h4>
                        <p style="font-size:12px;color:#4b5563;margin-bottom:0.5rem;">${report.description.substring(0, 120)}...</p>
                        <p style="font-size:12px;"><strong>Status:</strong> ${statusLabels?.[report.status] ?? report.status}</p>
                      </div>
                    `
                  })
                  .join('')}
              </div>
              ${unresolvedReports.length === 0 ? '<p style="margin-top:0.75rem;font-size:12px;color:#16a34a;">Nema otvorenih problema u ovom mestu.</p>' : ''}
            </div>
          `

          marker.bindPopup(popupHtml)
          marker.on('popupopen', () => {
            onReportsViewed?.(group.reports.map((report) => report.id))
          })
        }
        marker.addTo(markersLayer)
      })
    }

    renderMarkers()

    const markerBounds = markersLayer.getBounds()

    if (markerBounds.isValid() && reports.length > 1) {
      map.fitBounds(markerBounds, {
        padding: [32, 32],
        ...MAP_VIEW_ANIMATION,
      })
    } else if (reports.length === 1) {
      map.setView([reports[0].latitude, reports[0].longitude], 11, MAP_VIEW_ANIMATION)
    } else if (selectedDistrictBoundary) {
      map.fitBounds(
        [
          [selectedDistrictBoundary.bounds.south, selectedDistrictBoundary.bounds.west],
          [selectedDistrictBoundary.bounds.north, selectedDistrictBoundary.bounds.east],
        ],
        {
          padding: [24, 24],
          ...MAP_VIEW_ANIMATION,
        },
      )
    }

    const handleZoomChange = () => {
      renderMarkers()
    }

    map.on('zoomend', handleZoomChange)

    return () => {
      map.off('zoomend', handleZoomChange)
    }
  }, [onPlaceGroupSelect, onReportsViewed, reports, selectedDistrict, statusLabels])

  useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    preserveMapViewport(map)
  }, [isPopupExpanded, isFullscreenActive])

  return (
    <div
      ref={shellRef}
      className={`map-shell w-full overflow-hidden shadow-lg print-map ${
        isFullscreenActive
          ? 'h-screen rounded-none'
          : isPopupExpanded
            ? `${EXPANDED_MAP_HEIGHT_CLASS} rounded-lg`
            : `${DEFAULT_MAP_HEIGHT_CLASS} rounded-lg`
      }`}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
