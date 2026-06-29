'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShoppingCart, Check, AlertTriangle } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { formatRupiah } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import type { Product, Promo, Recipe, CartItem } from '@/lib/types'

interface Props {
  products: Product[]
  promos: Promo[]
  recipes: Recipe[]
}

export default function NewSaleForm({ products, promos, recipes }: Props) {
  const { lang } = useLang()
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedPromoId, setSelectedPromoId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [stockWarnings, setStockWarnings] = useState<string[]>([])
  const [showWarning, setShowWarning] = useState(false)

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product, quantity: 1 }]
    })
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    )
  }

  const selectedPromo = promos.find((p) => p.id === selectedPromoId) ?? null
  const subtotal = cart.reduce((s, i) => s + i.product.base_price * i.quantity, 0)
  let discountAmount = 0
  if (selectedPromo) {
    discountAmount = selectedPromo.discount_type === 'percentage'
      ? Math.round(subtotal * selectedPromo.discount_value / 100)
      : selectedPromo.discount_value
  }
  const total = subtotal - discountAmount

  function checkStockWarnings(): string[] {
    const warnings: string[] = []
    const netDeductions: Record<string, { name: string; unit: string; current: number; required: number }> = {}

    for (const cartItem of cart) {
      const itemRecipes = recipes.filter((r) => r.product_id === cartItem.product.id)
      for (const recipe of itemRecipes) {
        const mat = recipe.materials as unknown as { name: string; unit: string; current_stock: number }
        if (!mat) continue
        if (!netDeductions[recipe.material_id]) {
          netDeductions[recipe.material_id] = {
            name: mat.name,
            unit: mat.unit,
            current: mat.current_stock,
            required: 0,
          }
        }
        netDeductions[recipe.material_id].required += recipe.quantity_per_unit * cartItem.quantity
      }
    }

    for (const entry of Object.values(netDeductions)) {
      if (entry.current - entry.required < 0) {
        warnings.push(`${entry.name} (${entry.current} ${entry.unit} tersedia, butuh ${entry.required} ${entry.unit})`)
      }
    }
    return warnings
  }

  async function handleSubmit(force = false) {
    if (cart.length === 0) return

    if (!force) {
      const warnings = checkStockWarnings()
      if (warnings.length > 0) {
        setStockWarnings(warnings)
        setShowWarning(true)
        return
      }
    }

    setSaving(true)
    const supabase = createClient()
    const items = cart.map((i) => ({
      product_id: i.product.id,
      quantity: i.quantity,
      unit_price: i.product.base_price,
      line_total: i.product.base_price * i.quantity,
    }))

    await supabase.rpc('record_sale', {
      p_items: items,
      p_promo_id: selectedPromoId || null,
      p_subtotal: subtotal,
      p_discount_amount: discountAmount,
      p_total: total,
      p_notes: notes || null,
    })

    setSaving(false)
    router.push('/sales')
    router.refresh()
  }

  return (
    <div className="space-y-5 pb-32">
      <h1 className="text-xl font-bold text-gray-900">{t(lang, 'recordSale')}</h1>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {products.map((product) => {
          const cartItem = cart.find((i) => i.product.id === product.id)
          return (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col gap-2"
            >
              <p className="font-medium text-gray-800 text-sm">{product.name}</p>
              <p className="text-orange-500 font-semibold text-sm">{formatRupiah(product.base_price)}</p>
              {cartItem ? (
                <div className="flex items-center justify-between mt-auto">
                  <button
                    onClick={() => updateQty(product.id, -1)}
                    className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-gray-900">{cartItem.quantity}</span>
                  <button
                    onClick={() => updateQty(product.id, 1)}
                    className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(product)}
                  className="mt-auto w-full bg-orange-50 text-orange-600 rounded-lg py-1.5 text-xs font-medium hover:bg-orange-100 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {t(lang, 'addToCart')}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Cart summary */}
      {cart.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> {t(lang, 'cart')}
          </h2>

          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.product.name} × {item.quantity}</span>
                <span className="font-medium">{formatRupiah(item.product.base_price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Promo */}
          <select
            value={selectedPromoId}
            onChange={(e) => setSelectedPromoId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
          >
            <option value="">{t(lang, 'noPromo')}</option>
            {promos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.discount_type === 'percentage' ? `${p.discount_value}%` : formatRupiah(p.discount_value)}
              </option>
            ))}
          </select>

          {/* Notes */}
          <input
            type="text"
            placeholder={t(lang, 'notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />

          {/* Totals */}
          <div className="border-t border-gray-100 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{t(lang, 'subtotal')}</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>{t(lang, 'discount')} ({selectedPromo?.name})</span>
                <span>-{formatRupiah(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900">
              <span>{t(lang, 'total')}</span>
              <span className="text-orange-500">{formatRupiah(total)}</span>
            </div>
          </div>

          <button
            onClick={() => handleSubmit()}
            disabled={saving}
            className="w-full bg-orange-500 text-white rounded-xl py-3 font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {saving ? 'Menyimpan...' : t(lang, 'confirmSale')}
          </button>
        </div>
      )}

      {/* Stock warning modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Peringatan Stok</p>
                <ul className="mt-2 space-y-1">
                  {stockWarnings.map((w, i) => (
                    <li key={i} className="text-sm text-gray-600">{w} akan {t(lang, 'stockWarning')}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {t(lang, 'cancel')}
              </button>
              <button
                onClick={() => { setShowWarning(false); handleSubmit(true) }}
                className="flex-1 bg-orange-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-orange-600"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
