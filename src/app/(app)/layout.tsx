import { Suspense } from 'react'
import { CACHE_TAGS, createUserCache, getAuthContext } from '@/lib/cache'
import { Sidebar } from '@/components/nav/sidebar'
import { FontSizeSync } from '@/components/ui/font-size-sync'
import { getInitialIsDesktop } from '@/lib/device'

export const dynamic = 'force-dynamic'

const getCachedShellSettings = createUserCache('app-shell-settings', [
  CACHE_TAGS.SETTINGS,
], async (supabase) => {
  const { data, error } = await supabase
    .from('settings')
    .select('store_name, font_size')
    .eq('id', 'default')
    .maybeSingle()
  if (error) {
    console.error('Lỗi lấy tên và cỡ chữ cửa hàng:', error)
    throw new Error('Không tải được thông tin giao diện cửa hàng.')
  }
  return data
})

async function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  let user: { email?: string | null; name?: string | null } | null = null
  let storeName = 'Tạp Hóa'
  let fontSize: 'medium' | 'large' | 'xlarge' = 'medium'

  try {
    const { identity, email, name } = await getAuthContext()
    user = { email, name }

    const settings = await getCachedShellSettings(identity)
    if (settings) {
      storeName = settings.store_name
      fontSize = settings.font_size
    }
  } catch (error: unknown) {
    const err = error as { digest?: string; message?: string }
    if (
      err?.digest === 'HANGING_PROMISE_REJECTION' ||
      err?.digest?.startsWith('DYNAMIC_SERVER_USAGE') ||
      err?.message?.includes('During prerendering')
    ) {
      throw error
    }
    // If Supabase is unconfigured or offline during runtime SSR, fallback gracefully
    console.error('Lỗi lấy thông tin người dùng:', error)
  }

  const initialIsDesktop = await getInitialIsDesktop()

  return (
    <FontSizeSync fontSize={fontSize}>
      <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
        <Sidebar user={user} storeName={storeName} initialIsDesktop={initialIsDesktop} />
        <main className="mx-auto w-full min-w-0 max-w-full flex-1 px-1.5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-3 lg:max-w-7xl lg:px-8 lg:pb-8 lg:pt-6">
          {children}
        </main>
      </div>
    </FontSizeSync>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 max-sm:gap-2 p-6 max-sm:p-3" role="status" aria-label="Đang tải cửa hàng">
          <p className="text-sm font-semibold leading-snug text-gray-900">Đang mở cửa hàng, vui lòng chờ một chút…</p>
          <div className="h-10 max-w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 max-sm:mt-3 h-48 animate-pulse rounded-xl bg-gray-200" />
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  )
}
