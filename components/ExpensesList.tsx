'use client'

import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'
import { formatRupiah, formatDate } from '@/lib/format'
import type { Expense } from '@/lib/types'

export default function ExpensesList({ expenses }: { expenses: Expense[] }) {
  const { lang } = useLang()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t(lang, 'expenses')}</h1>
        <Link
          href="/expenses/new"
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t(lang, 'recordExpense')}
        </Link>
      </div>

      <div className="space-y-2">
        {expenses.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-12">Belum ada pengeluaran</p>
        )}
        {expenses.map((expense) => (
          <div key={expense.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-800 text-sm">{expense.description}</p>
                {expense.material_id && (
                  <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    <Package className="w-3 h-3" />
                    +{expense.quantity_purchased} {(expense.materials as unknown as { unit: string })?.unit}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(expense.created_at)}</p>
              {expense.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{expense.notes}</p>}
            </div>
            <p className="font-semibold text-red-500 text-sm">{formatRupiah(expense.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
