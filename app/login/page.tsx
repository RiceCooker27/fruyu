'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useRouter } from 'next/navigation'

function LoginContent() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'
  const router = useRouter()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function signInWithGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email atau password salah')
      } else {
        router.push(redirectTo)
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push(redirectTo)
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm flex flex-col gap-5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 rounded-xl p-2">
            <ShoppingBag className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fruyu</h1>
            <p className="text-xs text-gray-500">Business Management for F&B</p>
          </div>
        </div>

        {/* Tab login / register */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Masuk
          </button>
          <button
            onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Daftar
          </button>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
              placeholder="email@kamu.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
              placeholder="minimal 6 karakter"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">atau</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Google */}
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-2.5 px-4 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Masuk dengan Google
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
