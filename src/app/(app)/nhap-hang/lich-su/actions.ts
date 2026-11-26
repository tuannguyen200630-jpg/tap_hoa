'use server'

import { z } from 'zod'
import { CACHE_TAGS, createUserCache, getCacheIdentity } from '@/lib/cache'
import { matchesSearch } from '@/lib/search'
import { getSuppliers, type Supplier } from '../actions'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const NumberSchema = z
  .union([z.number(), z.string()])
  .pipe(z.coerce.number<string | number>().refine(Number.isFinite))

const PurchaseHistorySchema = z.object({
  id: z.string().regex(UUID_REGEX),
  code: z.string(),
  total_amount: z.number().int(),
  paid_amount: z.number().int(),
  debt_amount: z.number().int(),
  status: z.enum(['completed', 'cancelled']),
  note: z.string().nullable(),
  created_at: z.string(),
  supplier: z.object({ id: z.string().regex(UUID_REGEX), name: z.string() }).nullable(),
  items: z.array(z.object({
    product_name: z.string(),
    unit: z.string(),
    quantity: NumberSchema,
    cost_price: z.number().int(),
    subtotal: z.number().int(),
    expiry_date: z.string().nullable(),
  })),
})

const HistoryInputSchema = z.object({
  search: z.string().trim().max(120).optional(),
  period: z.enum(['all', 'today', 'week', 'month']).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  supplierId: z.string().regex(UUID_REGEX).optional().or(z.literal('')),
  payment: z.enum(['all', 'paid', 'debt']).optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

function todayInVietnam(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

const cachedPurchaseRows = createUserCache('purchase-history', [
  CACHE_TAGS.PURCHASES,
], async (supabase) => {
  const purchases: unknown[] = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        id, code, total_amount, paid_amount, debt_amount, status, note, created_at,
        supplier:suppliers(id, name),
        items:purchase_items(product_name, unit, quantity, cost_price, subtotal, expiry_date)
      `)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .range(offset, offset + 999)

    if (error) throw new Error('Không tải được lịch sử nhập hàng')
    purchases.push(...data)
    if (data.length < 1000) break
  }
  return purchases
})

export async function getPurchaseHistory(input: {
  search?: string
  period?: 'all' | 'today' | 'week' | 'month'
  fromDate?: string
  toDate?: string
  supplierId?: string
  payment?: 'all' | 'paid' | 'debt'
  offset?: number
  limit?: number
}) {
  const parsed = HistoryInputSchema.safeParse(input)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Bộ lọc không hợp lệ')

  const data = await cachedPurchaseRows(await getCacheIdentity())
  const rows = z.array(PurchaseHistorySchema).safeParse(data)
  if (!rows.success) {
    console.error('Dữ liệu lịch sử nhập hàng không hợp lệ:', rows.error)
    throw new Error('Dữ liệu lịch sử nhập hàng không đúng định dạng')
  }

  const query = parsed.data
  const today = todayInVietnam()
  let fromDate = query.fromDate || ''
  let toDate = query.toDate || ''

  if (!fromDate && !toDate) {
    if (query.period === 'today') {
      fromDate = today
      toDate = today
    } else if (query.period === 'week') {
      const date = new Date(`${today}T12:00:00+07:00`)
      date.setDate(date.getDate() - 6)
      fromDate = date.toISOString().slice(0, 10)
      toDate = today
    } else if (query.period === 'month') {
      fromDate = `${today.slice(0, 7)}-01`
      toDate = today
    }
  }

  const filtered = rows.data.filter((row) => {
    const purchaseDate = row.created_at.slice(0, 10)
    if (fromDate && purchaseDate < fromDate) return false
    if (toDate && purchaseDate > toDate) return false
    if (query.supplierId && row.supplier?.id !== query.supplierId) return false
    if (query.payment === 'paid' && row.debt_amount > 0) return false
    if (query.payment === 'debt' && row.debt_amount <= 0) return false
    if (!matchesSearch(
      query.search || '',
      row.code,
      row.supplier?.name,
      ...row.items.map((item) => item.product_name)
    )) return false
    return true
  })

  const offset = query.offset ?? 0
  const limit = query.limit ?? 20
  return {
    purchases: filtered.slice(offset, offset + limit),
    totalCount: filtered.length,
    totalAmount: filtered.reduce((sum, row) => sum + row.total_amount, 0),
  }
}

export async function getAllPurchaseHistory() {
  const data = await cachedPurchaseRows(await getCacheIdentity())
  const rows = z.array(PurchaseHistorySchema).safeParse(data)
  if (!rows.success) {
    console.error('Dữ liệu lịch sử nhập hàng không hợp lệ:', rows.error)
    throw new Error('Dữ liệu lịch sử nhập hàng không đúng định dạng')
  }

  return {
    purchases: rows.data,
    totalCount: rows.data.length,
    totalAmount: rows.data.reduce((sum, row) => sum + row.total_amount, 0),
  }
}

const cachedPurchaseDetails = createUserCache('purchase-details', [
  CACHE_TAGS.PURCHASES,
], async (supabase, purchaseId: string) => {
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      id, code, total_amount, paid_amount, debt_amount, status, note, created_at,
      supplier:suppliers(id, name, phone),
      items:purchase_items(id, product_name, unit, quantity, cost_price, subtotal, expiry_date)
    `)
    .eq('id', purchaseId)
    .single()

  if (error || !data) throw new Error('Không tải được chi tiết phiếu nhập')
  return data
})

export async function getPurchaseDetailsAction(id: string) {
  const purchaseId = z.string().regex(UUID_REGEX, 'Mã phiếu nhập không hợp lệ').safeParse(id)
  if (!purchaseId.success) throw new Error(purchaseId.error.issues[0]?.message)
  return cachedPurchaseDetails(await getCacheIdentity(), purchaseId.data)
}

export async function getPurchaseHistorySuppliers(): Promise<Supplier[]> {
  return getSuppliers()
}
