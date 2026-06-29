'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  token: string
  storeName: string
  invitationId: string
  storeId: string
}

export default function AcceptInvite({ storeName, invitationId, storeId }: Props) {
  const router = useRouter()
  const [joining, setJoining] = useState(false)

  async function acceptInvite() {
    setJoining(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Remove from any existing store first (user can only be in one store)
    await supabase.from('store_members').delete().eq('user_id', user.id)

    // Join new store
    await supabase.from('store_members').insert({
      store_id: storeId,
      user_id: user.id,
      role: 'member',
    })

    // Mark invite as accepted
    await supabase.from('invitations').update({ accepted_at: new Date().toISOString() }).eq('id', invitationId)

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="bg-orange-500 rounded-xl p-3">
            <ShoppingBag className="text-white w-8 h-8" />
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-sm">Kamu diundang untuk bergabung ke</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{storeName}</p>
        </div>
        <p className="text-sm text-gray-500">
          Setelah bergabung, kamu bisa lihat dan catat penjualan, stok, dan pengeluaran bersama pemilik toko.
        </p>
        <button
          onClick={acceptInvite}
          disabled={joining}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white rounded-xl py-3 font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors"
        >
          <Check className="w-4 h-4" />
          {joining ? 'Bergabung...' : 'Bergabung ke Toko'}
        </button>
      </div>
    </div>
  )
}
