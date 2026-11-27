'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ShoppingCart,
  PackagePlus,
  Package,
  Receipt,
  BookOpen,
  BarChart3,
  ClipboardCheck,
  Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export interface SidebarProps {
  storeName?: string
  user?: {
    email?: string | null
    name?: string | null
  } | null
}

const saleNavItem = { name: 'Bán hàng', href: '/ban-hang', icon: ShoppingCart }
const purchaseNavItem = { name: 'Nhập hàng', href: '/nhap-hang', icon: PackagePlus }
const productsNavItem = { name: 'Hàng hóa', href: '/hang-hoa', icon: Package }
const invoicesNavItem = { name: 'Hóa đơn', href: '/hoa-don', icon: Receipt }
const debtNavItem = { name: 'Sổ nợ', href: '/so-no', icon: BookOpen }
const reportNavItem = { name: 'Báo cáo', href: '/bao-cao', icon: BarChart3 }
const stocktakeNavItem = { name: 'Kiểm kho', href: '/hang-hoa/kiem-kho', icon: ClipboardCheck }
const settingsNavItem = { name: 'Cài đặt', href: '/cai-dat', icon: Settings }

const mainNavItems = [saleNavItem, purchaseNavItem, productsNavItem, debtNavItem]
const moreNavItems = [invoicesNavItem, reportNavItem, stocktakeNavItem, settingsNavItem]
const desktopNavItems = [
  saleNavItem,
  purchaseNavItem,
  productsNavItem,
  invoicesNavItem,
  debtNavItem,
  reportNavItem,
]

export function useSidebar({ user, storeName = 'Tạp Hóa' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isCaiDatActive = pathname === '/cai-dat' || pathname.startsWith('/cai-dat/')
  const isMoreActive = moreNavItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Lỗi khi đăng xuất:', err)
    } finally {
      setIsLoggingOut(false)
      setIsMobileMenuOpen(false)
      router.push('/dang-nhap')
      router.refresh()
    }
  }

  const displayName = user?.name || user?.email || 'Chủ cửa hàng'

  return {
    pathname,
    storeName,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isLoggingOut,
    isCaiDatActive,
    isMoreActive,
    mainNavItems,
    moreNavItems,
    desktopNavItems,
    handleLogout,
    displayName,
  }
}
