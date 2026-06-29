import { createClient } from '@/lib/supabase/server'
import ProductsManager from '@/components/ProductsManager'

export default async function ProductsPage() {
  const supabase = await createClient()
  const [productsRes, materialsRes, recipesRes] = await Promise.all([
    supabase.from('products').select('*').order('name'),
    supabase.from('materials').select('*').eq('is_active', true).order('name'),
    supabase.from('recipes').select('*'),
  ])
  return (
    <ProductsManager
      products={productsRes.data ?? []}
      materials={materialsRes.data ?? []}
      recipes={recipesRes.data ?? []}
    />
  )
}
