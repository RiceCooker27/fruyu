'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Check, X } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { formatRupiah } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import type { Promo } from '@/lib/types'

const empty: { name: string; discount_type: 'percentage' | 'fixed_amount'; discount_value: string } = {
  name: '', discount_type: 'percentage', discount_value: ''
}

export default function PromosManager({ promos }: { promos: Promo[] }) {
  const { lang } = useLang()
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.name || !form.discount_value) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name: form.name,
      discount_type: form.discount_type,
      discount_value: parseInt(form.discount_value),
    }
    if (editingId) {
      await supabase.from('promos').update(payload).eq('id', editingId)
    } else {
      const { data: m } = await supabase.from('store_members').select('store_id').limit(1).single()
      await supabase.from('promos').insert({ ...payload, store_id: m?.store_id })
    }
    setSaving(false)
    setAdding(false)
    setEditingId(null)
    setForm(empty)
    router.refresh()
  }

  function cancelForm() {
    setAdding(false)
    setEditingId(null)
    setForm(empty)
  }

  async function toggleActive(p: Promo) {
    const supabase = createClient()
    await supabase.from('promos').update({ is_active: !p.is_active }).eq('id', p.id)
    router.refresh()
  }

  const formJSX = (
    <div className="bg-orange-50 rounded-xl p-4 space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t(lang, 'name')}</label>
        <input
          autoFocus
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Weekend Sale"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t(lang, 'discountType')}</label>
          <select
            value={form.discount_type}
            onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as 'percentage' | 'fixed_amount' }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="percentage">{t(lang, 'percentage')}</option>
            <option value="fixed_amount">{t(lang, 'fixedAmount')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {t(lang, 'discountValue')} {form.discount_type === 'percentage' ? '(%)' : '(Rp)'}
          </label>
          <input
            type="number"
            min="0"
            value={form.discount_value}
            onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
            placeholder={form.discount_type === 'percentage' ? '10' : '5000'}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
          <Check className="w-4 h-4" /> {t(lang, 'save')}
        </button>
        <button onClick={cancelForm}
          className="flex items-center gap-1 border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
          <X className="w-4 h-4" /> {t(lang, 'cancel')}
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t(lang, 'promos')}</h1>
        <button onClick={() => { setAdding(true); setEditingId(null); setForm(empty) }}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600">
          <Plus className="w-4 h-4" /> {t(lang, 'add')}
        </button>
      </div>

      {adding && formJSX}

      <div className="space-y-2">
        {promos.map((p) => (
          <div key={p.id}>
            {editingId === p.id ? formJSX : (
              <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between ${!p.is_active ? 'opacity-50' : ''}`}>
                <div>
                  <p className="font-medium text-gray-800">{p.name}</p>
                  <p className="text-sm text-gray-500">
                    {p.discount_type === 'percentage' ? `${p.discount_value}% off` : `${formatRupiah(p.discount_value)} off`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setEditingId(p.id); setForm({ name: p.name, discount_type: p.discount_type, discount_value: String(p.discount_value) }); setAdding(false) }}
                    className="text-gray-400 hover:text-orange-500"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => toggleActive(p)}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? t(lang, 'active') : t(lang, 'inactive')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
