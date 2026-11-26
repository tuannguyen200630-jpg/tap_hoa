import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import type { Database } from '@/lib/types/database'

export async function createClient() {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()])
  const forwardedProtocol = requestHeaders
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase()
  const requestOrigin = requestHeaders.get('origin') || requestHeaders.get('referer')
  const isHttps = forwardedProtocol
    ? forwardedProtocol === 'https'
    : requestOrigin?.startsWith('https://') ?? false

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        secure: isHttps,
        sameSite: 'lax',
        path: '/',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy.ts refreshing sessions.
          }
        },
      },
    }
  )
}
