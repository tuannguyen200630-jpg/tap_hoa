import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { unstable_cache, updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

export const CACHE_TAGS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  SALES: 'sales',
  PURCHASES: 'purchases',
  DEBTS: 'debts',
  SETTINGS: 'settings',
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]

export type CacheIdentity = {
  userId: string
  accessToken: string
}

export async function getCacheIdentity(): Promise<CacheIdentity> {
  const supabase = await createClient()
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session) throw new Error('Bạn cần đăng nhập để tải dữ liệu.')

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user || user.id !== session.user.id) {
    throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.')
  }

  return { userId: user.id, accessToken: session.access_token }
}

function createCacheClient(accessToken: string): SupabaseClient<Database> {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export function createUserCache<Args extends unknown[], Result>(
  key: string,
  tags: readonly CacheTag[],
  fetcher: (supabase: SupabaseClient<Database>, ...args: Args) => Promise<Result>
): (identity: CacheIdentity, ...args: Args) => Promise<Result> {
  const cachedFetcher = unstable_cache(
    async (userId: string, accessToken: string, ...args: Args): Promise<Result> => {
      if (!userId || !accessToken) throw new Error('Thông tin phiên đăng nhập không hợp lệ.')
      return fetcher(createCacheClient(accessToken), ...args)
    },
    ['supabase-user-cache', key],
    { revalidate: 3600, tags: [...tags] }
  )

  return (identity, ...args) =>
    cachedFetcher(identity.userId, identity.accessToken, ...args)
}

export function invalidateCache(...tags: CacheTag[]): void {
  for (const tag of tags) updateTag(tag)
}
