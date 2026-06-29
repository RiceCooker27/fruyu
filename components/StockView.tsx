'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Edit2 } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import type { Material, StockAdjustment } from '@/lib/types'

function statusBadge(material: Material, lang: ReturnType<typeof useLang>['lang']) {
  if (material.current_stock < 0)
    return <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{t(lang, 'negative')}</span>
  if (material.current_stock <= material.low_stock_threshold)
    return <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{t(lang, 'low')}</span>
  return <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t(lang, 'ok')}</span>
}

export default function StockView({
  materials,
  adjustments,
}: {
  materials: Material[]
  adjustments: (StockAdjustment & { materials?: { name: string } })[]
}) {
  const { lang } = useLang()
  const router = useRouter()
  const [adjustingId, setAdjustingId] = useState<string | null>(null)
  const [newQty, setNewQty] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const sorted = [...materials].sort((a, b) => {
    const scoreA = a.current_stock < 0 ? 0 : a.current_stock <= a.low_stock_threshold ? 1 : 2
    const scoreB = b.current_stock < 0 ? 0 : b.current_stock <= b.low_stock_threshold ? 1 : 2
    return scoreA - scoreB
  })

  async function saveAdjustment(material: Material) {
    if (!newQty || !reason) return
    setSaving(true)
    const supabase = createClient()
    const qty = parseFloat(newQty)
    const delta = qty - material.current_stock

    const { data: memberData } = await supabase.from('store_members').select('store_id').limit(1).single()
    const storeId = memberData?.store_id

    await supabase.from('materials').update({ current_stock: qty }).eq('id', material.id)
    await supabase.from('stock_adjustments').insert({
      store_id: storeId,
      material_id: material.id,
      delta,
      reason,
      source: 'manual',
    })

    setSaving(false)
    setAdjustingId(null)
    setNewQty('')
    setReason('')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">{t(lang, 'stock')}</h1>

      {/* Stock table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">{t(lang, 'name')}</th>
              <th className="text-right px-4 py-3">{t(lang, 'currentStock')}</th>
              <th className="text-right px-4 py-3 hidden sm:table-cell">{t(lang, 'threshold')}</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((m) => (
              <>
                <tr key={m.id} className={m.current_stock < 0 ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${m.current_stock < 0 ? 'text-red-600' : m.current_stock <= m.low_stock_threshold ? 'text-orange-600' : 'text-gray-800'}`}>
                    {m.current_stock} {m.unit}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">
                    {m.low_stock_threshold} {m.unit}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {statusBadge(m, lang)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setAdjustingId(m.id); setNewQty(String(m.current_stock)); setReason('') }}
                      className="text-gray-400 hover:text-orange-500"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                {adjustingId === m.id && (
                  <tr key={`${m.id}-edit`} className="bg-orange-50">
                    <td colSpan={5} className="px-4 py-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="number"
                          step="any"
                          value={newQty}
                          onChange={(e) => setNewQty(e.target.value)}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full sm:w-32"
                          placeholder={t(lang, 'newQuantity')}
                        />
                        <input
                          type="text"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1"
                          placeholder={t(lang, 'adjustmentReason')}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveAdjustment(m)}
                            disabled={saving || !reason}
                            className="bg-orange-500 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
                          >
                            {t(lang, 'save')}
                          </button>
                          <button
                            onClick={() => setAdjustingId(null)}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                          >
                            {t(lang, 'cancel')}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent adjustments log */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t(lang, 'stockHistory')}</h2>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {adjustments.length === 0 && (
            <p className="text-gray-400 text-sm p-4 text-center">Belum ada riwayat</p>
          )}
          {adjustments.map((adj) => (
            <div key={adj.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {adj.materials?.name}
                </p>
                <p className="text-xs text-gray-400">{adj.reason} · {formatDate(adj.created_at)}</p>
              </div>
              <span className={`text-sm font-semibold ${adj.delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {adj.delta > 0 ? '+' : ''}{adj.delta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
