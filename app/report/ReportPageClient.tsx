'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { syncUserProfile } from '@/utils/supabase/profile'
import { buildLocationTags, type ReportLocationDetails } from '@/lib/reportLocation'
import { SERBIA_DISTRICT_BOUNDARIES } from '@/lib/serbiaDistricts'

const DEFAULT_REPORT_LOCATION = {
  latitude: 44.0165,
  longitude: 21.0059,
}

type LocationSource = 'default' | 'browser' | 'photo'

const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 1600
const WEBP_QUALITY = 0.82
const DISTRICT_OPTIONS = Array.from(
  new Set(SERBIA_DISTRICT_BOUNDARIES.map((feature) => feature.district)),
).sort((left, right) => left.localeCompare(right, 'sr'))
const REGION_OPTIONS = ['Srbija']

function requestBrowserLocation(
  onSuccess: (coords: { latitude: number; longitude: number }) => void,
  onError: (message: string) => void,
) {
  if (!navigator.geolocation) {
    onError('Pregledač ne podržava geolokaciju. Koristi se podrazumevana lokacija u Srbiji.')
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      })
    },
    (geoError) => {
      console.error('Greška pri preuzimanju lokacije:', geoError)
      onError('Nije moguće preuzeti trenutnu lokaciju. Koristi se podrazumevana lokacija u Srbiji ili GPS iz fotografije ako postoji.')
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    },
  )
}

function getString(view: DataView, start: number, length: number) {
  let result = ''

  for (let index = 0; index < length; index += 1) {
    result += String.fromCharCode(view.getUint8(start + index))
  }

  return result
}

function getExifValue(view: DataView, offset: number, littleEndian: boolean) {
  const type = view.getUint16(offset + 2, littleEndian)
  const count = view.getUint32(offset + 4, littleEndian)
  const valueOffset = offset + 8
  const actualOffset =
    type === 2 && count > 4
      ? view.getUint32(valueOffset, littleEndian) + 12
      : type === 5 && count >= 1
        ? view.getUint32(valueOffset, littleEndian) + 12
        : valueOffset

  if (type === 2) {
    return getString(view, actualOffset, count - 1)
  }

  if (type === 5) {
    const values: number[] = []

    for (let index = 0; index < count; index += 1) {
      const rationalOffset = actualOffset + index * 8
      const numerator = view.getUint32(rationalOffset, littleEndian)
      const denominator = view.getUint32(rationalOffset + 4, littleEndian)

      values.push(denominator === 0 ? 0 : numerator / denominator)
    }

    return values
  }

  return null
}

function convertExifCoordinate(values: number[], ref: string) {
  const [degrees = 0, minutes = 0, seconds = 0] = values
  const decimal = degrees + minutes / 60 + seconds / 3600

  return ref === 'S' || ref === 'W' ? -decimal : decimal
}

async function extractGpsCoordinates(file: File) {
  if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
    return null
  }

  const buffer = await file.arrayBuffer()
  const view = new DataView(buffer)

  if (view.getUint16(0) !== 0xffd8) {
    return null
  }

  let offset = 2

  while (offset < view.byteLength) {
    const marker = view.getUint16(offset)
    offset += 2

    if (marker === 0xffda || marker === 0xffd9) {
      break
    }

    const segmentLength = view.getUint16(offset)

    if (marker === 0xffe1 && getString(view, offset + 2, 4) === 'Exif') {
      const tiffOffset = offset + 8
      const littleEndian = getString(view, tiffOffset, 2) === 'II'
      const firstIfdOffset = view.getUint32(tiffOffset + 4, littleEndian)
      const ifd0Offset = tiffOffset + firstIfdOffset
      const ifd0Entries = view.getUint16(ifd0Offset, littleEndian)

      let gpsIfdPointer = 0

      for (let index = 0; index < ifd0Entries; index += 1) {
        const entryOffset = ifd0Offset + 2 + index * 12
        const tag = view.getUint16(entryOffset, littleEndian)

        if (tag === 0x8825) {
          gpsIfdPointer = view.getUint32(entryOffset + 8, littleEndian)
          break
        }
      }

      if (!gpsIfdPointer) {
        return null
      }

      const gpsIfdOffset = tiffOffset + gpsIfdPointer
      const gpsEntries = view.getUint16(gpsIfdOffset, littleEndian)
      let latitudeRef = ''
      let longitudeRef = ''
      let latitudeValues: number[] | null = null
      let longitudeValues: number[] | null = null

      for (let index = 0; index < gpsEntries; index += 1) {
        const entryOffset = gpsIfdOffset + 2 + index * 12
        const tag = view.getUint16(entryOffset, littleEndian)
        const value = getExifValue(view, entryOffset, littleEndian)

        if (tag === 0x0001 && typeof value === 'string') {
          latitudeRef = value
        }

        if (tag === 0x0002 && Array.isArray(value)) {
          latitudeValues = value
        }

        if (tag === 0x0003 && typeof value === 'string') {
          longitudeRef = value
        }

        if (tag === 0x0004 && Array.isArray(value)) {
          longitudeValues = value
        }
      }

      if (latitudeRef && longitudeRef && latitudeValues && longitudeValues) {
        return {
          latitude: convertExifCoordinate(latitudeValues, latitudeRef),
          longitude: convertExifCoordinate(longitudeValues, longitudeRef),
        }
      }

      return null
    }

    offset += segmentLength
  }

  return null
}

interface FormData {
  title: string
  description: string
  category: string
  latitude: number
  longitude: number
  photo?: File | null
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

async function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Nije moguće prikazati obrađenu sliku.'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Greška pri čitanju slike.'))
    reader.readAsDataURL(blob)
  })
}

async function loadImageFromBlob(blob: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob)
    const image = new window.Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Nije moguće učitati sliku za obradu.'))
    }

    image.src = objectUrl
  })
}

async function readSourceBlob({ file, sourceUrl }: { file?: File; sourceUrl?: string }) {
  if (file) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error('Otpremljena slika je prevelika. Maksimalna veličina je 15MB.')
    }

    return file
  }

  if (sourceUrl?.trim()) {
    const trimmedUrl = sourceUrl.trim()

    if (!isValidHttpUrl(trimmedUrl)) {
      throw new Error('URL slike mora koristiti http ili https protokol.')
    }

    let response: Response

    try {
      response = await fetch(trimmedUrl, {
        cache: 'no-store',
      })
    } catch {
      throw new Error(
        'Nije moguće preuzeti sliku sa URL adrese iz pregledača. Ako sajt blokira pristup, preuzmite sliku ručno i otpremite je kao fajl.',
      )
    }

    if (!response.ok) {
      throw new Error(`Nije moguće preuzeti sliku sa URL adrese. Status: ${response.status}`)
    }

    const contentLengthHeader = response.headers.get('content-length')

    if (contentLengthHeader && Number(contentLengthHeader) > MAX_IMAGE_BYTES) {
      throw new Error('Izvorna slika je prevelika. Maksimalna veličina je 15MB.')
    }

    const blob = await response.blob()

    if (blob.size > MAX_IMAGE_BYTES) {
      throw new Error('Izvorna slika je prevelika. Maksimalna veličina je 15MB.')
    }

    return blob
  }

  throw new Error('Pošaljite sliku kao fajl ili navedite izvorni URL slike.')
}

async function processImageToWebp({ file, sourceUrl }: { file?: File; sourceUrl?: string }) {
  const sourceBlob = await readSourceBlob({ file, sourceUrl })
  const image = await loadImageFromBlob(sourceBlob)
  const dominantDimension = Math.max(image.naturalWidth, image.naturalHeight, 1)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / dominantDimension)
  const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale))
  const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')

  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Pregledač ne podržava obradu slike.')
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight)

  const webpBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Nije moguće obraditi sliku i pretvoriti je u WebP.'))
          return
        }

        resolve(blob)
      },
      'image/webp',
      WEBP_QUALITY,
    )
  })

  return new File([webpBlob], `report-${Date.now()}.webp`, { type: 'image/webp' })
}

const EMPTY_LOCATION_DETAILS: ReportLocationDetails = {
  placeName: '',
  placeType: 'unknown',
  municipality: '',
  district: '',
  region: 'Srbija',
}

export default function ReportPageClient() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'road_damage',
    latitude: DEFAULT_REPORT_LOCATION.latitude,
    longitude: DEFAULT_REPORT_LOCATION.longitude,
    photo: null,
  })
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [sourceImageUrl, setSourceImageUrl] = useState('')
  const [imageProcessing, setImageProcessing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [locationSource, setLocationSource] = useState<LocationSource>('default')
  const [locationDetails, setLocationDetails] = useState<ReportLocationDetails>(EMPTY_LOCATION_DETAILS)
  const [locationDetailsLoading, setLocationDetailsLoading] = useState(false)
  const [locationMessage, setLocationMessage] = useState(
    'Pokušaćemo da preuzmemo vašu trenutnu lokaciju. Ako ne uspe, koristi se podrazumevana lokacija u Srbiji.',
  )
  const router = useRouter()
  const availableRegionOptions = Array.from(
    new Set([...REGION_OPTIONS, locationDetails.region].filter(Boolean)),
  )
  const availableDistrictOptions = Array.from(
    new Set([...DISTRICT_OPTIONS, locationDetails.district].filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right, 'sr'))

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      setUser(authUser)
    }

    checkAuth()

    requestBrowserLocation(
      (coords) => {
        setFormData((prev) => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }))
        setLocationSource('browser')
        setLocationMessage('Koristi se vaša trenutna lokacija.')
      },
      (message) => {
        setLocationSource('default')
        setLocationMessage(message)
      },
    )
  }, [])

  useEffect(() => {
    let ignore = false

    const resolvePlaceDetails = async () => {
      setLocationDetailsLoading(true)

      try {
        const response = await fetch(
          `/api/reverse-geocode?latitude=${formData.latitude}&longitude=${formData.longitude}`,
        )

        if (!response.ok) {
          throw new Error('Neuspešno preuzimanje mesta prema koordinatama.')
        }

        const data = (await response.json()) as ReportLocationDetails

        if (!ignore) {
          setLocationDetails({
            placeName: data.placeName ?? '',
            placeType: data.placeType ?? 'unknown',
            municipality: data.municipality ?? '',
            district: data.district ?? '',
            region: data.region ?? 'Srbija',
          })
        }
      } catch (locationError) {
        console.error('Greška pri preuzimanju mesta:', locationError)

        if (!ignore) {
          setLocationDetails((prev) => ({
            ...prev,
            region: prev.region || 'Srbija',
          }))
        }
      } finally {
        if (!ignore) {
          setLocationDetailsLoading(false)
        }
      }
    }

    resolvePlaceDetails()

    return () => {
      ignore = true
    }
  }, [formData.latitude, formData.longitude])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setError('')
      setImageProcessing(true)
      setSourceImageUrl('')

      const photoCoordinates = await extractGpsCoordinates(file)

      try {
        const processedFile = await processImageToWebp({ file })
        const preview = await readBlobAsDataUrl(processedFile)
        setFormData((prev) => ({ ...prev, photo: processedFile }))
        setPhotoPreview(preview)
      } catch (imageError) {
        setFormData((prev) => ({ ...prev, photo: null }))
        setPhotoPreview('')
        setError(imageError instanceof Error ? imageError.message : 'Greška pri obradi slike.')
      } finally {
        setImageProcessing(false)
      }

      if (photoCoordinates && locationSource !== 'browser') {
        setFormData((prev) => ({
          ...prev,
          latitude: photoCoordinates.latitude,
          longitude: photoCoordinates.longitude,
        }))
        setLocationSource('photo')
        setLocationMessage('Lokacija je preuzeta iz GPS podataka fotografije.')
      } else if (!photoCoordinates && locationSource !== 'browser') {
        setLocationMessage(
          'Fotografija nema GPS podatke. Koristi se podrazumevana lokacija u Srbiji dok ne odobrite geolokaciju.',
        )
      }
    }
  }

  const handleSourceImageProcess = async () => {
    if (!sourceImageUrl.trim()) {
      setError('Unesite URL slike pre obrade.')
      return
    }

    setError('')
    setImageProcessing(true)

    try {
      const processedFile = await processImageToWebp({ sourceUrl: sourceImageUrl.trim() })
      const preview = await readBlobAsDataUrl(processedFile)
      setFormData((prev) => ({ ...prev, photo: processedFile }))
      setPhotoPreview(preview)
    } catch (imageError) {
      setFormData((prev) => ({ ...prev, photo: null }))
      setPhotoPreview('')
      setError(imageError instanceof Error ? imageError.message : 'Greška pri obradi slike sa URL adrese.')
    } finally {
      setImageProcessing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      if (!user) {
        setError('Morate biti prijavljeni da prijavite problem')
        setLoading(false)
        return
      }

      await syncUserProfile(supabase, user)

      let processedPhoto = formData.photo

      if (!processedPhoto && sourceImageUrl.trim()) {
        processedPhoto = await processImageToWebp({ sourceUrl: sourceImageUrl.trim() })
      }

      let photoUrl: string | null = null

      if (processedPhoto) {
        const fileName = `${Date.now()}.webp`
        const filePath = `report-photos/${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('report-photos')
          .upload(filePath, processedPhoto, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/webp',
          })

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('report-photos')
          .getPublicUrl(filePath)

        photoUrl = data.publicUrl
      }

      const { error: dbError } = await supabase.from('reports').insert([
        {
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          latitude: formData.latitude,
          longitude: formData.longitude,
          photo_url: photoUrl,
          status: 'pending',
          priority: 'medium',
          tags: buildLocationTags(locationDetails),
          upvotes: 0,
          views: 0,
          resolved_at: null,
        },
      ])

      if (dbError) throw dbError

      setSuccess(true)
      setTimeout(() => {
        router.push('/map')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Greška pri slanju izveštaja')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">Morate biti prijavljeni da prijavite problem</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="btn-primary"
            >
              Prijavite se
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-2">Prijavi problem</h1>
        <p className="text-gray-600 mb-8">Pomoć nam da poboljšamo infrastrukturu!</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              Problem je uspešno prijavljeno! Redirekcija na mapu...
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Naslov problema *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="npr. Rupa na putu"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Kategorija *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="road_damage">Oštećenje puta</option>
              <option value="pothole">Rupa na putu</option>
              <option value="traffic_sign">Problem sa saobraćajnom znakom</option>
              <option value="lighting">Problem sa osvetljenjem</option>
              <option value="sidewalk">Problem sa pločnikom</option>
              <option value="other">Ostalo</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Opis problema *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detaljno opiši problem..."
              rows={4}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Fotografija problema</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-3">
                Možete otpremiti sliku ili uneti izvorni URL. Slika se automatski pretvara u WebP pre čuvanja u bucket-u.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full"
              />
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Izvorni URL slike</label>
                  <input
                    type="url"
                    value={sourceImageUrl}
                    onChange={(e) => setSourceImageUrl(e.target.value)}
                    placeholder="https://primer.rs/slika.jpg"
                    className="w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSourceImageProcess}
                  disabled={imageProcessing || !sourceImageUrl.trim()}
                  className={`px-4 py-2 rounded-lg font-medium text-white ${
                    imageProcessing || !sourceImageUrl.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-secondary hover:bg-secondary-dark'
                  }`}
                >
                  {imageProcessing ? 'Obrada...' : 'Preuzmi i pretvori u WebP'}
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Ako sajt sa slike blokira direktno preuzimanje iz pregledača, preuzmite sliku ručno i otpremite je kao fajl.
              </p>
              {photoPreview && (
                <div className="relative mt-4 h-48 overflow-hidden rounded-lg">
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
              {formData.photo && (
                <p className="mt-3 text-sm text-green-700">
                  Slika je pripremljena za upload kao <strong>WebP</strong>.
                </p>
              )}
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Lokacija:</strong> {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
            </p>
            <p className="mt-2 text-sm text-gray-600">{locationMessage}</p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Mesto / naselje</label>
                <input
                  type="text"
                  value={locationDetails.placeName}
                  onChange={(e) =>
                    setLocationDetails((prev) => ({ ...prev, placeName: e.target.value }))
                  }
                  placeholder={locationDetailsLoading ? 'Prepoznavanje mesta...' : 'npr. Kraljevo'}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Opština / grad</label>
                <input
                  type="text"
                  value={locationDetails.municipality}
                  onChange={(e) =>
                    setLocationDetails((prev) => ({ ...prev, municipality: e.target.value }))
                  }
                  placeholder="npr. Kraljevo"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Okrug</label>
                <select
                  value={locationDetails.district}
                  onChange={(e) =>
                    setLocationDetails((prev) => ({ ...prev, district: e.target.value }))
                  }
                  className="w-full"
                >
                  <option value="">Izaberite okrug</option>
                  {availableDistrictOptions.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Region</label>
                <select
                  value={locationDetails.region}
                  onChange={(e) =>
                    setLocationDetails((prev) => ({ ...prev, region: e.target.value }))
                  }
                  className="w-full"
                >
                  {availableRegionOptions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {locationDetails.placeType && locationDetails.placeType !== 'unknown' && (
              <p className="mt-3 text-sm text-gray-600">
                Prepoznat tip mesta: <strong>{locationDetails.placeType}</strong>
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setLocationMessage('Ponovo pokušavamo da preuzmemo trenutnu lokaciju...')

                requestBrowserLocation(
                  (coords) => {
                    setFormData((prev) => ({
                      ...prev,
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                    }))
                    setLocationSource('browser')
                    setLocationMessage('Koristi se vaša trenutna lokacija.')
                  },
                  (message) => {
                    setLocationMessage(message)
                  },
                )
              }}
              className="mt-3 text-sm font-medium text-primary hover:underline"
            >
              Pokušaj ponovo sa trenutnom lokacijom
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-3 rounded-lg font-medium text-white transition-colors ${
              loading || imageProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            {loading ? 'Slanje...' : imageProcessing ? 'Obrada slike...' : 'Pošalji izveštaj'}
          </button>
        </form>
      </div>
    </div>
  )
}