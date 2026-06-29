'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Check, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { formatRupiah } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import type { Product, Material, Recipe } from '@/lib/types'

const emptyProduct = { name: '', base_price: '' }

export default function ProductsManager({
  products, materials, recipes,
}: {
  products: Product[]
  materials: Material[]
  recipes: Recipe[]
}) {
  const { lang } = useLang()
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyProduct)
  const [saving, setSaving] = useState(false)
  const [recipeForm, setRecipeForm] = useState<{ material_id: string; qty: string }>({ material_id: '', qty: '' })

  function productRecipes(productId: string) {
    return recipes.filter((r) => r.product_id === productId)
  }

  async function saveProduct() {
    if (!form.name || !form.base_price) return
    setSaving(true)
    const supabase = createClient()
    const base = { name: form.name, base_price: parseInt(form.base_price) }
    if (editingId) {
      await supabase.from('products').update(base).eq('id', editingId)
    } else {
      const { data: m } = await supabase.from('store_members').select('store_id').limit(1).single()
      await supabase.from('products').insert({ ...base, store_id: m?.store_id })
    }
    setSaving(false)
    setAdding(false)
    setEditingId(null)
    setForm(emptyProduct)
    router.refresh()
  }

  async function toggleActive(p: Product) {
    const supabase = createClient()
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    router.refresh()
  }

  async function addRecipe(productId: string) {
    if (!recipeForm.material_id || !recipeForm.qty) return
    const supabase = createClient()
    await supabase.from('recipes').upsert({
      product_id: productId,
      material_id: recipeForm.material_id,
      quantity_per_unit: parseFloat(recipeForm.qty),
    }, { onConflict: 'product_id,material_id' })
    setRecipeForm({ material_id: '', qty: '' })
    router.refresh()
  }

  async function deleteRecipe(id: string) {
    const supabase = createClient()
    await supabase.from('recipes').delete().eq('id', id)
    router.refresh()
  }

  function cancelForm() {
    setAdding(false)
    setEditingId(null)
    setForm(emptyProduct)
  }

  // Inline form JSX — not a nested component, so focus is preserved
  const productFormJSX = (
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
          <label className="block text-xs font-medium text-gray-600 mb-1">{t(lang, 'basePrice')} (Rp)</label>
          <input
            type="number"
            min="0"
            value={form.base_price}
            onChange={(e) => setForm((f) => ({ ...f, base_price: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="15000"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={saveProduct} disabled={saving}
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
        <h1 className="text-xl font-bold text-gray-900">{t(lang, 'products')}</h1>
        <button onClick={() => { setAdding(true); setEditingId(null); setForm(emptyProduct) }}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600">
          <Plus className="w-4 h-4" /> {t(lang, 'add')}
        </button>
      </div>

      {adding && productFormJSX}

      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${!p.is_active ? 'opacity-50' : ''}`}>
            {editingId === p.id ? (
              <div className="p-4">{productFormJSX}</div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-800">{p.name}</p>
                    <p className="text-sm text-orange-500 font-semibold">{formatRupiah(p.base_price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingId(p.id); setForm({ name: p.name, base_price: String(p.base_price) }); setAdding(false) }}
                      className="text-gray-400 hover:text-orange-500"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => toggleActive(p)}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? t(lang, 'active') : t(lang, 'inactive')}
                    </button>
                    <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                      className="text-gray-400 hover:text-gray-600">
                      {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandedId === p.id && (
                  <div className="border-t border-gray-50 px-4 pb-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase mt-3">{t(lang, 'recipe')}</p>
                    {productRecipes(p.id).map((r) => {
                      const mat = materials.find((m) => m.id === r.material_id)
                      return (
                        <div key={r.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{mat?.name ?? r.material_id}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">{r.quantity_per_unit} {mat?.unit}</span>
                            <button onClick={() => deleteRecipe(r.id)} className="text-gray-300 hover:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    <div className="flex gap-2 items-center">
                      <select
                        value={recipeForm.material_id}
                        onChange={(e) => setRecipeForm((f) => ({ ...f, material_id: e.target.value }))}
                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                      >
                        <option value="">-- {t(lang, 'ingredient')} --</option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder={t(lang, 'ingredientQty')}
                        value={recipeForm.qty}
                        onChange={(e) => setRecipeForm((f) => ({ ...f, qty: e.target.value }))}
                        className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                      />
                      <button onClick={() => addRecipe(p.id)}
                        className="bg-orange-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-orange-600">
                        {t(lang, 'addIngredient')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
