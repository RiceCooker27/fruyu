import type { Metadata } from 'next'
import './globals.css'
import { LangProvider } from '@/lib/lang-context'

export const metadata: Metadata = {
  title: 'Fruyu — Business Management',
  description: 'Sales, stock, and expense tracking for F&B businesses',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  )
}
