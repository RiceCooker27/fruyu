import { createClient } from '@/lib/supabase/server'
import PromosManager from '@/components/PromosManager'

export default async function PromosPage() {
  const supabase = await createClient()
  const { data: promos } = await supabase.from('promos').select('*').order('name')
  return <PromosManager promos={promos ?? []} />
}
