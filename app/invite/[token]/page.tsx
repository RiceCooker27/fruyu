import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AcceptInvite from '@/components/AcceptInvite'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — redirect to login, come back after
  if (!user) {
    redirect(`/login?redirect=/invite/${token}`)
  }

  // Find invitation
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*, stores(name)')
    .eq('token', token)
    .is('accepted_at', null)
    .single()

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-3">
          <p className="text-2xl">😕</p>
          <p className="font-semibold text-gray-800">Link undangan tidak valid atau sudah dipakai</p>
          <a href="/" className="text-orange-500 text-sm">Kembali ke Dashboard</a>
        </div>
      </div>
    )
  }

  // Already a member of this store?
  const { data: existing } = await supabase
    .from('store_members')
    .select('id')
    .eq('store_id', invitation.store_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    redirect('/')
  }

  const store = invitation.stores as unknown as { name: string }

  return <AcceptInvite token={token} storeName={store.name} invitationId={invitation.id} storeId={invitation.store_id} />
}
