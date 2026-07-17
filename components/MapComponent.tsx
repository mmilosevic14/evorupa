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

function getCoordinateMapLink(latitude: number, longitude: number) {
  const formattedLatitude = latitude.toFixed(5)
  const formattedLongitude = longitude.toFixed(5)
  const coordinateLabel = encodeURIComponent(`${formattedLatitude},${formattedLongitude}`)

  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent || ''
    const isAppleDevice = /iPad|iPhone|iPod|Macintosh/i.test(userAgent)

    if (isAppleDevice) {
      return `maps://?ll=${formattedLatitude},${formattedLongitude}&q=${coordinateLabel}`
    }
  }

  return `geo:${formattedLatitude},${formattedLongitude}?q=${formattedLatitude},${formattedLongitude}`
}

function isMapUsable(map: L.Map) {
  const mapWithInternals = map as L.Map & {
    _loaded?: boolean
    _mapPane?: HTMLElement | null
  }

  if (!mapWithInternals._loaded || !mapWithInternals._mapPane) {
    return false
  }

  try {
    const container = map.getContainer()
    return Boolean(container?.isConnected)
  } catch {
    return false
  }
}

function invalidateMapSize(map: L.Map, delay = 320) {
  const syncSize = () => {
    if (!isMapUsable(map)) {
      return
    }

    map.invalidateSize({ pan: false, debounceMoveend: true })
  }

  requestAnimationFrame(syncSize)
  window.setTimeout(syncSize, delay)
}

function preserveMapViewport(map: L.Map, delay = 320) {
  const center = map.getCenter()
  const zoom = map.getZoom()

  const restoreView = () => {
    if (!isMapUsable(map)) {
      return
    }

    invalidateMapSize(map, 0)
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
    if (!isMapUsable(map)) {
      return
    }

    invalidateMapSize(map, 0)

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

function ensureActiveMarkersVisible(map: L.Map, markersLayer: L.FeatureGroup | null, delay = 320) {
  if (!markersLayer) {
    preserveMapViewport(map, delay)
    return
  }

  const fitMarkersIfNeeded = () => {
    if (!isMapUsable(map)) {
      return
    }

    invalidateMapSize(map, 0)

    const markerBounds = markersLayer.getBounds()

    if (!markerBounds.isValid()) {
      return
    }

    const visibleBounds = map.getBounds().pad(-0.08)
    const markersAreVisible = markersLayer
      .getLayers()
      .every((layer) => layer instanceof L.Marker && visibleBounds.contains(layer.getLatLng()))

    if (markersAreVisible) {
      return
    }

    fitActiveMarkers(map, markersLayer, 0)
  }

  requestAnimationFrame(fitMarkersIfNeeded)
  window.setTimeout(fitMarkersIfNeeded, delay)
}

function ensurePopupVisible(map: L.Map, popup: L.Popup, delay = 320) {
  const panPopupIntoView = () => {
    if (!isMapUsable(map)) {
      return
    }

    invalidateMapSize(map, 0)
    popup.update()

    const popupWithAdjustPan = popup as L.Popup & {
      _adjustPan?: () => void
    }

    popupWithAdjustPan.options.keepInView = true
    popupWithAdjustPan.options.autoPanPaddingTopLeft = L.point(24, 24)
    popupWithAdjustPan.options.autoPanPaddingBottomRight = L.point(24, 140)
    popupWithAdjustPan._adjustPan?.()
  }

  requestAnimationFrame(panPopupIntoView)
  window.setTimeout(panPopupIntoView, delay)
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
  focusedReportId = null,
  focusedReportNonce = 0,
  onPlaceGroupSelect,
  onActiveReportChange,
  onReportsViewed,
  statusLabels,
}: {
  reports?: Report[]
  selectedDistrict?: string | null
  focusedReportId?: string | null
  focusedReportNonce?: number
  onPlaceGroupSelect?: (group: PlaceGroup) => void
  onActiveReportChange?: (reportId: string | null) => void
  onReportsViewed?: (reportIds: string[]) => void
  statusLabels?: Record<string, string>
}) {
  const [isPopupExpanded, setIsPopupExpanded] = useState(false)
  const [isFullscreenActive, setIsFullscreenActive] = useState(false)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.FeatureGroup | null>(null)
  const reportMarkersRef = useRef<Map<string, L.Marker>>(new Map())
  const districtLayerRef = useRef<L.LayerGroup | null>(null)
  const fullscreenButtonRef = useRef<HTMLAnchorElement | null>(null)
  const isFullscreenActiveRef = useRef(false)
  const isSwitchingPopupRef = useRef(false)
  const activePopupRef = useRef<L.Popup | null>(null)
  const pendingViewportActionRef = useRef<'popup-open' | 'popup-close' | null>(null)

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
    reportMarkersRef.current = new Map()
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

    const handlePopupOpen = (event: L.PopupEvent) => {
      activePopupRef.current = event.popup

      if (!isFullscreenActiveRef.current) {
        pendingViewportActionRef.current = 'popup-open'
        setIsPopupExpanded(true)
      } else {
        ensurePopupVisible(map, event.popup, 180)
      }

      isSwitchingPopupRef.current = false
    }

    const handlePopupClose = () => {
      activePopupRef.current = null

      if (isSwitchingPopupRef.current) {
        return
      }

      if (!isFullscreenActiveRef.current) {
        pendingViewportActionRef.current = 'popup-close'
        setIsPopupExpanded(false)
      } else {
        ensureActiveMarkersVisible(map, markersLayerRef.current)
      }
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
      reportMarkersRef.current.clear()
      districtLayerRef.current?.clearLayers()
      districtLayerRef.current = null
      fullscreenButtonRef.current = null
      activePopupRef.current = null
      pendingViewportActionRef.current = null
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
      reportMarkersRef.current.clear()

      const shouldKeepPlaceClusters = Boolean(selectedDistrict) && placeGroups.length > 1
      const shouldShowIndividualReports =
        placeGroups.length <= 1 || (!shouldKeepPlaceClusters && map.getZoom() >= INDIVIDUAL_MARKER_ZOOM)

      if (shouldShowIndividualReports) {
        reports.forEach((report) => {
          const photoUrl = getReportPhotoUrl(report.photo_url)
          const coordinateLink = getCoordinateMapLink(report.latitude, report.longitude)
          const marker = L.marker([report.latitude, report.longitude])
          marker.on('click', () => {
            const mapWithPopup = map as L.Map & { _popup?: L.Popup | null }
            isSwitchingPopupRef.current = Boolean(mapWithPopup._popup?.isOpen())
          })
          marker.bindPopup(`
            <div class="text-sm" style="min-width:260px;max-width:320px;padding-right:1.5rem;">
              <img
                src="${photoUrl}"
                alt="${report.title}"
                style="width:100%;height:128px;object-fit:contain;border-radius:0.5rem;margin-bottom:0.75rem;background:#f3f4f6;"
              />
              <h3 style="font-weight:700;margin-bottom:0.25rem;">${report.title}</h3>
              <p style="font-size:12px;color:#4b5563;margin-bottom:0.5rem;">${report.description.substring(0, 160)}...</p>
              <p style="font-size:12px;margin-bottom:0.25rem;"><strong>Status:</strong> ${statusLabels?.[report.status] ?? report.status}</p>
              <p style="font-size:12px;">
                <strong>Koordinate:</strong>
                <a
                  href="${coordinateLink}"
                  class="leaflet-popup-coordinate-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}</a>
              </p>
            </div>
          `)
          marker.on('popupopen', () => {
            onActiveReportChange?.(report.id)
            onReportsViewed?.([report.id])
          })
          marker.on('popupclose', () => {
            onActiveReportChange?.(null)
          })
          reportMarkersRef.current.set(report.id, marker)
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
            const mapWithPopup = map as L.Map & { _popup?: L.Popup | null }
            isSwitchingPopupRef.current = Boolean(mapWithPopup._popup?.isOpen())
            onActiveReportChange?.(null)
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
                          style="width:100%;height:128px;object-fit:contain;border-radius:0.5rem;margin-bottom:0.5rem;background:#f3f4f6;"
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
            onActiveReportChange?.(null)
            onReportsViewed?.(group.reports.map((report) => report.id))
          })
          marker.on('popupclose', () => {
            onActiveReportChange?.(null)
          })
        }
        marker.addTo(markersLayer)
      })
    }

    renderMarkers()

    const markerBounds = markersLayer.getBounds()

    if (isMapUsable(map) && markerBounds.isValid() && reports.length > 1) {
      map.fitBounds(markerBounds, {
        padding: [32, 32],
        ...MAP_VIEW_ANIMATION,
      })
    } else if (isMapUsable(map) && reports.length === 1) {
      map.setView([reports[0].latitude, reports[0].longitude], 11, MAP_VIEW_ANIMATION)
    } else if (isMapUsable(map) && selectedDistrictBoundary) {
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
  }, [onActiveReportChange, onPlaceGroupSelect, onReportsViewed, reports, selectedDistrict, statusLabels])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !focusedReportId) {
      return
    }

    const openFocusedMarkerPopup = () => {
      const marker = reportMarkersRef.current.get(focusedReportId)

      if (!marker) {
        return
      }

      isSwitchingPopupRef.current = true
      marker.openPopup()
    }

    requestAnimationFrame(openFocusedMarkerPopup)
    const retryAfterFitTimeout = window.setTimeout(openFocusedMarkerPopup, 420)

    return () => {
      window.clearTimeout(retryAfterFitTimeout)
    }
  }, [focusedReportId, focusedReportNonce, reports])

  useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    preserveMapViewport(map)
  }, [isFullscreenActive])

  useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    invalidateMapSize(map)

    if (pendingViewportActionRef.current === 'popup-open' && activePopupRef.current) {
      ensurePopupVisible(map, activePopupRef.current)
      pendingViewportActionRef.current = null
      return
    }

    if (pendingViewportActionRef.current === 'popup-close') {
      ensureActiveMarkersVisible(map, markersLayerRef.current)
      pendingViewportActionRef.current = null
    }
  }, [isPopupExpanded])

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
