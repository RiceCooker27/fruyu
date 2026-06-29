'use client'

import { useRouter } from 'next/navigation'
import { Download } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { formatRupiah, todayWIB, thisWeekWIB, thisMonthWIB } from '@/lib/format'
import * as XLSX from 'xlsx'

interface Props {
  from: string
  to: string
  totalRevenue: number
  totalDiscount: number
  totalExpenses: number
  materialExpenses: number
  bestSellers: { name: string; units: number; revenue: number }[]
  sales: { total: number; discount_amount: number; created_at: string }[]
  expenses: { amount: number; description: string; material_id: string | null; created_at: string }[]
}

export default function ReportsView({
  from, to, totalRevenue, totalDiscount, totalExpenses, materialExpenses, bestSellers, sales, expenses,
}: Props) {
  const { lang } = useLang()
  const router = useRouter()
  const netProfit = totalRevenue - totalExpenses

  function applyRange(range: 'today' | 'week' | 'month') {
    const r = range === 'today' ? todayWIB() : range === 'week' ? thisWeekWIB() : thisMonthWIB()
    router.push(`/reports?from=${encodeURIComponent(r.start)}&to=${encodeURIComponent(r.end)}&range=${range}`)
  }

  function exportExcel() {
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const summaryData = [
      ['Laporan Keuangan Fruyu'],
      ['Periode', `${from} s/d ${to}`],
      [],
      ['Ringkasan'],
      ['Pendapatan', totalRevenue],
      ['Total Diskon Diberikan', totalDiscount],
      ['Total Pengeluaran', totalExpenses],
      ['Laba Bersih', netProfit],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Ringkasan')

    // Best sellers
    const bsData = [
      ['Produk', 'Unit Terjual', 'Pendapatan'],
      ...bestSellers.map((b) => [b.name, b.units, b.revenue]),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bsData), 'Produk Terlaris')

    // Sales detail
    const salesData = [
      ['Tanggal', 'Total', 'Diskon'],
      ...sales.map((s) => [s.created_at, s.total, s.discount_amount]),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(salesData), 'Penjualan')

    // Expenses detail
    const expData = [
      ['Tanggal', 'Deskripsi', 'Jumlah', 'Jenis'],
      ...expenses.map((e) => [e.created_at, e.description, e.amount, e.material_id ? 'Beli Bahan' : 'Lainnya']),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expData), 'Pengeluaran')

    XLSX.writeFile(wb, `fruyu-laporan-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t(lang, 'reports')}</h1>
        <button
          onClick={exportExcel}
          className="flex items-center gap-2 border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          {t(lang, 'exportExcel')}
        </button>
      </div>

      {/* Range buttons */}
      <div className="flex gap-2">
        {(['today', 'week', 'month'] as const).map((range) => (
          <button
            key={range}
            onClick={() => applyRange(range)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
          >
            {range === 'today' ? t(lang, 'today') : range === 'week' ? t(lang, 'thisWeek') : t(lang, 'thisMonth')}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">{t(lang, 'revenue')}</p>
          <p className="text-lg font-bold text-green-600">{formatRupiah(totalRevenue)}</p>
          {totalDiscount > 0 && (
            <p className="text-xs text-gray-400 mt-1">Diskon: {formatRupiah(totalDiscount)}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">{t(lang, 'totalExpenses')}</p>
          <p className="text-lg font-bold text-red-500">{formatRupiah(totalExpenses)}</p>
        </div>
        <div className={`col-span-2 rounded-xl border shadow-sm p-4 ${netProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
          <p className="text-xs text-gray-500 mb-1">{t(lang, 'netProfit')}</p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            {formatRupiah(netProfit)}
          </p>
        </div>
      </div>

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t(lang, 'bestSellers')}</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {bestSellers.map((b) => (
              <div key={b.name} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.units} {t(lang, 'unitsSold')}</p>
                </div>
                <p className="text-sm font-semibold text-green-600">{formatRupiah(b.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t(lang, 'spendingBreakdown')}</h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm text-gray-700">{t(lang, 'materialsRestock')}</p>
            <p className="text-sm font-semibold text-gray-800">{formatRupiah(materialExpenses)}</p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm text-gray-700">{t(lang, 'otherExpenses')}</p>
            <p className="text-sm font-semibold text-gray-800">{formatRupiah(totalExpenses - materialExpenses)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
