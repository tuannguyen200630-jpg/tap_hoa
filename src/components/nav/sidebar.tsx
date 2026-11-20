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
  Settings,
  LogOut,
  Store,
  User as UserIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user?: {
    email?: string | null
    name?: string | null
  } | null
}

const mainNavItems = [
  { name: 'Bán hàng', href: '/ban-hang', icon: ShoppingCart },
  { name: 'Nhập hàng', href: '/nhap-hang', icon: PackagePlus },
  { name: 'Hàng hóa', href: '/hang-hoa', icon: Package },
  { name: 'Hóa đơn', href: '/hoa-don', icon: Receipt },
  { name: 'Sổ nợ', href: '/so-no', icon: BookOpen },
  { name: 'Báo cáo', href: '/bao-cao', icon: BarChart3 },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const isCaiDatActive = pathname === '/cai-dat' || pathname.startsWith('/cai-dat/')

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
      {/* ========================================================
          MOBILE TOP BAR (Header on screens < md)
          Includes Brand name and Gear icon for secondary menu (Cài đặt, Tài khoản, Đăng xuất)
         ======================================================== */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 h-16 flex items-center justify-between shadow-xs">
        <Link
          href="/ban-hang"
          className="flex items-center gap-2.5 min-h-[48px] py-2 focus:outline-none"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-xl text-gray-900 block leading-tight">
              Tạp Hóa
            </span>
            <span className="text-xs text-gray-500 font-medium truncate block max-w-[160px]">
              {displayName}
            </span>
          </div>
        </Link>

        {/* Secondary Menu Gear Icon */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Cài đặt và tài khoản"
            aria-expanded={isMobileMenuOpen}
            className={cn(
              'min-h-[48px] min-w-[48px] p-2.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer',
              isCaiDatActive || isMobileMenuOpen
                ? 'bg-blue-50 border-blue-300 text-blue-600'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            )}
          >
            <Settings className="w-6 h-6" />
          </button>

          {/* Secondary Dropdown Menu on Mobile */}
          {isMobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <UserIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{displayName}</span>
                  </div>
                </div>

                <Link
                  href="/cai-dat"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 min-h-[48px] text-[18px] transition-colors',
                    isCaiDatActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-800 hover:bg-gray-50 font-medium'
                  )}
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span>Cài đặt</span>
                </Link>

                <div className="border-t border-gray-100 my-1" />

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 px-4 py-3 min-h-[48px] w-full text-left text-[18px] text-red-600 hover:bg-red-50 font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-5 h-5 text-red-600" />
                  <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ========================================================
          MOBILE BOTTOM TAB BAR (Fixed on screens < md)
          Max 6 items: Bán hàng, Nhập hàng, Hàng hóa, Hóa đơn, Sổ nợ, Báo cáo
         ======================================================== */}
      <nav
        aria-label="Thanh điều hướng dưới"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
      >
        <div className="grid grid-cols-6 h-16 items-center px-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center min-h-[48px] h-full py-1 px-0.5 text-center transition-colors rounded-lg',
                  isActive
                    ? 'text-blue-600 font-bold bg-blue-50/70'
                    : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
                )}
              >
                <Icon
                  className={cn(
                    'w-6 h-6 shrink-0 transition-transform',
                    isActive ? 'stroke-[2.5] scale-105' : 'stroke-[1.75]'
                  )}
                />
                <span className="text-[11px] leading-tight mt-1 truncate w-full px-0.5">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ========================================================
          DESKTOP SIDEBAR (Visible on screens >= md)
          Left sidebar with store brand, 6 main nav items,
          secondary Cài đặt menu item, user info and Logout button
         ======================================================== */}
      <aside
        aria-label="Thanh điều hướng bên"
        className="hidden md:flex md:w-64 lg:w-72 shrink-0 border-r border-gray-200 bg-white min-h-screen flex-col justify-between sticky top-0 h-screen"
      >
        {/* Top: Logo & Main Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto p-4">
          {/* Brand header */}
          <Link
            href="/ban-hang"
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 min-h-[48px] transition-colors mb-4"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <span className="font-bold text-xl text-gray-900 block leading-tight">
                Tạp Hóa
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Quản lý cửa hàng
              </span>
            </div>
          </Link>

          {/* Primary Navigation - 6 items */}
          <nav aria-label="Menu chính" className="space-y-1.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3.5 px-4 py-3 rounded-xl min-h-[48px] text-[18px] transition-all',
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
        <div className="p-4 border-t border-gray-200 bg-gray-50/50 space-y-1.5">
          {/* User info preview */}
          <div className="px-3 py-2 flex items-center gap-2.5 text-gray-600">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500">Tài khoản</p>
            </div>
          </div>

          {/* Secondary item: Cài đặt (gear icon) */}
          <Link
            href="/cai-dat"
            className={cn(
              'flex items-center gap-3.5 px-4 py-3 rounded-xl min-h-[48px] text-[18px] transition-colors',
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
            className="flex items-center gap-3.5 px-4 py-3 rounded-xl min-h-[48px] w-full text-left text-[18px] text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-6 h-6 shrink-0 stroke-[1.75]" />
            <span>{isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
