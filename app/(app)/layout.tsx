import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppNav from '@/components/AppNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppNav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  )
}
