import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { unstable_cache, updateTag } from 'next/cache'
import { cache } from 'react'
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

type AuthContext = {
  identity: CacheIdentity
  email: string | null
  name: string | null
}

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const supabase = await createClient()
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  const userId = claims?.sub
  if (claimsError || !claims || typeof userId !== 'string') {
    throw new Error('Bạn cần đăng nhập để tải dữ liệu.')
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (sessionError || !accessToken) {
    throw new Error('Bạn cần đăng nhập để tải dữ liệu.')
  }

  const metadata = claims.user_metadata
  const fullName = metadata?.full_name
  const storeName = metadata?.store_name
  const name = (typeof fullName === 'string' && fullName)
    || (typeof storeName === 'string' && storeName)
    || null

  return {
    identity: { userId, accessToken },
    email: typeof claims.email === 'string' ? claims.email : null,
    name,
  }
})

export const getCacheIdentity = cache(async (): Promise<CacheIdentity> => {
  return (await getAuthContext()).identity
})

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
