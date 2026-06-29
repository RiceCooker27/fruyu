'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ChevronDown, ChevronUp, XCircle } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { formatRupiah, formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Sale } from '@/lib/types'

export default function SalesList({ sales }: { sales: Sale[] }) {
  const { lang } = useLang()
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [voiding, setVoiding] = useState<string | null>(null)

  async function voidSale(id: string) {
    if (!confirm(t(lang, 'confirmVoid'))) return
    setVoiding(id)
    const supabase = createClient()
    await supabase.rpc('void_sale', { p_sale_id: id })
    setVoiding(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t(lang, 'sales')}</h1>
        <Link
          href="/sales/new"
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t(lang, 'recordSale')}
        </Link>
      </div>

      <div className="space-y-2">
        {sales.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-12">Belum ada penjualan</p>
        )}
        {sales.map((sale) => (
          <div
            key={sale.id}
            className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
              sale.status === 'voided' ? 'opacity-60 border-gray-100' : 'border-gray-100'
            }`}
          >
            <button
              className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{formatRupiah(sale.total)}</span>
                  {sale.status === 'voided' && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {t(lang, 'voided')}
                    </span>
                  )}
                  {sale.promos && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      {(sale.promos as unknown as { name: string }).name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(sale.created_at)}</p>
              </div>
              {expanded === sale.id ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expanded === sale.id && (
              <div className="border-t border-gray-50 px-4 pb-4 space-y-3">
                {/* Line items */}
                <div className="space-y-1 mt-2">
                  {(sale.sale_items ?? []).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {(item.products as unknown as { name: string })?.name} × {item.quantity}
                      </span>
                      <span className="text-gray-800">{formatRupiah(item.line_total)}</span>
                    </div>
                  ))}
                </div>

                {sale.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t(lang, 'discount')}</span>
                    <span className="text-red-500">-{formatRupiah(sale.discount_amount)}</span>
                  </div>
                )}

                {sale.notes && (
                  <p className="text-xs text-gray-400 italic">{sale.notes}</p>
                )}

                {sale.status === 'completed' && (
                  <button
                    onClick={() => voidSale(sale.id)}
                    disabled={voiding === sale.id}
                    className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    {t(lang, 'voidSale')}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
