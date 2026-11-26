'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { calculateCartSubtotal } from '@/lib/sales'
import { CACHE_TAGS, createUserCache, getCacheIdentity, invalidateCache } from '@/lib/cache'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/types/database'
import { DatabaseNumberSchema, uuidSchema } from '@/lib/validation'

const SaleCatalogRowSchema = z.object({
  id: uuidSchema(),
  code: z.string(),
  name: z.string(),
  barcode: z.string().nullable(),
  category_id: uuidSchema().nullable(),
  unit: z.string(),
  sell_price: z.number().int(),
  stock: DatabaseNumberSchema,
  category_name: z.string().nullable(),
  category_code: z.string().nullable(),
})

const SaleProductCategorySchema = z.object({
  id: uuidSchema(),
  name: z.string(),
  code: z.string(),
})

const SaleCatalogTableRowSchema = SaleCatalogRowSchema
  .omit({ category_name: true, category_code: true })
  .extend({
    category: z.union([
      SaleProductCategorySchema,
      z.array(SaleProductCategorySchema),
    ]).nullable(),
  })

const SaleCatalogPageSchema = z.object({
  products: z.array(SaleCatalogRowSchema),
  total_count: DatabaseNumberSchema,
})

const FavoriteProductRowSchema = z.object({
  id: uuidSchema(),
  code: z.string(),
  name: z.string(),
  barcode: z.string().nullable(),
  category_id: uuidSchema().nullable(),
  unit: z.string(),
  sell_price: DatabaseNumberSchema.pipe(z.number().int()),
  stock: DatabaseNumberSchema,
  category_name: z.string().nullable(),
  category_code: z.string().nullable(),
  sold_quantity: DatabaseNumberSchema,
})

const FavoriteProductsSchema = z.object({
  products: z.array(FavoriteProductRowSchema),
})

export type SaleProduct = Omit<
  z.infer<typeof SaleCatalogRowSchema>,
  'category_name' | 'category_code'
> & {
  category: { id: string; name: string; code: string } | null
  sold_quantity: number
}

export type SaleCatalogProduct = Omit<
  z.infer<typeof SaleCatalogRowSchema>,
  'category_name' | 'category_code'
> & {
  category: { id: string; name: string; code: string } | null
}

export type SaleCustomer = {
  id: string
  name: string
  phone: string | null
  debt: number
}

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Bạn cần đăng nhập để sử dụng chức năng bán hàng')
  return supabase
}

const cachedGetFavoriteProducts = createUserCache('favorite-sale-products', [
  CACHE_TAGS.PRODUCTS,
  CACHE_TAGS.CATEGORIES,
  CACHE_TAGS.SALES,
], async (supabase, query: SaleProductQuery): Promise<SaleProduct[]> => {
  try {
    const { data, error } = await supabase.rpc('get_favorite_products', {
      p_limit: 20,
    })
    if (error) {
      throw error
    }

    const parsed = FavoriteProductsSchema.safeParse(data)
    if (!parsed.success) {
      console.error('Dữ liệu món hàng bán chạy không hợp lệ:', parsed.error)
      throw new Error('Dữ liệu món hàng bán chạy không đúng định dạng')
    }

    const searchTerm = query.search?.trim().toLocaleLowerCase('vi')
    const normalize = (value: string) => value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLocaleLowerCase('vi')
    const normalizedSearch = searchTerm ? normalize(searchTerm) : ''

    return parsed.data.products
      .filter((product) => !query.categoryId || product.category_id === query.categoryId)
      .filter((product) => !normalizedSearch || [
        product.name,
        product.code,
        product.barcode ?? '',
      ].some((value) => normalize(value).includes(normalizedSearch)))
      .map(({ category_name, category_code, ...product }) => ({
        ...product,
        category: product.category_id && category_name && category_code
          ? { id: product.category_id, name: category_name, code: category_code }
          : null,
      }))
      .slice(0, 9)
  } catch (error) {
    console.error('Lỗi lấy món hàng bán chạy:', error)
    throw new Error('Không tải được danh sách món hàng bán chạy')
  }
})

type SaleProductQuery = {
  search?: string
  categoryId?: string
}

type SaleProductPageQuery = SaleProductQuery & {
  page?: number
  pageSize?: number
}

const SaleProductQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  categoryId: uuidSchema().optional(),
})

const SaleProductPageQuerySchema = SaleProductQuerySchema.extend({
  page: z.number().int().min(1).max(1_000_000).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
})

export async function getFavoriteProducts(input: SaleProductQuery = {}): Promise<SaleProduct[]> {
  const query = SaleProductQuerySchema.safeParse(input)
  if (!query.success) {
    console.error('Thông tin lọc món hàng bán chạy không hợp lệ:', query.error)
    return []
  }
  return cachedGetFavoriteProducts(await getCacheIdentity(), query.data)
}

async function fetchSaleProductPage(
  supabase: Awaited<ReturnType<typeof getAuthenticatedClient>>,
  query: { search?: string; categoryId?: string; page: number; pageSize: number }
) {
  const { data, error } = await supabase.rpc('list_products_page', {
    p_search: query.search || null,
    p_category_id: query.categoryId || null,
    p_filter: 'all',
    p_page: query.page,
    p_page_size: query.pageSize,
  })
  if (error) {
    console.error('Lỗi tìm hàng hóa khi bán:', error)
    throw new Error('Không tìm được hàng hóa. Vui lòng thử lại')
  }

  const parsed = SaleCatalogPageSchema.safeParse(data)
  if (!parsed.success) {
    console.error('Dữ liệu hàng hóa khi bán không hợp lệ:', parsed.error)
    throw new Error('Dữ liệu hàng hóa không đúng định dạng')
  }

  return {
    products: parsed.data.products.map(({ category_name, category_code, ...product }) => ({
      ...product,
      category: product.category_id && category_name && category_code
        ? { id: product.category_id, name: category_name, code: category_code }
        : null,
    })),
    totalCount: parsed.data.total_count,
  }
}

const cachedFetchSaleProductPage = createUserCache('sale-product-page', [
  CACHE_TAGS.PRODUCTS,
  CACHE_TAGS.CATEGORIES,
  CACHE_TAGS.SETTINGS,
], async (supabase, query: {
  search?: string
  categoryId?: string
  page: number
  pageSize: number
}) => fetchSaleProductPage(supabase, query))

const cachedAllSaleProducts = createUserCache('sale-product-catalog', [
  CACHE_TAGS.PRODUCTS,
  CACHE_TAGS.CATEGORIES,
  CACHE_TAGS.SETTINGS,
], async (supabase, query: SaleProductQuery) => {
  if (!query.search?.trim()) {
    const fetchProductPage = (offset: number) => {
      let productsQuery = supabase
        .from('products')
        .select(
          'id, code, name, barcode, category_id, unit, sell_price, stock, category:categories(id, name, code)',
          { count: 'exact' }
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })

      if (query.categoryId) {
        productsQuery = productsQuery.eq('category_id', query.categoryId)
      }

      return productsQuery.range(offset, offset + 999)
    }

    const parseProducts = (data: unknown): SaleCatalogProduct[] => {
      const parsed = z.array(SaleCatalogTableRowSchema).safeParse(data)
      if (!parsed.success) {
        console.error('Dữ liệu hàng hóa khi bán không hợp lệ:', parsed.error)
        throw new Error('Dữ liệu hàng hóa không đúng định dạng')
      }

      return parsed.data.map(({ category, ...product }) => {
        const normalizedCategory = Array.isArray(category) ? category[0] : category
        return { ...product, category: normalizedCategory ?? null }
      })
    }

    const firstPage = await fetchProductPage(0)
    if (firstPage.error) {
      console.error('Lỗi lấy danh sách hàng hóa khi bán:', firstPage.error)
      throw new Error('Không tải được danh sách hàng hóa')
    }
    if (firstPage.count === null) {
      console.error('Không nhận được tổng số hàng hóa khi bán.')
      throw new Error('Không tải được danh sách hàng hóa')
    }

    const totalCount = firstPage.count
    const products = parseProducts(firstPage.data)
    if (totalCount > 1000) {
      const offsets = Array.from(
        { length: Math.ceil(totalCount / 1000) - 1 },
        (_, index) => (index + 1) * 1000
      )
      const remainingPages = await Promise.all(offsets.map(fetchProductPage))
      for (const page of remainingPages) {
        if (page.error) {
          console.error('Lỗi lấy danh sách hàng hóa khi bán:', page.error)
          throw new Error('Không tải được danh sách hàng hóa')
        }
        products.push(...parseProducts(page.data))
      }
    }

    return { products, totalCount }
  }

  const pageSize = 50
  const products: Awaited<ReturnType<typeof fetchSaleProductPage>>['products'] = []
  let totalCount = 0

  for (let page = 1; ; page += 1) {
    const result = await fetchSaleProductPage(supabase, {
      ...query,
      page,
      pageSize,
    })
    if (page === 1) totalCount = result.totalCount
    products.push(...result.products)
    if (products.length >= totalCount || result.products.length < pageSize) break
  }

  return { products, totalCount }
})

export async function getSaleProducts(input: SaleProductPageQuery) {
  const query = SaleProductPageQuerySchema.safeParse(input)
  if (!query.success) {
    throw new Error(query.error.issues[0]?.message || 'Thông tin tìm hàng hóa không hợp lệ')
  }

  return cachedFetchSaleProductPage(await getCacheIdentity(), {
    ...query.data,
    page: query.data.page ?? 1,
    pageSize: query.data.pageSize ?? 50,
  })
}

export async function getAllSaleProducts(input: SaleProductQuery = {}) {
  const query = SaleProductQuerySchema.safeParse(input)
  if (!query.success) {
    throw new Error(query.error.issues[0]?.message || 'Thông tin hàng hóa không hợp lệ')
  }
  return cachedAllSaleProducts(await getCacheIdentity(), query.data)
}

const cachedGetSaleCustomers = createUserCache('sale-customers', [
  CACHE_TAGS.DEBTS,
], async (supabase): Promise<SaleCustomer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, debt')
    .order('name', { ascending: true })

  if (error) {
    console.error('Lỗi lấy danh sách khách hàng:', error)
    throw new Error('Không tải được danh sách khách hàng')
  }
  return data || []
})

export async function getSaleCustomers(): Promise<SaleCustomer[]> {
  return cachedGetSaleCustomers(await getCacheIdentity())
}

const cachedGetSellOutSetting = createUserCache('sell-out-setting', [
  CACHE_TAGS.PRODUCTS,
  CACHE_TAGS.CATEGORIES,
  CACHE_TAGS.SETTINGS,
], async (supabase): Promise<boolean> => {
  const { data, error } = await supabase
    .from('settings')
    .select('allow_sell_out_of_stock')
    .eq('id', 'default')
    .single()

  if (error || !data) {
    console.error('Lỗi lấy cài đặt bán khi hết hàng:', error)
    throw new Error('Không tải được cài đặt bán hàng')
  }
  return data.allow_sell_out_of_stock
})

export async function getSellOutSetting(): Promise<boolean> {
  return cachedGetSellOutSetting(await getCacheIdentity())
}

const QuickCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên khách hàng').max(120),
  phone: z.string().trim().max(30).optional().nullable(),
})

export async function createQuickCustomerAction(input: {
  name: string
  phone?: string | null
}): Promise<{ error?: string; customer?: SaleCustomer }> {
  const supabase = await getAuthenticatedClient()
  const parsed = QuickCustomerSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Thông tin khách hàng không hợp lệ' }
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: parsed.data.name,
      phone: parsed.data.phone?.trim() || null,
    })
    .select('id, name, phone, debt')
    .single()

  if (error) {
    console.error('Lỗi tạo nhanh khách hàng:', error)
    return { error: 'Không thêm được khách hàng. Vui lòng thử lại.' }
  }

  revalidatePath('/so-no')
  invalidateCache(CACHE_TAGS.DEBTS)
  return { customer: data }
}

const SaleItemSchema = z.object({
  product_id: uuidSchema('Món hàng không hợp lệ'),
  quantity: z.number().positive().max(999_999_999.999)
    .refine(
      (quantity) => Math.abs(quantity * 1000 - Math.round(quantity * 1000)) < 1e-8,
      'Số lượng chỉ được có tối đa 3 chữ số thập phân'
    ),
  sell_price: z.number().int().min(0).max(2_147_483_647),
})

const CreateSaleSchema = z.object({
  customer_id: uuidSchema().nullable(),
  discount_amount: z.number().int().min(0).max(2_147_483_647).default(0),
  customer_paid: z.number().int().min(0).max(2_147_483_647).optional(),
  payment_method: z.enum(['cash', 'transfer', 'debt']),
  note: z.string().trim().max(500).nullable().default(null),
  items: z.array(SaleItemSchema).min(1, 'Giỏ hàng đang trống').max(100),
}).refine(
  ({ items }) => new Set(items.map((item) => item.product_id)).size === items.length,
  'Mỗi món hàng chỉ được có một dòng trong giỏ'
)

export async function createSaleAction(input: {
  customer_id: string | null
  discount_amount?: number
  customer_paid?: number
  payment_method: 'cash' | 'transfer' | 'debt'
  note?: string | null
  items: Array<{ product_id: string; quantity: number; sell_price: number }>
}): Promise<{
  error?: string
  sale?: {
    sale_id: string
    code: string
    total_amount: number
    final_amount: number
    debt_amount: number
    change_amount: number
  }
}> {
  const supabase = await getAuthenticatedClient()
  const parsed = CreateSaleSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Thông tin hóa đơn không hợp lệ' }
  }
  const sale = parsed.data

  if (sale.payment_method === 'debt' && !sale.customer_id) {
    return { error: 'Vui lòng chọn hoặc thêm khách hàng khi ghi nợ' }
  }

  const subtotal = calculateCartSubtotal(sale.items.map((item) => ({
    quantity: item.quantity,
    unitPrice: item.sell_price,
  })))
  if (!Number.isSafeInteger(subtotal) || subtotal > 2_147_483_647) {
    return { error: 'Tổng tiền vượt giới hạn cho phép. Hãy chia hóa đơn thành hai lần bán.' }
  }

  if (sale.discount_amount > subtotal) {
    return { error: 'Tiền giảm giá không được lớn hơn tổng tiền hàng' }
  }
  const amountDue = subtotal - sale.discount_amount
  const normalizedCustomerPaid = sale.payment_method === 'debt'
    ? 0
    : sale.customer_paid ?? amountDue
  if (sale.payment_method !== 'debt' && normalizedCustomerPaid < amountDue) {
    return { error: 'Số tiền khách đưa chưa đủ. Hãy chọn Ghi nợ nếu khách chưa trả đủ.' }
  }
  if (sale.payment_method === 'debt' && normalizedCustomerPaid !== 0) {
    return { error: 'Hóa đơn ghi nợ sẽ được ghi toàn bộ số tiền còn phải trả' }
  }

  const items: Json = sale.items.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    sell_price: item.sell_price,
  }))

  const { data, error } = await supabase.rpc('create_sale', {
    p_customer_id: sale.customer_id,
    p_discount_amount: sale.discount_amount,
    p_customer_paid: normalizedCustomerPaid,
    p_payment_method: sale.payment_method,
    p_note: sale.note || null,
    p_items: items,
  })

  if (error) {
    console.error('Lỗi tạo hóa đơn:', error)
    const message = error.message.toLowerCase().includes('hết hàng')
      ? 'Không thể bán vì số lượng còn trong kho không đủ và cài đặt hiện không cho phép bán vượt số lượng.'
      : 'Không hoàn tất được hóa đơn. Vui lòng kiểm tra lại thông tin và thử lại.'
    return { error: message }
  }

  const resultSchema = z.object({
    success: z.literal(true),
    sale_id: uuidSchema(),
    code: z.string(),
    total_amount: z.number().int(),
    final_amount: z.number().int(),
    debt_amount: z.number().int(),
    change_amount: z.number().int(),
  })
  const result = resultSchema.safeParse(data)
  if (!result.success) {
    console.error('Dữ liệu hóa đơn mới không hợp lệ:', result.error)
    return { error: 'Hóa đơn có thể đã được lưu. Hãy kiểm tra trang Hóa đơn trước khi thử lại.' }
  }

  revalidatePath('/ban-hang')
  revalidatePath('/hoa-don')
  revalidatePath('/hang-hoa')
  revalidatePath('/so-no')
  invalidateCache(CACHE_TAGS.PRODUCTS, CACHE_TAGS.SALES, CACHE_TAGS.DEBTS)
  return { sale: result.data }
}
