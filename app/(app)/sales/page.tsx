import { createClient } from '@/lib/supabase/server'
import SalesList from '@/components/SalesList'

export default async function SalesPage() {
  const supabase = await createClient()
  const { data: sales } = await supabase
    .from('sales')
    .select('*, promos(name), sale_items(*, products(name))')
    .order('created_at', { ascending: false })
    .limit(50)

  return <SalesList sales={sales ?? []} />
}
