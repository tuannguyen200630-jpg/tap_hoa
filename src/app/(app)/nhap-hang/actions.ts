'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { calculateSuggestedPrice } from '@/lib/pricing'
import { CACHE_TAGS, createUserCache, getCacheIdentity, invalidateCache } from '@/lib/cache'
import { uuidSchema } from '@/lib/validation'

// ————————————————————————————————————
// Types
// ————————————————————————————————————

export type PurchaseProduct = {
  id: string
  code: string
  name: string
  barcode: string | null
  unit: string
  price_mode: 'auto' | 'fixed'
  base_cost: number
  base_price: number
  last_cost: number
  sell_price: number
  avg_cost: number
  stock: number
  min_stock: number
  category: { id: string; name: string } | null
}

export type PriceChangeItem = {
  product_id: string
  product_name: string
  old_cost: number
  new_cost: number
  old_price: number
  suggested_price: number
  base_cost: number
  base_price: number
}

export type Supplier = {
  id: string
  name: string
  phone: string | null
  debt: number
}

// ————————————————————————————————————
// Lấy danh sách hàng hóa đang hoạt động (để chọn khi nhập)
// ————————————————————————————————————
const cachedGetActiveProducts = createUserCache('purchase-products', [
  CACHE_TAGS.PRODUCTS,
  CACHE_TAGS.CATEGORIES,
  CACHE_TAGS.PURCHASES,
], async (supabase): Promise<PurchaseProduct[]> => {
  const products: PurchaseProduct[] = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, code, name, barcode, unit, price_mode,
        base_cost, base_price, last_cost, sell_price, avg_cost, stock, min_stock,
        category:categories(id, name)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(offset, offset + 999)

    if (error) {
      console.error('Lỗi lấy hàng hóa:', error)
      throw new Error('Không tải được danh sách hàng hóa để nhập')
    }

    products.push(...(data as unknown as PurchaseProduct[]))
    if (data.length < 1000) break
  }
  return products
})

export async function getActiveProducts(): Promise<PurchaseProduct[]> {
  return cachedGetActiveProducts(await getCacheIdentity())
}

// ————————————————————————————————————
// Lấy danh sách nhà cung cấp
// ————————————————————————————————————
const cachedGetSuppliers = createUserCache('purchase-suppliers', [
  CACHE_TAGS.PURCHASES,
], async (supabase): Promise<Supplier[]> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id, name, phone, debt')
    .order('name', { ascending: true })

  if (error) {
    console.error('Lỗi lấy nhà cung cấp:', error)
    throw new Error('Không tải được danh sách nhà cung cấp')
  }
  return data || []
})

export async function getSuppliers(): Promise<Supplier[]> {
  return cachedGetSuppliers(await getCacheIdentity())
}

// ————————————————————————————————————
// Lấy bước làm tròn giá từ cài đặt
// ————————————————————————————————————
const cachedGetRoundingStep = createUserCache('purchase-rounding-step', [
  CACHE_TAGS.SETTINGS,
], async (supabase): Promise<number> => {
  const { data, error } = await supabase
    .from('settings')
    .select('rounding_step')
    .eq('id', 'default')
    .single()

  if (error || !data) {
    console.error('Lỗi lấy bước làm tròn giá:', error)
    throw new Error('Không lấy được cài đặt làm tròn giá')
  }
  return data.rounding_step
})

export async function getRoundingStep(): Promise<number> {
  return cachedGetRoundingStep(await getCacheIdentity())
}

// ————————————————————————————————————
// Schema validate dòng nhập hàng
// ————————————————————————————————————
const PurchaseItemSchema = z.object({
  product_id: uuidSchema('Mã hàng không hợp lệ'),
  quantity: z.number().positive('Số lượng phải lớn hơn 0').max(999999999),
  cost_price: z.number().int().min(0, 'Giá nhập phải là số nguyên không âm').max(2147483647),
  expiry_date: z.string().optional().nullable(),
})

const CreatePurchaseSchema = z.object({
  supplier_id: uuidSchema().optional().nullable(),
  paid_amount: z.number().int().min(0, 'Số tiền trả phải là số nguyên không âm').max(2147483647),
  note: z.string().optional().nullable(),
  items: z.array(PurchaseItemSchema).min(1, 'Phải có ít nhất 1 món hàng'),
}).refine(
  ({ items }) => new Set(items.map((item) => item.product_id)).size === items.length,
  'Mỗi món hàng chỉ được xuất hiện một lần trong phiếu nhập'
)

// ————————————————————————————————————
// Tạo phiếu nhập hàng (gọi RPC create_purchase)
// ————————————————————————————————————
export async function createPurchaseAction(formData: {
  supplier_id: string | null
  paid_amount: number
  note: string | null
  items: Array<{
    product_id: string
    quantity: number
    cost_price: number
    expiry_date?: string | null
  }>
}): Promise<{
  error?: string
  success?: boolean
  purchase_id?: string
  code?: string
  total_amount?: number
  debt_amount?: number
  price_changes?: PriceChangeItem[]
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Bạn cần đăng nhập để thao tác' }

  const validated = CreatePurchaseSchema.safeParse(formData)
  if (!validated.success) {
    const firstErr = validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ'
    return { error: firstErr }
  }

  const { data } = validated
  const roundingStep = await getRoundingStep()

  const { data: result, error } = await supabase.rpc('create_purchase', {
    p_supplier_id: data.supplier_id ?? null,
    p_paid_amount: data.paid_amount,
    p_note: data.note ?? null,
    p_items: data.items as unknown as Parameters<typeof supabase.rpc<'create_purchase'>>[1] extends { p_items: infer T } ? T : never,
  })

  if (error) {
    console.error('Lỗi tạo phiếu nhập:', error)
    return { error: 'Lỗi khi tạo phiếu nhập hàng: ' + error.message }
  }

  const res = result as unknown as {
    success: boolean
    purchase_id: string
    code: string
    total_amount: number
    debt_amount: number
    price_changes: PriceChangeItem[]
  }

  const priceChangesWithFormula = (res.price_changes || []).map((pc) => ({
    ...pc,
    suggested_price: calculateSuggestedPrice(
      pc.base_cost,
      pc.base_price,
      pc.new_cost,
      roundingStep
    ),
  }))

  revalidatePath('/nhap-hang')
  revalidatePath('/nhap-hang/lich-su')
  revalidatePath('/hang-hoa')
  revalidatePath('/ban-hang')
  revalidatePath('/hoa-don')
  invalidateCache(CACHE_TAGS.PRODUCTS, CACHE_TAGS.PURCHASES, CACHE_TAGS.DEBTS)

  return {
    success: true,
    purchase_id: res.purchase_id,
    code: res.code,
    total_amount: res.total_amount,
    debt_amount: res.debt_amount,
    price_changes: priceChangesWithFormula,
  }
}

// ————————————————————————————————————
// Xác nhận thay đổi giá (gọi RPC confirm_price_change)
// ————————————————————————————————————
export async function confirmPriceChangeAction(
  productId: string,
  newPrice: number,
  newCost: number,
  oldCost: number,
  isAcceptedSuggested: boolean
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Bạn cần đăng nhập để thao tác' }

  if (!Number.isSafeInteger(newPrice) || newPrice < 0) {
    return { error: 'Giá bán phải là số nguyên không âm' }
  }
  if (!Number.isSafeInteger(newCost) || !Number.isSafeInteger(oldCost) || oldCost < 0 || newCost < 0) {
    return { error: 'Giá nhập không hợp lệ' }
  }

  const { error } = await supabase.rpc('confirm_price_change', {
    p_product_id: productId,
    p_new_price: newPrice,
    p_new_cost: newCost,
    p_old_cost: oldCost,
    p_is_accepted_suggested: isAcceptedSuggested,
  })

  if (error) {
    console.error('Lỗi xác nhận giá:', error)
    return { error: 'Lỗi khi xác nhận giá: ' + error.message }
  }

  revalidatePath('/hang-hoa')
  revalidatePath('/ban-hang')
  revalidatePath('/nhap-hang')
  invalidateCache(CACHE_TAGS.PRODUCTS)

  return { success: true }
}

// ————————————————————————————————————
// Tạo nhanh hàng mới ngay trong màn hình nhập
// (tái dùng logic từ hàng hóa, giản lược)
// ————————————————————————————————————
export async function quickCreateProductAction(formData: {
  name: string
  categoryId: string
  unit: string
  costPrice: number
  sellPrice: number
}): Promise<{ error?: string; product?: PurchaseProduct }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Bạn cần đăng nhập để thao tác' }

  // Dùng lại action từ hàng hóa
  const { createProductAction } = await import('@/app/(app)/hang-hoa/actions')

  const res = await createProductAction({
    name: formData.name,
    categoryId: formData.categoryId,
    unit: formData.unit,
    priceMode: 'auto',
    costPrice: formData.costPrice,
    sellPrice: formData.sellPrice,
    initialStock: 0,
    minStock: 5,
  })

  if (res.error) return { error: res.error }

  if (res.product) {
    return {
      product: {
        id: res.product.id,
        code: res.product.code,
        name: res.product.name,
        barcode: null,
        unit: res.product.unit,
        price_mode: res.product.price_mode as 'auto' | 'fixed',
        base_cost: res.product.base_cost,
        base_price: res.product.base_price,
        last_cost: res.product.last_cost,
        sell_price: res.product.sell_price,
        avg_cost: res.product.avg_cost,
        stock: Number(res.product.stock),
        min_stock: Number(res.product.min_stock),
        category: null,
      },
    }
  }

  return { error: 'Lỗi không xác định' }
}

