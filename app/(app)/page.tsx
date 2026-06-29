import { createClient } from '@/lib/supabase/server'
import Dashboard from '@/components/Dashboard'

export default async function HomePage() {
  const supabase = await createClient()

  // Get today's range in WIB
  const now = new Date()
  const wib = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const todayStart = `${wib}T00:00:00+07:00`
  const todayEnd = `${wib}T23:59:59+07:00`

  const [salesRes, expensesRes, materialsRes, recentSalesRes, recentExpensesRes] =
    await Promise.all([
      supabase
        .from('sales')
        .select('total, discount_amount')
        .eq('status', 'completed')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd),
      supabase
        .from('expenses')
        .select('amount')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd),
      supabase
        .from('materials')
        .select('*')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('sales')
        .select('id, created_at, total, status, promos(name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('expenses')
        .select('id, created_at, description, amount')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  const todayRevenue = (salesRes.data ?? []).reduce((s, r) => s + r.total, 0)
  const todayExpenses = (expensesRes.data ?? []).reduce((s, r) => s + r.amount, 0)
  const lowStockMaterials = (materialsRes.data ?? []).filter(
    (m) => m.current_stock <= m.low_stock_threshold
  )
  const negativeMaterials = (materialsRes.data ?? []).filter((m) => m.current_stock < 0)

  return (
    <Dashboard
      todayRevenue={todayRevenue}
      todayExpenses={todayExpenses}
      lowStockMaterials={lowStockMaterials}
      negativeMaterials={negativeMaterials}
      recentSales={(recentSalesRes.data ?? []) as unknown as { id: string; created_at: string; total: number; status: string; promos?: { name: string } | null }[]}
      recentExpenses={recentExpensesRes.data ?? []}
    />
  )
}
