'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { syncUserProfile } from '@/utils/supabase/profile'

export default function LoginPageClient() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEmailLogin, setShowEmailLogin] = useState(false)

  useEffect(() => {
    const callbackError = searchParams.get('error')

    if (callbackError) {
      setError(callbackError)
    }
  }, [searchParams])

  const getAuthRedirectUrl = () => {
    return `${window.location.origin}/auth/callback?next=/map`
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else if (data) {
        if (data.user) {
          await syncUserProfile(supabase, data.user).catch(() => undefined)
        }
        window.location.href = '/map'
      }
    } catch {
      setError('Greška pri login-u')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
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

  const toggleEmailLogin = () => {
    setError('')
    setShowEmailLogin((current) => !current)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Uloguj se
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
            <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.5 3.5 14.4 2.6 12 2.6 6.9 2.6 2.8 6.7 2.8 11.8S6.9 21 12 21c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12Z" />
            <path fill="#34A853" d="M3.7 7.3 6.9 9.6C7.8 7.2 9.7 5.6 12 5.6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.5 3.5 14.4 2.6 12 2.6c-3.6 0-6.8 2-8.3 4.7Z" />
            <path fill="#FBBC05" d="M12 21c2.3 0 4.4-.8 5.9-2.3l-2.7-2.2c-.8.6-1.8 1-3.2 1-3.8 0-5.1-2.6-5.4-3.8l-3.2 2.4C4.8 18.9 8.1 21 12 21Z" />
            <path fill="#4285F4" d="M21.2 13.7c0-.5-.1-.9-.1-1.3H12v3.9h5.4c-.3 1.2-1 2.1-2 2.8l2.7 2.2c1.6-1.5 3.1-4.2 3.1-7.6Z" />
          </svg>
          Nastavi sa Google
        </button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={toggleEmailLogin}
            className="text-sm font-medium text-gray-600 transition hover:text-primary"
          >
            {showEmailLogin ? 'Sakrij email prijavu' : 'Use an email'}
          </button>
          <p className="mt-1 text-xs text-gray-500">Samo za administratore</p>
        </div>

        {showEmailLogin && (
          <>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs uppercase tracking-wide text-gray-500">admin login</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <form onSubmit={handleLogin}>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tvoja lozinka"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-medium py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
              >
                {loading ? 'Učitavanje...' : 'Uloguj se email-om'}
              </button>
            </form>
          </>
        )}

        {showEmailLogin && (
          <div className="mt-4 text-center text-gray-600">
            Nemaš nalog?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Registruj se
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}