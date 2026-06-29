import { createClient } from '@/lib/supabase/server'
import StockView from '@/components/StockView'

export default async function StockPage() {
  const supabase = await createClient()
  const [materialsRes, adjustmentsRes] = await Promise.all([
    supabase.from('materials').select('*').order('name'),
    supabase
      .from('stock_adjustments')
      .select('*, materials(name)')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  return <StockView materials={materialsRes.data ?? []} adjustments={adjustmentsRes.data ?? []} />
}
