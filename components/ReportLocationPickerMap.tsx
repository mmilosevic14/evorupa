'use client'

import L from 'leaflet'
import { useEffect, useRef } from 'react'

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" aria-label="OpenStreetMap">OSM</a>'

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as never as { _getIconUrl?: unknown })._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

export default function ReportLocationPickerMap({
  latitude,
  longitude,
  onPick,
}: {
  latitude: number
  longitude: number
  onPick: (coords: { latitude: number; longitude: number }) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onPickRef = useRef(onPick)

  useEffect(() => {
    onPickRef.current = onPick
  }, [onPick])

  useEffect(() => {
    const container = containerRef.current

    if (!container || mapRef.current) {
      return
    }

    const map = L.map(container, {
      center: [latitude, longitude],
      zoom: 13,
      attributionControl: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
      fadeAnimation: false,
    })

    L.control.attribution({ prefix: false }).addTo(map)
    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      updateWhenIdle: true,
      keepBuffer: 2,
    }).addTo(map)

    const marker = L.marker([latitude, longitude], {
      draggable: true,
    }).addTo(map)

    const handlePick = (nextLatitude: number, nextLongitude: number) => {
      onPickRef.current({ latitude: nextLatitude, longitude: nextLongitude })
    }

    map.on('click', (event) => {
      const nextLatitude = Number(event.latlng.lat.toFixed(6))
      const nextLongitude = Number(event.latlng.lng.toFixed(6))
      marker.setLatLng([nextLatitude, nextLongitude])
      handlePick(nextLatitude, nextLongitude)
    })

    marker.on('dragend', () => {
      const nextPosition = marker.getLatLng()
      handlePick(Number(nextPosition.lat.toFixed(6)), Number(nextPosition.lng.toFixed(6)))
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      markerRef.current = null
      mapRef.current = null
      map.remove()
    }
  }, [latitude, longitude])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current

    if (!map || !marker) {
      return
    }

    marker.setLatLng([latitude, longitude])
    map.setView([latitude, longitude], Math.max(map.getZoom(), 13), {
      animate: false,
    })
    map.invalidateSize({ pan: false })
  }, [latitude, longitude])

  return <div ref={containerRef} className="h-72 w-full overflow-hidden rounded-xl border border-blue-200" />
}