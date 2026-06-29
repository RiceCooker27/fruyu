import { createClient } from '@/lib/supabase/server'
import ReportsView from '@/components/ReportsView'
import { todayWIB } from '@/lib/format'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; range?: string }>
}) {
  const params = await searchParams
  const today = todayWIB()

  let from = params.from ?? today.start
  let to = params.to ?? today.end

  const supabase = await createClient()

  const [salesRes, expensesRes, saleItemsRes] = await Promise.all([
    supabase
      .from('sales')
      .select('total, discount_amount, subtotal, created_at')
      .eq('status', 'completed')
      .gte('created_at', from)
      .lte('created_at', to),
    supabase
      .from('expenses')
      .select('amount, description, material_id, created_at')
      .gte('created_at', from)
      .lte('created_at', to),
    supabase
      .from('sale_items')
      .select('quantity, line_total, products(name)')
      .gte('created_at', from)
      .lte('created_at', to),
  ])

  // Best sellers: aggregate by product
  const productSales: Record<string, { name: string; units: number; revenue: number }> = {}
  for (const item of saleItemsRes.data ?? []) {
    const name = (item.products as unknown as { name: string })?.name ?? 'Unknown'
    if (!productSales[name]) productSales[name] = { name, units: 0, revenue: 0 }
    productSales[name].units += item.quantity
    productSales[name].revenue += item.line_total
  }
  const bestSellers = Object.values(productSales).sort((a, b) => b.units - a.units)

  const totalRevenue = (salesRes.data ?? []).reduce((s, r) => s + r.total, 0)
  const totalDiscount = (salesRes.data ?? []).reduce((s, r) => s + r.discount_amount, 0)
  const totalExpenses = (expensesRes.data ?? []).reduce((s, r) => s + r.amount, 0)
  const materialExpenses = (expensesRes.data ?? []).filter((e) => e.material_id).reduce((s, r) => s + r.amount, 0)

  return (
    <ReportsView
      from={from}
      to={to}
      totalRevenue={totalRevenue}
      totalDiscount={totalDiscount}
      totalExpenses={totalExpenses}
      materialExpenses={materialExpenses}
      bestSellers={bestSellers}
      sales={salesRes.data ?? []}
      expenses={expensesRes.data ?? []}
    />
  )
}
