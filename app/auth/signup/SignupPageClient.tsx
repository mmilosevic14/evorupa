'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { syncUserProfile } from '@/utils/supabase/profile'

export default function SignupPageClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const getAuthRedirectUrl = () => {
    return `${window.location.origin}/auth/callback?next=/map`
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setError(error.message)
      } else if (data.user) {
        if (data.session) {
          await syncUserProfile(supabase, data.user, { fullName })
        }
        setSuccess(true)
      }
    } catch {
      setError('Greška pri registraciji')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthRedirectUrl(),
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch {
      setError('Greška pri pokretanju Google prijave')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Uspešno!</h2>
          <p className="text-gray-600 mb-6">
            Proverite vašu email adresu za verifikacijski link.
          </p>
          <Link
            href="/auth/login"
            className="bg-primary text-white font-medium py-2 px-4 rounded-lg hover:bg-primary-dark transition"
          >
            Nazad na login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Registruj se
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Puno ime
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Tvoje ime i prezime"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="tvoj@email.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Lozinka
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Najmanje 6 karaktera"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-medium py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
          >
            {loading ? 'Učitavanje...' : 'Registruj se'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs uppercase tracking-wide text-gray-500">ili</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Nastavi sa Google
        </button>

        <div className="mt-4 text-center text-gray-600">
          Već imas nalog?{' '}
          <Link href="/auth/login" className="text-primary hover:underline">
            Uloguj se
          </Link>
        </div>
      </div>
    </div>
  )
}