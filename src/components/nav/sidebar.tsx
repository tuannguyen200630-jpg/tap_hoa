'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ShoppingCart,
  PackagePlus,
  Package,
  Receipt,
  BookOpen,
  BarChart3,
  ClipboardCheck,
  MoreHorizontal,
  Settings,
  LogOut,
  Store,
  User as UserIcon,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface SidebarProps {
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

export function Sidebar({ user, storeName = 'Tạp Hóa' }: SidebarProps) {
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

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 max-sm:px-3 min-h-16 py-2 flex items-center shadow-xs">
        <Link
          href="/ban-hang"
          className="flex min-w-0 items-center gap-2.5 min-h-[48px] focus:outline-none"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Store className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xl max-sm:text-base text-gray-900 block leading-tight">
              {storeName}
            </span>
          </div>
        </Link>
      </header>

      <nav
        aria-label="Thanh điều hướng dưới"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-lg"
      >
        <div className="grid h-16 grid-cols-5 items-center px-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-full min-h-[48px] min-w-0 flex-col items-center justify-center rounded-lg px-0.5 py-1.5 text-center transition-colors',
                  isActive
                    ? 'text-blue-600 font-bold bg-blue-50/70'
                    : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'stroke-[2.5]' : 'stroke-[1.75]')} />
                <span className="mt-0.5 w-full whitespace-nowrap text-center text-[11px] font-medium leading-tight">
                  {item.name}
                </span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isMobileMenuOpen}
            className={cn(
              'flex h-full min-h-[48px] min-w-0 flex-col items-center justify-center rounded-lg px-0.5 py-1.5 text-center',
              isMobileMenuOpen || isMoreActive ? 'bg-blue-50/70 text-blue-700' : 'text-gray-600'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="mt-0.5 whitespace-nowrap text-[11px] font-medium leading-tight">Thêm</span>
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Đóng bảng chọn"
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-[60] bg-black/50"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
            className="fixed inset-x-0 bottom-0 z-[61] rounded-t-3xl bg-white px-5 max-sm:px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5 max-sm:pt-3 shadow-2xl"
          >
            <div className="mb-4 max-sm:mb-3 flex items-center justify-between">
              <div>
                <h2 id="mobile-more-title" className="text-2xl max-sm:text-lg font-bold text-gray-950">Thêm chức năng</h2>
                <p className="text-base text-gray-600">{displayName}</p>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav aria-label="Chức năng khác" className="grid grid-cols-2 gap-3 max-sm:gap-2">
              {moreNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border-2 text-lg max-sm:text-sm font-semibold',
                      isActive ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-800'
                    )}
                  >
                    <Icon className="h-7 w-7" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-4 max-sm:mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 text-lg max-sm:text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              <LogOut className="h-5 w-5" />
              {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </button>
          </section>
        </div>
      )}

      {/* ========================================================
          DESKTOP SIDEBAR (Visible on screens >= md)
          Left sidebar with store brand, 6 main nav items,
          secondary Cài đặt menu item, user info and Logout button
         ======================================================== */}
      <aside
        aria-label="Thanh điều hướng bên"
        className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 border-r border-gray-200 bg-white min-h-screen flex-col justify-between sticky top-0 h-screen"
      >
        {/* Top: Logo & Main Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto p-4 max-sm:p-3">
          {/* Brand header */}
          <Link
            href="/ban-hang"
            className="flex items-center gap-3 max-sm:gap-2 px-3 py-3 max-sm:py-2 rounded-xl hover:bg-gray-50 min-h-[48px] transition-colors mb-4 max-sm:mb-3"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <span className="font-bold text-xl max-sm:text-base text-gray-900 block leading-tight">
                {storeName}
              </span>
              <span className="text-sm leading-snug text-gray-700 font-medium">
                Quản lý cửa hàng
              </span>
            </div>
          </Link>

          {/* Primary Navigation - 6 items */}
          <nav aria-label="Menu chính" className="space-y-1.5">
            {desktopNavItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 max-sm:gap-2.5 px-4 max-sm:px-3 py-3 max-sm:py-2 rounded-xl min-h-[48px] text-[18px] transition-all',
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6 shrink-0',
                      isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom: Secondary Menu (Settings, User Info, Logout) */}
        <div className="p-4 max-sm:p-3 border-t border-gray-200 bg-gray-50/50 space-y-1.5">
          {/* User info preview */}
          <div className="px-3 py-2 flex items-center gap-2.5 text-gray-600">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-lg max-sm:text-sm font-semibold text-gray-900 truncate">
                {displayName}
              </p>
              <p className="text-sm leading-snug text-gray-700">Tài khoản</p>
            </div>
          </div>

          {/* Secondary item: Cài đặt (gear icon) */}
          <Link
            href="/cai-dat"
            className={cn(
              'flex items-center gap-3 max-sm:gap-2.5 px-4 max-sm:px-3 py-3 max-sm:py-2 rounded-xl min-h-[48px] text-[18px] transition-colors',
              isCaiDatActive
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-gray-700 hover:bg-gray-200/70 hover:text-gray-900 font-medium'
            )}
          >
            <Settings className="w-6 h-6 shrink-0 stroke-[1.75]" />
            <span>Cài đặt</span>
          </Link>

          {/* Logout button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-3 max-sm:gap-2.5 px-4 max-sm:px-3 py-3 max-sm:py-2 rounded-xl min-h-[48px] w-full text-left text-[18px] text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-6 h-6 shrink-0 stroke-[1.75]" />
            <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
