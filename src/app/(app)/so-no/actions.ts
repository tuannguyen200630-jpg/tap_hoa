'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { CACHE_TAGS, createUserCache, getCacheIdentity, invalidateCache } from '@/lib/cache'
import { createClient } from '@/lib/supabase/server'
import { DatabaseNumberSchema, uuidSchema } from '@/lib/validation'

const DebtTargetSchema = z.enum(['customer', 'supplier'])

const DebtContactSchema = z.object({
  id: uuidSchema(),
  name: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  note: z.string().nullable(),
  debt: DatabaseNumberSchema,
  created_at: z.string(),
})

const DebtContactPageSchema = z.object({
  contacts: z.array(DebtContactSchema),
  total_debt: DatabaseNumberSchema,
  total_count: DatabaseNumberSchema,
})

export type DebtTarget = z.infer<typeof DebtTargetSchema>
export type DebtContact = z.infer<typeof DebtContactSchema>
export type DebtContactPage = {
  contacts: DebtContact[]
  totalDebt: number
  totalCount: number
}

export type DebtOrigin = {
  id: string
  code: string
  amount: number
  totalAmount: number
  status: 'completed' | 'cancelled'
  cancelReason: string | null
  createdAt: string
}

export type DebtPayment = {
  id: string
  amount: number
  paymentType: 'pay_debt' | 'add_debt'
  note: string | null
  createdAt: string
}

export type DebtHistory = {
  origins: DebtOrigin[]
  originCount: number
  payments: DebtPayment[]
  paymentCount: number
}

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Bạn cần đăng nhập để sử dụng sổ nợ')
  return supabase
}

const DebtContactsInputSchema = z.object({
  targetType: DebtTargetSchema,
  search: z.string().trim().max(120).optional(),
  page: z.number().int().min(1).max(1_000_000).optional(),
})

const cachedDebtContacts = createUserCache('debt-contacts', [
  CACHE_TAGS.DEBTS,
], async (supabase, query: z.infer<typeof DebtContactsInputSchema>): Promise<DebtContactPage> => {
  const { data, error } = await supabase.rpc('list_debt_contacts', {
    p_target_type: query.targetType,
    p_search: query.search || null,
    p_page: query.page ?? 1,
    p_page_size: 30,
  })

  if (error) {
    console.error('Lỗi lấy danh sách sổ nợ:', error)
    throw new Error('Không tải được danh sách. Vui lòng thử lại.')
  }

  const result = DebtContactPageSchema.safeParse(data)
  if (!result.success) {
    console.error('Dữ liệu danh sách sổ nợ không hợp lệ:', result.error)
    throw new Error('Dữ liệu danh sách không đúng định dạng.')
  }

  return {
    contacts: result.data.contacts.map((contact) => ({
      ...contact,
      debt: Number(contact.debt),
    })),
    totalDebt: Number(result.data.total_debt),
    totalCount: Number(result.data.total_count),
  }
})

export async function getDebtContacts(input: {
  targetType: DebtTarget
  search?: string
  page?: number
}): Promise<DebtContactPage> {
  const parsed = DebtContactsInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Thông tin tìm kiếm không hợp lệ')
  }
  return cachedDebtContacts(await getCacheIdentity(), parsed.data)
}

export async function getAllDebtContacts(input: { targetType: DebtTarget }): Promise<DebtContactPage> {
  const parsedTarget = DebtTargetSchema.safeParse(input.targetType)
  if (!parsedTarget.success) throw new Error('Loại công nợ không hợp lệ')

  const identity = await getCacheIdentity()
  const firstPage = await cachedDebtContacts(identity, { targetType: parsedTarget.data, page: 1 })
  const pageCount = Math.ceil(firstPage.totalCount / 30)
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(pageCount - 1, 0) }, (_, index) =>
      cachedDebtContacts(identity, { targetType: parsedTarget.data, page: index + 2 })
    )
  )
  const contacts = [
    ...firstPage.contacts,
    ...remainingPages.flatMap((page) => page.contacts),
  ]

  return { ...firstPage, contacts }
}

const DebtHistoryInputSchema = z.object({
  targetType: DebtTargetSchema,
  targetId: uuidSchema(),
  originPage: z.number().int().min(1).max(1_000_000).optional(),
  paymentPage: z.number().int().min(1).max(1_000_000).optional(),
})

const cachedDebtHistory = createUserCache('debt-history', [
  CACHE_TAGS.DEBTS,
  CACHE_TAGS.SALES,
  CACHE_TAGS.PURCHASES,
], async (supabase, query: z.infer<typeof DebtHistoryInputSchema>): Promise<DebtHistory> => {
  const { targetType, targetId } = query
  const originPage = query.originPage ?? 1
  const paymentPage = query.paymentPage ?? 1
  const fromOrigin = (originPage - 1) * 20
  const fromPayment = (paymentPage - 1) * 20

  const originQuery = targetType === 'customer'
    ? supabase
      .from('sales')
      .select('id, code, debt_amount, total_amount, status, cancel_reason, created_at', { count: 'exact' })
      .eq('customer_id', targetId)
      .gt('debt_amount', 0)
      .order('created_at', { ascending: false })
      .range(fromOrigin, fromOrigin + 19)
    : supabase
      .from('purchases')
      .select('id, code, debt_amount, total_amount, status, created_at', { count: 'exact' })
      .eq('supplier_id', targetId)
      .gt('debt_amount', 0)
      .order('created_at', { ascending: false })
      .range(fromOrigin, fromOrigin + 19)

  const paymentQuery = supabase
    .from('payments')
    .select('id, amount, payment_type, note, created_at', { count: 'exact' })
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })
    .range(fromPayment, fromPayment + 19)

  const [originResult, paymentResult] = await Promise.all([originQuery, paymentQuery])
  if (originResult.error) {
    console.error('Lỗi lấy lịch sử phát sinh công nợ:', originResult.error)
    throw new Error('Không tải được lịch sử phát sinh công nợ.')
  }
  if (paymentResult.error) {
    console.error('Lỗi lấy lịch sử thanh toán:', paymentResult.error)
    throw new Error('Không tải được lịch sử thanh toán.')
  }

  const origins: DebtOrigin[] = (originResult.data || []).map((origin) => ({
    id: origin.id,
    code: origin.code,
    amount: origin.debt_amount,
    totalAmount: origin.total_amount,
    status: origin.status,
    cancelReason: 'cancel_reason' in origin ? origin.cancel_reason : null,
    createdAt: origin.created_at,
  }))

  return {
    origins,
    originCount: originResult.count ?? 0,
    payments: (paymentResult.data || []).map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      paymentType: payment.payment_type,
      note: payment.note,
      createdAt: payment.created_at,
    })),
    paymentCount: paymentResult.count ?? 0,
  }
})

export async function getDebtHistoryAction(input: {
  targetType: DebtTarget
  targetId: string
  originPage?: number
  paymentPage?: number
}): Promise<DebtHistory> {
  const parsed = DebtHistoryInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Thông tin lịch sử không hợp lệ')
  }
  return cachedDebtHistory(await getCacheIdentity(), parsed.data)
}

const SaveDebtContactSchema = z.object({
  targetType: DebtTargetSchema,
  id: uuidSchema().optional(),
  name: z.string().trim().min(1, 'Vui lòng nhập tên').max(150),
  phone: z.string().trim().max(30).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  note: z.string().trim().max(1000).nullable().optional(),
})

export async function saveDebtContactAction(input: {
  targetType: DebtTarget
  id?: string
  name: string
  phone?: string | null
  address?: string | null
  note?: string | null
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await getAuthenticatedClient()
  const parsed = SaveDebtContactSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Thông tin không hợp lệ' }
  }

  const { targetType, id, name, phone, address, note } = parsed.data
  const values = {
    name,
    phone: phone?.trim() || null,
    address: address?.trim() || null,
    note: note?.trim() || null,
  }

  const result = targetType === 'customer'
    ? id
      ? await supabase.from('customers').update(values).eq('id', id).select('id').maybeSingle()
      : await supabase.from('customers').insert(values).select('id').single()
    : id
      ? await supabase.from('suppliers').update(values).eq('id', id).select('id').maybeSingle()
      : await supabase.from('suppliers').insert(values).select('id').single()

  if (result.error) {
    console.error('Lỗi lưu thông tin khách hàng hoặc nhà cung cấp:', result.error)
    return { error: 'Không lưu được thông tin. Vui lòng thử lại.' }
  }
  if (!result.data) {
    console.error('Không tìm thấy khách hàng hoặc nhà cung cấp cần cập nhật.')
    return { error: 'Không tìm thấy thông tin cần cập nhật. Vui lòng tải lại trang.' }
  }

  revalidatePath('/so-no')
  revalidatePath(targetType === 'customer' ? '/ban-hang' : '/nhap-hang')
  invalidateCache(
    CACHE_TAGS.DEBTS,
    ...(targetType === 'supplier' ? [CACHE_TAGS.PURCHASES] : [])
  )
  return { success: true }
}

const RecordPaymentSchema = z.object({
  targetType: DebtTargetSchema,
  targetId: uuidSchema(),
  amount: z.number().int().min(1).max(2_147_483_647),
  note: z.string().trim().max(500).nullable().optional(),
})

export async function recordDebtPaymentAction(input: {
  targetType: DebtTarget
  targetId: string
  amount: number
  note?: string | null
}): Promise<{ error?: string; newDebt?: number }> {
  const supabase = await getAuthenticatedClient()
  const parsed = RecordPaymentSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Thông tin thanh toán không hợp lệ' }
  }

  const { data, error } = await supabase.rpc('record_payment', {
    p_target_type: parsed.data.targetType,
    p_target_id: parsed.data.targetId,
    p_amount: parsed.data.amount,
    p_payment_type: 'pay_debt',
    p_note: parsed.data.note?.trim() || null,
  })

  if (error) {
    console.error('Lỗi ghi nhận thanh toán công nợ:', error)
    if (error.message.includes('vượt quá số nợ hiện tại')) {
      return { error: 'Số tiền đã vượt quá số nợ hiện tại. Vui lòng tải lại trang và thử lại.' }
    }
    return { error: 'Không ghi nhận được thanh toán. Vui lòng thử lại.' }
  }

  const result = z.object({
    success: z.literal(true),
    new_debt: DatabaseNumberSchema,
  }).safeParse(data)
  if (!result.success) {
    console.error('Kết quả ghi nhận thanh toán không hợp lệ:', result.error)
    return { error: 'Không xác nhận được kết quả thanh toán. Vui lòng kiểm tra lại sổ nợ.' }
  }

  revalidatePath('/so-no')
  revalidatePath('/ban-hang')
  revalidatePath('/nhap-hang')
  invalidateCache(
    CACHE_TAGS.DEBTS,
    ...(parsed.data.targetType === 'supplier' ? [CACHE_TAGS.PURCHASES] : [])
  )
  return { newDebt: Number(result.data.new_debt) }
}
