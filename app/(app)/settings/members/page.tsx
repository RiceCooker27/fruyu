import { createClient } from '@/lib/supabase/server'
import MembersManager from '@/components/MembersManager'
import { redirect } from 'next/navigation'

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get store
  const { data: member } = await supabase
    .from('store_members')
    .select('store_id, role, stores(id, name, owner_id)')
    .eq('user_id', user!.id)
    .single()

  if (!member) redirect('/')

  const store = member.stores as unknown as { id: string; name: string; owner_id: string }
  const isOwner = store.owner_id === user!.id

  // Get all members
  const { data: members } = await supabase
    .from('store_members')
    .select('id, role, user_id, created_at')
    .eq('store_id', store.id)

  // Get active invitations
  const { data: invitations } = await supabase
    .from('invitations')
    .select('id, token, created_at, accepted_at')
    .eq('store_id', store.id)
    .is('accepted_at', null)
    .order('created_at', { ascending: false })

  return (
    <MembersManager
      store={store}
      members={members ?? []}
      invitations={invitations ?? []}
      isOwner={isOwner}
      currentUserId={user!.id}
    />
  )
}
