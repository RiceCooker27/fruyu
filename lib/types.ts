export interface Material {
  id: string
  name: string
  unit: string
  current_stock: number
  low_stock_threshold: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  base_price: number
  is_active: boolean
  created_at: string
}

export interface Recipe {
  id: string
  product_id: string
  material_id: string
  quantity_per_unit: number
  materials?: Material
}

export interface Promo {
  id: string
  name: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  is_active: boolean
  created_at: string
}

export interface Sale {
  id: string
  created_at: string
  promo_id: string | null
  subtotal: number
  discount_amount: number
  total: number
  notes: string | null
  status: 'completed' | 'voided'
  promos?: Promo
  sale_items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  line_total: number
  products?: Product
}

export interface Expense {
  id: string
  created_at: string
  description: string
  amount: number
  material_id: string | null
  quantity_purchased: number | null
  notes: string | null
  materials?: Material
}

export interface StockAdjustment {
  id: string
  created_at: string
  material_id: string
  delta: number
  reason: string
  source: 'sale' | 'void' | 'expense' | 'manual'
}

export type CartItem = {
  product: Product
  quantity: number
}
