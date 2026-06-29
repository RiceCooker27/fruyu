import { createClient } from '@/lib/supabase/server'
import NewSaleForm from '@/components/NewSaleForm'

export default async function NewSalePage() {
  const supabase = await createClient()
  const [productsRes, promosRes, recipesRes] = await Promise.all([
    supabase.from('products').select('*').eq('is_active', true).order('name'),
    supabase.from('promos').select('*').eq('is_active', true).order('name'),
    supabase.from('recipes').select('*, materials(name, unit, current_stock)').order('product_id'),
  ])

  return (
    <NewSaleForm
      products={productsRes.data ?? []}
      promos={promosRes.data ?? []}
      recipes={recipesRes.data ?? []}
    />
  )
}
