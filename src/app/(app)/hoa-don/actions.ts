'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { CACHE_TAGS, createUserCache, getCacheIdentity, invalidateCache } from '@/lib/cache'
import { createClient } from '@/lib/supabase/server'
import { DatabaseNumberSchema, uuidSchema } from '@/lib/validation'

const SaleListRowSchema = z.object({
  id: uuidSchema(),
  code: z.string(),
  customer_name: z.string().nullable(),
  final_amount: z.number().int(),
  payment_method: z.enum(['cash', 'transfer', 'debt']),
  status: z.enum(['completed', 'cancelled']),
  created_at: z.string(),
  item_count: DatabaseNumberSchema,
})

const SalesPageSchema = z.object({
  sales: z.array(SaleListRowSchema),
  total_count: DatabaseNumberSchema,
})

const SaleDateRowSchema = z.object({
  id: uuidSchema(),
  code: z.string(),
  customer: z.union([
    z.object({ name: z.string(), phone: z.string().nullable() }),
    z.array(z.object({ name: z.string(), phone: z.string().nullable() })),
  ]).nullable(),
  final_amount: z.number().int(),
  payment_method: z.enum(['cash', 'transfer', 'debt']),
  status: z.enum(['completed', 'cancelled']),
  created_at: z.string(),
  items: z.array(z.object({ count: DatabaseNumberSchema })).optional(),
})
type SaleDateListRow = z.infer<typeof SaleListRowSchema> & { customer_phone: string | null }

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Bạn cần đăng nhập để xem hóa đơn')
  return supabase
}

const ValidDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày xem hóa đơn không hợp lệ')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }, 'Ngày xem hóa đơn không hợp lệ')

const SalesPageInputSchema = z.object({
  date: ValidDateSchema,
  search: z.string().trim().max(120).optional(),
  page: z.number().int().min(1).max(1_000_000).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
})

const cachedSalesPage = createUserCache('sales-page', [
  CACHE_TAGS.SALES,
], async (supabase, query: z.infer<typeof SalesPageInputSchema>) => {
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 30
  const { data, error } = await supabase.rpc('list_sales_page', {
    p_date: query.date,
    p_search: query.search || null,
    p_page: page,
    p_page_size: pageSize,
  })

  if (error) {
    console.error('Lỗi lấy danh sách hóa đơn:', error)
    throw new Error('Không tải được danh sách hóa đơn')
  }

  const result = SalesPageSchema.safeParse(data)
  if (!result.success) {
    console.error('Dữ liệu danh sách hóa đơn không hợp lệ:', result.error)
    throw new Error('Dữ liệu hóa đơn không đúng định dạng')
  }

  return {
    sales: result.data.sales,
    totalCount: result.data.total_count,
  }
})

export async function getSalesPage(input: {
  date: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const parsed = SalesPageInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Thông tin tìm hóa đơn không hợp lệ')
  }
  return cachedSalesPage(await getCacheIdentity(), parsed.data)
}

const cachedSalesForDate = createUserCache('sales-for-date', [
  CACHE_TAGS.SALES,
], async (supabase, date: string) => {
  const start = new Date(`${date}T00:00:00+07:00`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  const rows: SaleDateListRow[] = []
  const pageSize = 1000

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('sales')
      .select('id, code, final_amount, payment_method, status, created_at, customer:customers(name, phone), items:sale_items(count)')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString())
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Lỗi lấy danh sách hóa đơn theo ngày:', error)
      throw new Error('Không tải được danh sách hóa đơn')
    }

    const page = z.array(SaleDateRowSchema).safeParse(data)
    if (!page.success) {
      console.error('Dữ liệu hóa đơn theo ngày không hợp lệ:', page.error)
      throw new Error('Dữ liệu hóa đơn không đúng định dạng')
    }

    rows.push(...page.data.map((sale) => {
      const customer = Array.isArray(sale.customer) ? sale.customer[0] : sale.customer
      return {
        id: sale.id,
        code: sale.code,
        customer_name: customer?.name ?? null,
        customer_phone: customer?.phone ?? null,
        final_amount: sale.final_amount,
        payment_method: sale.payment_method,
        status: sale.status,
        created_at: sale.created_at,
        item_count: sale.items?.reduce((sum, item) => sum + Number(item.count), 0) ?? 0,
      }
    }))
    if (page.data.length < pageSize) break
  }

  return { sales: rows, totalCount: rows.length }
})

export async function getSalesForDate(input: { date: string }) {
  const parsed = ValidDateSchema.safeParse(input.date)
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Ngày xem hóa đơn không hợp lệ')
  return cachedSalesForDate(await getCacheIdentity(), parsed.data)
}

const cachedSaleDetails = createUserCache('sale-details', [
  CACHE_TAGS.SALES,
], async (supabase, saleId: string) => {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      id, code, total_amount, discount_amount, final_amount,
      customer_paid, change_amount, debt_amount, payment_method, status,
      cancel_reason, note, created_at,
      customer:customers(id, name, phone),
      items:sale_items(id, product_code, product_name, unit, quantity, sell_price, cost_price, subtotal)
    `)
    .eq('id', saleId)
    .single()

  if (error || !data) {
    console.error('Lỗi lấy chi tiết hóa đơn:', error)
    throw new Error('Không tải được chi tiết hóa đơn')
  }
  return data
})

export async function getSaleDetailsAction(id: string) {
  const saleId = uuidSchema().safeParse(id)
  if (!saleId.success) throw new Error('Mã hóa đơn không hợp lệ')
  return cachedSaleDetails(await getCacheIdentity(), saleId.data)
}

export async function cancelSaleAction(
  id: string,
  reason: string
): Promise<{ error?: string; success?: boolean; code?: string }> {
  const supabase = await getAuthenticatedClient()
  const saleId = uuidSchema().safeParse(id)
  const cancellationReason = z.string().trim().min(3, 'Vui lòng nhập lý do hủy hóa đơn')
    .max(500, 'Lý do hủy không được dài quá 500 ký tự')
    .safeParse(reason)

  if (!saleId.success) return { error: 'Hóa đơn không hợp lệ' }
  if (!cancellationReason.success) {
    return { error: cancellationReason.error.issues[0]?.message || 'Vui lòng nhập lý do hủy hóa đơn' }
  }

  const { data, error } = await supabase.rpc('cancel_sale', {
    p_sale_id: saleId.data,
    p_reason: cancellationReason.data,
  })

  if (error) {
    console.error('Lỗi hủy hóa đơn:', error)
    const message = error.message.includes('đã được hủy')
      ? 'Hóa đơn này đã được hủy trước đó.'
      : 'Không hủy được hóa đơn. Vui lòng kiểm tra trạng thái hóa đơn và thử lại.'
    return { error: message }
  }

  const result = z.object({ success: z.literal(true), code: z.string() }).safeParse(data)
  if (!result.success) {
    console.error('Dữ liệu kết quả hủy hóa đơn không hợp lệ:', result.error)
    return { error: 'Không xác nhận được kết quả hủy. Hãy tải lại danh sách hóa đơn.' }
  }

  revalidatePath('/hoa-don')
  revalidatePath('/ban-hang')
  revalidatePath('/hang-hoa')
  revalidatePath('/so-no')
  invalidateCache(CACHE_TAGS.PRODUCTS, CACHE_TAGS.SALES, CACHE_TAGS.DEBTS)
  return { success: true, code: result.data.code }
}
