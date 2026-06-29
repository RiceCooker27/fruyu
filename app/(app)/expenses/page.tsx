import { createClient } from '@/lib/supabase/server'
import ExpensesList from '@/components/ExpensesList'

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, materials(name, unit)')
    .order('created_at', { ascending: false })
    .limit(50)

  return <ExpensesList expenses={expenses ?? []} />
}
