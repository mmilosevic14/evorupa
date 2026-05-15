'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface FormData {
  title: string
  description: string
  category: string
  latitude: number
  longitude: number
  photo?: File | null
}

export default function ReportPage() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'road_damage',
    latitude: 0,
    longitude: 0,
    photo: null,
  })
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  // Get user location on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      setUser(authUser)
    }

    checkAuth()

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }))
        },
        (error) => console.error('Greška pri preuzimanju lokacije:', error)
      )
    }
  }, [supabase])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, photo: file })

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!user) {
        setError('Morate biti prijavljeni da prijavite problem')
        setLoading(false)
        return
      }

      let photoUrl = null

      // Upload photo if provided
      if (formData.photo) {
        const fileExt = formData.photo.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `report-photos/${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('report-photos')
          .upload(filePath, formData.photo, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data } = supabase.storage
          .from('report-photos')
          .getPublicUrl(filePath)

        photoUrl = data.publicUrl
      }

      // Save report to database
      const { data, error: dbError } = await supabase.from('reports').insert([
        {
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          latitude: formData.latitude,
          longitude: formData.longitude,
          photo_url: photoUrl,
          status: 'pending',
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
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full"
              />
              {photoPreview && (
                <div className="mt-4">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Lokacija:</strong> {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-3 rounded-lg font-medium text-white transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-red-700'
            }`}
          >
            {loading ? 'Slanje...' : 'Pošalji izveštaj'}
          </button>
        </form>
      </div>
    </div>
  )
}


          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Opis problema</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detaljno opiši problem..."
              rows={4}
              required
            ></textarea>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Fotografija</label>
            <input type="file" accept="image/*" className="border border-gray-300 rounded-lg w-full p-2" />
          </div>

          <button type="submit" className="btn-primary w-full">
            Pošalji izveštaj
          </button>
        </form>
      </div>
    </div>
  )
}
