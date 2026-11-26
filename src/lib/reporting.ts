import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { CACHE_TAGS, createUserCache, type CacheIdentity } from '@/lib/cache'
import type { Database } from '@/lib/types/database'
import { DatabaseNumberSchema, uuidSchema } from '@/lib/validation'

export type ReportPeriod = 'today' | 'week' | 'month' | 'custom'
export type ReportDateRange = { from: string; to: string }

const ReportDataSchema = z.object({
  summary: z.object({
    revenue: DatabaseNumberSchema,
    gross_profit: DatabaseNumberSchema,
    invoice_count: DatabaseNumberSchema,
  }),
  daily: z.array(z.object({
    date: z.string(),
    revenue: DatabaseNumberSchema,
    gross_profit: DatabaseNumberSchema,
    invoice_count: DatabaseNumberSchema,
  })),
  top_products: z.array(z.object({
    code: z.string(),
    name: z.string(),
    unit: z.string(),
    quantity: DatabaseNumberSchema,
    revenue: DatabaseNumberSchema,
  })),
  slow_products: z.array(z.object({
    code: z.string(),
    name: z.string(),
    unit: z.string(),
    quantity: DatabaseNumberSchema,
    revenue: DatabaseNumberSchema,
  })),
  stock_value: DatabaseNumberSchema,
  low_stock: z.array(z.object({
    id: uuidSchema(),
    code: z.string(),
    name: z.string(),
    unit: z.string(),
    stock: DatabaseNumberSchema,
    warning_threshold: DatabaseNumberSchema,
  })),
  near_expiry: z.array(z.object({
    id: uuidSchema(),
    code: z.string(),
    name: z.string(),
    unit: z.string(),
    stock: DatabaseNumberSchema,
    expiry_date: z.string(),
  })),
})

export type ReportData = z.infer<typeof ReportDataSchema>

export function getVietnamToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value ?? ''

  return `${part('year')}-${part('month')}-${part('day')}`
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function dayDifference(from: string, to: string): number {
  return (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`))
    / (24 * 60 * 60 * 1000)
}

export function getReportDateRange(
  period: ReportPeriod,
  custom: Partial<ReportDateRange> = {},
  now = new Date()
): ReportDateRange {
  const today = getVietnamToday(now)
  if (period === 'today') return { from: today, to: today }
  if (period === 'week') {
    const weekday = new Date(`${today}T00:00:00.000Z`).getUTCDay()
    const daysSinceMonday = (weekday + 6) % 7
    return { from: addDays(today, -daysSinceMonday), to: today }
  }
  if (period === 'month') {
    return { from: `${today.slice(0, 7)}-01`, to: today }
  }

  const { from, to } = custom
  if (!from || !to || !isValidDate(from) || !isValidDate(to)) {
    throw new Error('Vui lòng chọn ngày bắt đầu và ngày kết thúc hợp lệ.')
  }
  if (from > to) {
    throw new Error('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.')
  }
  if (to > today) {
    throw new Error('Ngày kết thúc không được ở tương lai.')
  }
  if (dayDifference(from, to) > 365) {
    throw new Error('Mỗi báo cáo chỉ xem tối đa 366 ngày.')
  }

  return { from, to }
}

export async function fetchStoreReport(
  supabase: SupabaseClient<Database>,
  range: ReportDateRange
): Promise<ReportData> {
  const { data, error } = await supabase.rpc('get_store_report', {
    p_from_date: range.from,
    p_to_date: range.to,
  })

  if (error) throw error

  const parsed = ReportDataSchema.safeParse(data)
  if (!parsed.success) throw parsed.error
  return parsed.data
}

const cachedStoreReport = createUserCache('store-report', [
  CACHE_TAGS.SALES,
  CACHE_TAGS.PURCHASES,
  CACHE_TAGS.PRODUCTS,
], fetchStoreReport)

export function getCachedStoreReport(identity: CacheIdentity, range: ReportDateRange) {
  return cachedStoreReport(identity, range)
}
