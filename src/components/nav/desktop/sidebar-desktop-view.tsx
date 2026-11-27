'use client'

import Link from 'next/link'
import { LogOut, Settings, Store, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { useSidebar } from '../use-sidebar'

export function SidebarDesktopView({ model }: { model: ReturnType<typeof useSidebar> }) {
  const { pathname, storeName, isLoggingOut, isCaiDatActive, desktopNavItems, handleLogout, displayName } = model

  return (
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
  )
}
