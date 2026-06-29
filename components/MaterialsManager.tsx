'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Check, X } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import type { Material } from '@/lib/types'

const empty = { name: '', unit: '', current_stock: '0', low_stock_threshold: '0' }

export default function MaterialsManager({ materials }: { materials: Material[] }) {
  const { lang } = useLang()
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.name || !form.unit) return
    setSaving(true)
    const supabase = createClient()
    const base = {
      name: form.name,
      unit: form.unit,
      current_stock: parseFloat(form.current_stock) || 0,
      low_stock_threshold: parseFloat(form.low_stock_threshold) || 0,
    }
    if (editingId) {
      await supabase.from('materials').update(base).eq('id', editingId)
    } else {
      const { data: m } = await supabase.from('store_members').select('store_id').limit(1).single()
      await supabase.from('materials').insert({ ...base, store_id: m?.store_id })
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

  function startEdit(m: Material) {
    setEditingId(m.id)
    setForm({
      name: m.name,
      unit: m.unit,
      current_stock: String(m.current_stock),
      low_stock_threshold: String(m.low_stock_threshold),
    })
    setAdding(false)
  }

  async function toggleActive(m: Material) {
    const supabase = createClient()
    await supabase.from('materials').update({ is_active: !m.is_active }).eq('id', m.id)
    router.refresh()
  }

  const formJSX = (
    <div className="bg-orange-50 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t(lang, 'name')}</label>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t(lang, 'unit')}</label>
          <input
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            placeholder="gram, pcs, liter..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t(lang, 'currentStock')}</label>
          <input
            type="number"
            step="any"
            value={form.current_stock}
            onChange={(e) => setForm((f) => ({ ...f, current_stock: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t(lang, 'threshold')}</label>
          <input
            type="number"
            step="any"
            value={form.low_stock_threshold}
            onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))}
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
        <h1 className="text-xl font-bold text-gray-900">{t(lang, 'materials')}</h1>
        <button onClick={() => { setAdding(true); setEditingId(null); setForm(empty) }}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600">
          <Plus className="w-4 h-4" /> {t(lang, 'add')}
        </button>
      </div>

      {adding && formJSX}

      <div className="space-y-2">
        {materials.map((m) => (
          <div key={m.id}>
            {editingId === m.id ? formJSX : (
              <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between ${!m.is_active ? 'opacity-50' : ''}`}>
                <div>
                  <p className="font-medium text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Stok: {m.current_stock} {m.unit} · Batas: {m.low_stock_threshold} {m.unit}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => startEdit(m)} className="text-gray-400 hover:text-orange-500">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleActive(m)}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {m.is_active ? t(lang, 'active') : t(lang, 'inactive')}
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
