'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import type { Material } from '@/lib/types'

export default function NewExpenseForm({ materials }: { materials: Material[] }) {
  const { lang } = useLang()
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isRestock, setIsRestock] = useState(false)
  const [materialId, setMaterialId] = useState('')
  const [qtyPurchased, setQtyPurchased] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedMaterial = materials.find((m) => m.id === materialId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description || !amount) return
    setSaving(true)

    const supabase = createClient()

    // Get store_id
    const { data: memberData } = await supabase.from('store_members').select('store_id').limit(1).single()
    const storeId = memberData?.store_id

    // Insert expense
    await supabase.from('expenses').insert({
      store_id: storeId,
      description,
      amount: parseInt(amount),
      notes: notes || null,
      material_id: isRestock && materialId ? materialId : null,
      quantity_purchased: isRestock && qtyPurchased ? parseFloat(qtyPurchased) : null,
    })

    // If restock, update material stock
    if (isRestock && materialId && qtyPurchased) {
      const qty = parseFloat(qtyPurchased)
      const current = selectedMaterial?.current_stock ?? 0

      await supabase
        .from('materials')
        .update({ current_stock: current + qty })
        .eq('id', materialId)

      // Log stock adjustment
      await supabase.from('stock_adjustments').insert({
        store_id: storeId,
        material_id: materialId,
        delta: qty,
        reason: `Pembelian: ${description}`,
        source: 'expense',
      })
    }

    setSaving(false)
    router.push('/expenses')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">{t(lang, 'recordExpense')}</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t(lang, 'description')}</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Contoh: Beli tepung terigu"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t(lang, 'amount')} (Rp)</label>
          <input
            type="number"
            required
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="50000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t(lang, 'notes')}</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Restock toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isRestock}
            onChange={(e) => setIsRestock(e.target.checked)}
            className="w-4 h-4 accent-orange-500"
          />
          <span className="text-sm text-gray-700">{t(lang, 'restockMaterial')}</span>
        </label>

        {isRestock && (
          <div className="space-y-3 pl-7 border-l-2 border-orange-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t(lang, 'selectMaterial')}</label>
              <select
                required={isRestock}
                value={materialId}
                onChange={(e) => setMaterialId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">-- Pilih bahan baku --</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (stok: {m.current_stock} {m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t(lang, 'quantityPurchased')} {selectedMaterial ? `(${selectedMaterial.unit})` : ''}
              </label>
              <input
                type="number"
                required={isRestock}
                min="0"
                step="any"
                value={qtyPurchased}
                onChange={(e) => setQtyPurchased(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="0"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          {t(lang, 'cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-orange-500 text-white rounded-xl py-3 text-sm font-semibold hover:bg-orange-600 disabled:opacity-60"
        >
          {saving ? 'Menyimpan...' : t(lang, 'save')}
        </button>
      </div>
    </form>
  )
}
