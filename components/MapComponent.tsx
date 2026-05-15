'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useState } from 'react'

// Fix Leaflet marker icons
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface Report {
  id: string
  title: string
  description: string
  latitude: number
  longitude: number
  category: string
  status: string
  photo_url?: string
}

export default function MapComponent({ reports = [] }: { reports?: Report[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Mapa se učitava...</span>
      </div>
    )
  }

  // Default center to Serbia (Belgrade area)
  const center: [number, number] = [44.8176, 20.4554]

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg">
      <MapContainer center={center} zoom={7} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold text-sm">{report.title}</h3>
                <p className="text-gray-600 text-xs">{report.description.substring(0, 100)}...</p>
                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mt-2">
                  {report.category}
                </span>
                <span className={`inline-block ml-2 px-2 py-1 rounded text-xs ${
                  report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {report.status}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
