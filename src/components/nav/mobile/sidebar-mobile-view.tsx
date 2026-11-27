'use client'

import Link from 'next/link'
import { LogOut, MoreHorizontal, Store, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { useSidebar } from '../use-sidebar'

export function SidebarMobileView({ model }: { model: ReturnType<typeof useSidebar> }) {
  const { pathname, storeName, isMobileMenuOpen, setIsMobileMenuOpen, isLoggingOut, isMoreActive, mainNavItems, moreNavItems, handleLogout, displayName } = model

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
    </>
  )
}
