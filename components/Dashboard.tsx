'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, AlertTriangle, Plus } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { formatRupiah, formatDate } from '@/lib/format'
import type { Material } from '@/lib/types'

interface Props {
  todayRevenue: number
  todayExpenses: number
  lowStockMaterials: Material[]
  negativeMaterials: Material[]
  recentSales: { id: string; created_at: string; total: number; status: string; promos?: { name: string } | null }[]
  recentExpenses: { id: string; created_at: string; description: string; amount: number }[]
}

export default function Dashboard({
  todayRevenue,
  todayExpenses,
  lowStockMaterials,
  negativeMaterials,
  recentSales,
  recentExpenses,
}: Props) {
  const { lang } = useLang()
  const netProfit = todayRevenue - todayExpenses
  const allAlerts = [...negativeMaterials, ...lowStockMaterials.filter(m => m.current_stock >= 0)]

  // Merge recent sales + expenses, sort by date desc, take 5
  const recentAll = [
    ...recentSales.map(s => ({ ...s, type: 'sale' as const, label: s.promos?.name ?? '' })),
    ...recentExpenses.map(e => ({ ...e, type: 'expense' as const, label: e.description, total: e.amount })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  return (
    <div className="space-y-6">
      {/* Low stock alert banner */}
      {allAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">{t(lang, 'lowStockAlert')}</p>
              <ul className="mt-1 space-y-1">
                {allAlerts.map((m) => (
                  <li key={m.id} className="text-sm text-red-700">
                    {m.name}: {m.current_stock} {m.unit}
                    {m.current_stock < 0 && (
                      <span className="ml-2 bg-red-200 text-red-800 text-xs px-1.5 py-0.5 rounded font-medium">NEGATIF</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Today summary */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t(lang, 'todaySummary')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">{t(lang, 'revenue')}</p>
            <p className="text-lg font-bold text-green-600">{formatRupiah(todayRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">{t(lang, 'totalExpenses')}</p>
            <p className="text-lg font-bold text-red-500">{formatRupiah(todayExpenses)}</p>
          </div>
          <div className={`rounded-xl p-4 shadow-sm border ${netProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <p className="text-xs text-gray-500 mb-1">{t(lang, 'netProfit')}</p>
            <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {formatRupiah(netProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/sales/new"
          className="bg-orange-500 text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus className="w-6 h-6" />
          <span className="text-sm font-medium text-center">{t(lang, 'recordSale')}</span>
        </Link>
        <Link
          href="/expenses/new"
          className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <TrendingDown className="w-6 h-6 text-gray-600" />
          <span className="text-sm font-medium text-gray-700 text-center">{t(lang, 'recordExpense')}</span>
        </Link>
        <Link
          href="/stock"
          className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <TrendingUp className="w-6 h-6 text-gray-600" />
          <span className="text-sm font-medium text-gray-700 text-center">{t(lang, 'adjustStock')}</span>
        </Link>
      </div>

      {/* Recent transactions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {t(lang, 'recentTransactions')}
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {recentAll.length === 0 && (
            <p className="text-gray-400 text-sm p-4 text-center">Belum ada transaksi hari ini</p>
          )}
          {recentAll.map((item) => (
            <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {item.type === 'sale' ? (
                    <span className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded">Jual</span>
                      {item.label || 'Penjualan'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded">Keluar</span>
                      {item.label}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.created_at)}</p>
              </div>
              <p className={`font-semibold text-sm ${item.type === 'sale' ? 'text-green-600' : 'text-red-500'}`}>
                {item.type === 'sale' ? '+' : '-'}{formatRupiah(item.total)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
