import { createClient } from '@/lib/supabase/server'
import NewExpenseForm from '@/components/NewExpenseForm'

export default async function NewExpensePage() {
  const supabase = await createClient()
  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return <NewExpenseForm materials={materials ?? []} />
}
