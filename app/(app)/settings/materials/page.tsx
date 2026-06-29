import { createClient } from '@/lib/supabase/server'
import MaterialsManager from '@/components/MaterialsManager'

export default async function MaterialsPage() {
  const supabase = await createClient()
  const { data: materials } = await supabase.from('materials').select('*').order('name')
  return <MaterialsManager materials={materials ?? []} />
}
