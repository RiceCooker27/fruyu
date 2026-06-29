'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, UserPlus, Trash2, Link } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import { formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'

interface Props {
  store: { id: string; name: string; owner_id: string }
  members: { id: string; role: string; user_id: string; created_at: string }[]
  invitations: { id: string; token: string; created_at: string; accepted_at: string | null }[]
  isOwner: boolean
  currentUserId: string
}

export default function MembersManager({ store, members, invitations, isOwner, currentUserId }: Props) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newInviteLink, setNewInviteLink] = useState<string | null>(null)

  async function createInvite() {
    setCreating(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('invitations')
      .insert({ store_id: store.id })
      .select('token')
      .single()

    if (data) {
      const link = `${window.location.origin}/invite/${data.token}`
      setNewInviteLink(link)
    }
    setCreating(false)
    router.refresh()
  }

  async function deleteInvite(id: string) {
    const supabase = createClient()
    await supabase.from('invitations').delete().eq('id', id)
    router.refresh()
  }

  async function removeMember(memberId: string) {
    if (!confirm('Hapus anggota ini?')) return
    const supabase = createClient()
    await supabase.from('store_members').delete().eq('id', memberId)
    router.refresh()
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inviteLink = newInviteLink ?? (invitations[0] ? `${window.location.origin}/invite/${invitations[0].token}` : null)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Anggota Tim</h1>

      {/* Current members */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Anggota ({members.length})</h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {m.user_id === currentUserId ? 'Kamu' : `Anggota`}
                </p>
                <p className="text-xs text-gray-400">
                  {m.role === 'owner' ? 'Pemilik' : 'Anggota'} · Bergabung {formatDate(m.created_at)}
                </p>
              </div>
              {isOwner && m.user_id !== currentUserId && (
                <button
                  onClick={() => removeMember(m.id)}
                  className="text-gray-300 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite section (owner only) */}
      {isOwner && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Undang Anggota Baru</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
            <p className="text-sm text-gray-600">
              Buat link undangan dan kirim ke teman kamu via WhatsApp. Siapapun yang punya link bisa bergabung ke toko ini.
            </p>

            {inviteLink ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-600 flex-1 truncate">{inviteLink}</p>
                  <button
                    onClick={() => copyLink(inviteLink)}
                    className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-600 flex-shrink-0"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Tersalin!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-gray-400">Link aktif sampai dipakai atau dihapus.</p>
              </div>
            ) : null}

            <button
              onClick={createInvite}
              disabled={creating}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {creating ? 'Membuat link...' : 'Buat Link Undangan Baru'}
            </button>

            {/* List pending invites */}
            {invitations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-50">
                <p className="text-xs font-medium text-gray-500">Link undangan aktif:</p>
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate">...{inv.token.slice(-8)}</span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span>{formatDate(inv.created_at)}</span>
                      <button onClick={() => deleteInvite(inv.id)} className="text-gray-300 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
