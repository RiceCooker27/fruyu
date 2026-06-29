'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, TrendingUp, Package, BarChart2, Settings, Receipt } from 'lucide-react'
import { useLang } from '@/lib/lang-context'
import { t } from '@/lib/i18n'

const navItems = [
  { href: '/', icon: TrendingUp, key: 'dashboard' as const },
  { href: '/sales', icon: ShoppingBag, key: 'sales' as const },
  { href: '/expenses', icon: Receipt, key: 'expenses' as const },
  { href: '/stock', icon: Package, key: 'stock' as const },
  { href: '/reports', icon: BarChart2, key: 'reports' as const },
  { href: '/settings', icon: Settings, key: 'settings' as const },
]

export default function AppNav() {
  const pathname = usePathname()
  const { lang } = useLang()

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center gap-8">
        <div className="flex items-center gap-2 font-bold text-orange-500 text-lg">
          <ShoppingBag className="w-5 h-5" />
          Fruyu
        </div>
        <nav className="flex gap-1">
          {navItems.map(({ href, icon: Icon, key }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(lang, key)}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
        {navItems.map(({ href, icon: Icon, key }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                active ? 'text-orange-500' : 'text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{t(lang, key)}</span>
            </Link>
          )
        })}
      </nav>
      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16" />
    </>
  )
}
