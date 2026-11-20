import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'

const font = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-main',
})

export const metadata: Metadata = {
  title: 'Quản lý tạp hóa',
  description: 'Phần mềm quản lý bán hàng tạp hóa - đơn giản, dễ dùng',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={font.variable}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900 text-lg">
        {children}
      </body>
    </html>
  )
}
