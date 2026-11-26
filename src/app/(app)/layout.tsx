import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { CACHE_TAGS, createUserCache } from '@/lib/cache'
import { Sidebar } from '@/components/nav/sidebar'
import { FontSizeSync } from '@/components/ui/font-size-sync'

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
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    if (data?.user) {
      user = {
        email: data.user.email ?? null,
        name:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.store_name ||
          null,
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session || session.user.id !== data.user.id) {
        throw new Error('Phiên đăng nhập không hợp lệ.')
      }
      const settings = await getCachedShellSettings({
        userId: data.user.id,
        accessToken: session.access_token,
      })
      if (settings) {
        storeName = settings.store_name
        fontSize = settings.font_size
      }
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

  return (
    <FontSizeSync fontSize={fontSize}>
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        <Sidebar user={user} storeName={storeName} />
        <main className="mx-auto w-full min-w-0 max-w-full flex-1 px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-3 lg:max-w-7xl lg:px-8 lg:pb-8 lg:pt-6">
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
          <p className="text-sm font-semibold leading-snug text-gray-700">Đang mở cửa hàng, vui lòng chờ một chút…</p>
          <div className="h-10 max-w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-6 max-sm:mt-3 h-48 animate-pulse rounded-xl bg-gray-200" />
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  )
}
