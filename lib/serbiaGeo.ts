import type { ReportLocationDetails } from '@/lib/reportLocation'

export interface SerbiaSettlement {
  name: string
  municipality: string
  district: string
  region: string
  placeType: string
  latitude: number
  longitude: number
}

export const EMBEDDED_SERBIA_SETTLEMENTS: SerbiaSettlement[] = [
  { name: 'Beograd', municipality: 'Beograd', district: 'Grad Beograd', region: 'Srbija', placeType: 'city', latitude: 44.8176, longitude: 20.4633 },
  { name: 'Novi Sad', municipality: 'Novi Sad', district: 'Južnobački upravni okrug', region: 'Srbija', placeType: 'city', latitude: 45.2671, longitude: 19.8335 },
  { name: 'Niš', municipality: 'Niš', district: 'Nišavski upravni okrug', region: 'Srbija', placeType: 'city', latitude: 43.3209, longitude: 21.8958 },
  { name: 'Kragujevac', municipality: 'Kragujevac', district: 'Šumadijski upravni okrug', region: 'Srbija', placeType: 'city', latitude: 44.0128, longitude: 20.9114 },
  { name: 'Subotica', municipality: 'Subotica', district: 'Severnobački upravni okrug', region: 'Srbija', placeType: 'city', latitude: 46.1, longitude: 19.6667 },
  { name: 'Zrenjanin', municipality: 'Zrenjanin', district: 'Srednjobanatski upravni okrug', region: 'Srbija', placeType: 'city', latitude: 45.3836, longitude: 20.3819 },
  { name: 'Pančevo', municipality: 'Pančevo', district: 'Južnobanatski upravni okrug', region: 'Srbija', placeType: 'city', latitude: 44.8718, longitude: 20.6413 },
  { name: 'Sombor', municipality: 'Sombor', district: 'Zapadnobački upravni okrug', region: 'Srbija', placeType: 'city', latitude: 45.7742, longitude: 19.1122 },
  { name: 'Kraljevo', municipality: 'Kraljevo', district: 'Raški upravni okrug', region: 'Srbija', placeType: 'city', latitude: 43.7258, longitude: 20.6894 },
  { name: 'Čačak', municipality: 'Čačak', district: 'Moravički upravni okrug', region: 'Srbija', placeType: 'city', latitude: 43.8914, longitude: 20.3497 },
  { name: 'Užice', municipality: 'Užice', district: 'Zlatiborski upravni okrug', region: 'Srbija', placeType: 'city', latitude: 43.8556, longitude: 19.8425 },
  { name: 'Valjevo', municipality: 'Valjevo', district: 'Kolubarski upravni okrug', region: 'Srbija', placeType: 'city', latitude: 44.2751, longitude: 19.8982 },
  { name: 'Smederevo', municipality: 'Smederevo', district: 'Podunavski upravni okrug', region: 'Srbija', placeType: 'city', latitude: 44.6644, longitude: 20.9276 },
  { name: 'Požarevac', municipality: 'Požarevac', district: 'Braničevski upravni okrug', region: 'Srbija', placeType: 'city', latitude: 44.6213, longitude: 21.1878 },
  { name: 'Pirot', municipality: 'Pirot', district: 'Pirotski upravni okrug', region: 'Srbija', placeType: 'city', latitude: 43.1531, longitude: 22.5861 },
  { name: 'Vranje', municipality: 'Vranje', district: 'Pčinjski upravni okrug', region: 'Srbija', placeType: 'city', latitude: 42.5514, longitude: 21.9003 },
  { name: 'Zlatibor', municipality: 'Čajetina', district: 'Zlatiborski upravni okrug', region: 'Srbija', placeType: 'town', latitude: 43.7297, longitude: 19.699 },
  { name: 'Vrnjačka Banja', municipality: 'Vrnjačka Banja', district: 'Raški upravni okrug', region: 'Srbija', placeType: 'town', latitude: 43.6217, longitude: 20.8968 },
  { name: 'Aranđelovac', municipality: 'Aranđelovac', district: 'Šumadijski upravni okrug', region: 'Srbija', placeType: 'town', latitude: 44.3069, longitude: 20.5603 },
  { name: 'Bajina Bašta', municipality: 'Bajina Bašta', district: 'Zlatiborski upravni okrug', region: 'Srbija', placeType: 'town', latitude: 43.9708, longitude: 19.5675 },
  { name: 'Guča', municipality: 'Lučani', district: 'Moravički upravni okrug', region: 'Srbija', placeType: 'village', latitude: 43.7762, longitude: 20.2253 },
  { name: 'Mokra Gora', municipality: 'Čajetina', district: 'Zlatiborski upravni okrug', region: 'Srbija', placeType: 'village', latitude: 43.7944, longitude: 19.5226 },
  { name: 'Tršić', municipality: 'Loznica', district: 'Mačvanski upravni okrug', region: 'Srbija', placeType: 'village', latitude: 44.4983, longitude: 19.2818 },
  { name: 'Sirogojno', municipality: 'Čajetina', district: 'Zlatiborski upravni okrug', region: 'Srbija', placeType: 'village', latitude: 43.6818, longitude: 19.8936 },
  { name: 'Topola', municipality: 'Topola', district: 'Šumadijski upravni okrug', region: 'Srbija', placeType: 'town', latitude: 44.2525, longitude: 20.6775 },
]

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

export function getDistanceInKilometers(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const earthRadiusKm = 6371
  const deltaLatitude = toRadians(latitudeB - latitudeA)
  const deltaLongitude = toRadians(longitudeB - longitudeA)
  const latitudeAInRadians = toRadians(latitudeA)
  const latitudeBInRadians = toRadians(latitudeB)

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(latitudeAInRadians) * Math.cos(latitudeBInRadians) * Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2)

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function findNearestSettlement(
  latitude: number,
  longitude: number,
  settlements: SerbiaSettlement[],
  maxDistanceKilometers = 25,
): SerbiaSettlement | null {
  let closestSettlement: SerbiaSettlement | null = null
  let closestDistance = Number.POSITIVE_INFINITY

  settlements.forEach((settlement) => {
    const distance = getDistanceInKilometers(
      latitude,
      longitude,
      settlement.latitude,
      settlement.longitude,
    )

    if (distance < closestDistance) {
      closestDistance = distance
      closestSettlement = settlement
    }
  })

  if (!closestSettlement || closestDistance > maxDistanceKilometers) {
    return null
  }

  return closestSettlement
}

export function settlementToLocationDetails(settlement: SerbiaSettlement): ReportLocationDetails {
  return {
    placeName: settlement.name,
    placeType: settlement.placeType,
    municipality: settlement.municipality,
    district: settlement.district,
    region: settlement.region,
  }
}