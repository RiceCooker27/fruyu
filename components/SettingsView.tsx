'use client'

import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'
import Link from 'next/link'

export default function SettingsView({ userEmail }: { userEmail: string }) {
  const { lang, setLang } = useLang()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">{t(lang, 'settings')}</h1>

      {/* Language */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h2 className="font-semibold text-gray-800">{t(lang, 'language')}</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setLang('id')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${lang === 'id' ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Bahasa Indonesia
          </button>
          <button
            onClick={() => setLang('en')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${lang === 'en' ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            English
          </button>
        </div>
      </div>

      {/* Manage */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        <Link href="/settings/products" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
          <span className="text-sm font-medium text-gray-700">{t(lang, 'products')}</span>
          <span className="text-gray-400 text-sm">›</span>
        </Link>
        <Link href="/settings/materials" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
          <span className="text-sm font-medium text-gray-700">{t(lang, 'materials')}</span>
          <span className="text-gray-400 text-sm">›</span>
        </Link>
        <Link href="/settings/promos" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
          <span className="text-sm font-medium text-gray-700">{t(lang, 'promos')}</span>
          <span className="text-gray-400 text-sm">›</span>
        </Link>
        <Link href="/settings/members" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
          <span className="text-sm font-medium text-gray-700">Anggota Tim</span>
          <span className="text-gray-400 text-sm">›</span>
        </Link>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <p className="text-sm text-gray-500">{userEmail}</p>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-red-500 text-sm font-medium hover:text-red-700"
        >
          <LogOut className="w-4 h-4" />
          {t(lang, 'signOut')}
        </button>
      </div>
    </div>
  )
}
