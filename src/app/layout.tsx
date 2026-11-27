import type { Metadata, Viewport } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import { OfflineNotice } from '@/components/ui/offline-notice'
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
  appleWebApp: {
    capable: true,
    title: 'Tạp hóa',
    statusBarStyle: 'default',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#1d4ed8',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={font.variable} data-font-size="medium">
      <body className="font-sans antialiased bg-gray-100 text-gray-900">
        <OfflineNotice />
        {children}
      </body>
    </html>
  )
}
