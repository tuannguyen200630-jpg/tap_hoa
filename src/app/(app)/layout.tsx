import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/nav/sidebar'

async function SidebarWithUser() {
  let user: { email?: string | null; name?: string | null } | null = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      user = {
        email: data.user.email ?? null,
        name:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.store_name ||
          null,
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

  return <Sidebar user={user} />
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-[18px]">
      <Suspense fallback={<Sidebar user={null} />}>
        <SidebarWithUser />
      </Suspense>
      <main className="flex-1 min-w-0 pb-24 md:pb-8 pt-4 md:pt-6 px-4 md:px-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  )
}
