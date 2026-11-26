'use server'

import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CACHE_TAGS, createUserCache, getCacheIdentity, invalidateCache } from '@/lib/cache'
import { normalizeSearch, removeDiacritics } from '@/lib/codes'
import { z } from 'zod'
import { DatabaseNumberSchema, uuidSchema } from '@/lib/validation'

// Schema validate thêm/sửa hàng hóa
const ProductSchema = z.object({
  name: z.string().trim().min(1, 'Tên món hàng không được để trống'),
  categoryId: uuidSchema('Vui lòng chọn nhóm hàng'),
  unit: z.string().trim().min(1, 'Đơn vị tính không được để trống'),
  priceMode: z.enum(['auto', 'fixed']).default('auto'),
  costPrice: z.number().int().min(0, 'Giá nhập phải là số đồng không âm').max(2147483647),
  sellPrice: z.number().int().min(0, 'Giá bán phải là số đồng không âm').max(2147483647),
  initialStock: z.number().min(0, 'Số lượng không được âm').max(999999999.999)
    .refine((value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-8, 'Số lượng tối đa 3 chữ số thập phân')
    .default(0),
  minStock: z.number().min(0, 'Ngưỡng báo sắp hết không được âm').max(999999999.999)
    .refine((value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-8, 'Ngưỡng tối đa 3 chữ số thập phân')
    .default(5),
  barcode: z.string().trim().max(100).optional().nullable(),
  expiryDate: z.string().optional().nullable(),
})

const ProductCatalogRowSchema = z.object({
  id: uuidSchema(),
  code: z.string(),
  name: z.string(),
  barcode: z.string().nullable(),
  category_id: uuidSchema().nullable(),
  unit: z.string(),
  price_mode: z.enum(['auto', 'fixed']),
  base_cost: z.number(),
  base_price: z.number(),
  last_cost: z.number(),
  sell_price: z.number(),
  avg_cost: z.number(),
  stock: DatabaseNumberSchema,
  min_stock: DatabaseNumberSchema,
  expiry_date: z.string().nullable(),
  image_url: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  category_name: z.string().nullable(),
  category_code: z.string().nullable(),
})

const ProductPageResultSchema = z.object({
  products: z.array(ProductCatalogRowSchema),
  total_count: DatabaseNumberSchema,
})

export type ProductCatalogItem = Omit<
  z.infer<typeof ProductCatalogRowSchema>,
  'category_name' | 'category_code'
> & {
  category: { id: string; name: string; code: string } | null
}

const cachedGetCategories = createUserCache('product-categories', [
  CACHE_TAGS.PRODUCTS,
  CACHE_TAGS.CATEGORIES,
], async (supabase) => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, code, name, description')
    .order('name', { ascending: true })

  if (error) {
    console.error('Lỗi lấy danh mục:', error)
    throw new Error('Không tải được danh sách nhóm hàng')
  }
  return data || []
})

export async function getCategories() {
  return cachedGetCategories(await getCacheIdentity())
}

const cachedGetExistingUnits = createUserCache('product-units', [
  CACHE_TAGS.PRODUCTS,
], async (supabase) => {
  const { data, error } = await supabase
    .from('products')
    .select('unit')
    .order('unit', { ascending: true })

  const defaultUnits = ['cái', 'lon', 'chai', 'gói', 'hộp', 'kg', 'vỉ', 'túi']
  if (error) {
    console.error('Lỗi lấy đơn vị tính:', error)
    throw new Error('Không tải được danh sách đơn vị tính')
  }

  const unitsSet = new Set<string>(defaultUnits)
  data.forEach((p) => {
    if (p.unit) unitsSet.add(p.unit)
  })
  return Array.from(unitsSet)
})

export async function getExistingUnits() {
  return cachedGetExistingUnits(await getCacheIdentity())
}

const cachedGetDefaultMinStockThreshold = createUserCache('default-min-stock-threshold', [
  CACHE_TAGS.SETTINGS,
], async (supabase): Promise<number> => {
  const { data, error } = await supabase
    .from('settings')
    .select('min_stock_threshold')
    .eq('id', 'default')
    .single()

  if (error) {
    console.error('Lỗi lấy ngưỡng cảnh báo mặc định:', error)
    throw new Error('Không tải được ngưỡng cảnh báo hàng sắp hết.')
  }
  return Number(data.min_stock_threshold)
})

export async function getDefaultMinStockThreshold(): Promise<number> {
  return cachedGetDefaultMinStockThreshold(await getCacheIdentity())
}

const cachedGetNextProductCode = createUserCache('next-product-code', [
  CACHE_TAGS.PRODUCTS,
  CACHE_TAGS.CATEGORIES,
], async (supabase, categoryId: string) => {
  const { data, error } = await supabase.rpc('get_next_product_code', {
    p_category_id: categoryId,
  })
  if (error || !data) {
    console.error('Lỗi tạo mã xem trước:', error)
    throw new Error('Không tạo được mã hàng xem trước')
  }
  return data
})

export async function getNextProductCode(categoryId: string) {
  return cachedGetNextProductCode(await getCacheIdentity(), categoryId)
}

type ProductQuery = {
  search?: string
  categoryId?: string
  filter?: 'all' | 'active' | 'low_stock' | 'near_expiry' | 'expiring' | 'inactive' | 'hidden' | 'catalog'
  priceMode?: 'all' | 'auto' | 'fixed'
  sortBy?: 'name_asc' | 'stock_asc' | 'stock_desc' | 'profit_desc' | 'sell_asc' | 'sell_desc'
  page?: number
  pageSize?: number
}

const cachedGetProducts = createUserCache('product-list', [
  CACHE_TAGS.PRODUCTS,
  CACHE_TAGS.CATEGORIES,
], async (supabase, params?: ProductQuery) => {
  const page = Math.max(1, Math.floor(params?.page ?? 1))
  const pageSize = Math.min(1_000_000, Math.max(1, Math.floor(params?.pageSize ?? 30)))
  const status = params?.filter ?? 'all'
  const search = params?.search?.trim()
  let futureDate: string | null = null
  if (status === 'near_expiry' || status === 'expiring') {
    const future = new Date()
    future.setDate(future.getDate() + 30)
    futureDate = [
      future.getFullYear(),
      String(future.getMonth() + 1).padStart(2, '0'),
      String(future.getDate()).padStart(2, '0'),
    ].join('-')
  }

  type DirectProductRow = z.infer<typeof ProductCatalogRowSchema> & {
    category?: { id: string; name: string; code: string } | { id: string; name: string; code: string }[] | null
  }

  const rows: DirectProductRow[] = []
  const fetchPage = (offset: number) => {
    let query = supabase
      .from('products')
      .select('id, code, name, barcode, category_id, unit, price_mode, base_cost, base_price, last_cost, sell_price, avg_cost, stock, min_stock, expiry_date, image_url, is_active, created_at, updated_at, category:categories(id, name, code)')

    if (status !== 'catalog') {
      query = query.eq('is_active', status === 'hidden' || status === 'inactive' ? false : true)
    }
    if (params?.categoryId && params.categoryId !== 'all') {
      query = query.eq('category_id', params.categoryId)
    }
    if (params?.priceMode && params.priceMode !== 'all') {
      query = query.eq('price_mode', params.priceMode)
    }
    if (futureDate) {
      query = query.not('expiry_date', 'is', null).lte('expiry_date', futureDate)
    }

    return query.order('created_at', { ascending: false }).range(offset, offset + 999)
  }

  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await fetchPage(offset)
    if (error) {
      console.error('Lỗi lấy danh sách hàng hóa:', error.message)
      throw new Error('Không tải được danh sách hàng hóa')
    }
    const pageRows = (data || []) as unknown as DirectProductRow[]
    rows.push(...pageRows)
    if (pageRows.length < 1000) break
  }

  const mappedRows = rows
    .map((row) => {
      const categoryRelation = row.category
      const category = Array.isArray(categoryRelation) ? categoryRelation[0] : categoryRelation
      return {
        ...row,
        category_name: category?.name ?? null,
        category_code: category?.code ?? null,
      }
    })

  let matched = mappedRows
  if (search) {
    const normalizedSearch = normalizeSearch(search)
    matched = matched.filter((row) =>
      [row.name, row.code, row.barcode]
        .some((value) => value !== null && normalizeSearch(value).includes(normalizedSearch))
    )
  }
  if (status === 'low_stock') {
    matched = matched.filter((row) => Number(row.stock) <= Number(row.min_stock))
  }
  if (status === 'near_expiry' || status === 'expiring') {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const future = new Date(todayStart)
    future.setDate(future.getDate() + 30)
    matched = matched.filter((row) => {
      if (!row.expiry_date) return false
      const expiry = new Date(`${row.expiry_date}T23:59:59`)
      return expiry <= future
    })
  }

  matched = [...matched].sort((a, b) => {
    switch (params?.sortBy ?? 'name_asc') {
      case 'stock_asc':
        return Number(a.stock) - Number(b.stock)
      case 'stock_desc':
        return Number(b.stock) - Number(a.stock)
      case 'profit_desc':
        return (Number(b.sell_price) - Number(b.last_cost)) - (Number(a.sell_price) - Number(a.last_cost))
      case 'sell_asc':
        return Number(a.sell_price) - Number(b.sell_price)
      case 'sell_desc':
        return Number(b.sell_price) - Number(a.sell_price)
      case 'name_asc':
      default:
        return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
    }
  })

  const totalCount = matched.length
  const pageRows = matched.slice((page - 1) * pageSize, page * pageSize)
  const result = ProductPageResultSchema.safeParse({
    products: pageRows,
    total_count: totalCount,
  })
  if (!result.success) {
    console.error('Dữ liệu danh sách hàng hóa không hợp lệ:', result.error)
    throw new Error('Dữ liệu hàng hóa không đúng định dạng')
  }

  return {
    products: result.data.products.map(({ category_name, category_code, ...product }) => ({
      ...product,
      category: product.category_id && category_name && category_code
        ? { id: product.category_id, name: category_name, code: category_code }
        : null,
    })),
    totalCount: result.data.total_count,
  }
})

export async function getProducts(params?: ProductQuery) {
  return cachedGetProducts(await getCacheIdentity(), params)
}

export async function getAllProducts() {
  return getProducts({ filter: 'catalog', page: 1, pageSize: 1_000_000 })
}

export async function createCategoryAction(name: string, description?: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Bạn cần đăng nhập để thao tác' }

  const categoryName = z.string().trim().min(1, 'Tên nhóm hàng không được để trống').max(100)
    .safeParse(name)
  if (!categoryName.success) {
    return { error: categoryName.error.issues[0]?.message || 'Tên nhóm hàng không hợp lệ' }
  }

  const code = removeDiacritics(categoryName.data)
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase())
    .filter((c) => /[A-Z]/.test(c))
    .join('') || 'NH'

  const { data, error } = await supabase
    .from('categories')
    .insert({
      code: `${code}-${randomUUID().slice(0, 8).toUpperCase()}`,
      name: categoryName.data,
      description: description?.trim() || null,
    })
    .select('id, name, code')
    .single()

  if (error) {
    console.error('Lỗi tạo nhóm hàng:', error)
    return { error: 'Lỗi tạo nhóm hàng: ' + error.message }
  }

  revalidatePath('/hang-hoa')
  revalidatePath('/ban-hang')
  revalidatePath('/nhap-hang')
  invalidateCache(CACHE_TAGS.CATEGORIES, CACHE_TAGS.PRODUCTS)
  return { success: true, category: data }
}

export async function updateCategoryAction(id: string, name: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Bạn cần đăng nhập để thao tác' }

  const categoryId = uuidSchema().safeParse(id)
  const categoryName = z.string().trim().min(1, 'Tên nhóm hàng không được để trống').max(100)
    .safeParse(name)
  if (!categoryId.success || !categoryName.success) {
    return {
      error: categoryName.success
        ? 'Nhóm hàng không hợp lệ'
        : categoryName.error.issues[0]?.message || 'Tên nhóm hàng không hợp lệ',
    }
  }

  const { data, error } = await supabase
    .from('categories')
    .update({ name: categoryName.data, updated_at: new Date().toISOString() })
    .eq('id', categoryId.data)
    .select('id, code, name, description')
    .single()

  if (error) {
    console.error('Lỗi cập nhật nhóm hàng:', error)
    return { error: 'Không cập nhật được nhóm hàng. Vui lòng thử lại.' }
  }

  revalidatePath('/hang-hoa')
  revalidatePath('/ban-hang')
  revalidatePath('/nhap-hang')
  invalidateCache(CACHE_TAGS.CATEGORIES, CACHE_TAGS.PRODUCTS)
  return { success: true, category: data }
}

const ProductRowSchema = ProductCatalogRowSchema.omit({
  category_name: true,
  category_code: true,
})

const imageFileTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const

async function uploadProductImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File
): Promise<{ path: string; url: string } | { error: string }> {
  const extension = imageFileTypes[file.type as keyof typeof imageFileTypes]
  if (!extension || file.size <= 0 || file.size > 5 * 1024 * 1024) {
    return { error: 'Chọn ảnh JPG, PNG hoặc WebP có dung lượng tối đa 5 MB' }
  }

  const path = `${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) {
    console.error('Lỗi tải ảnh hàng hóa:', error)
    return { error: 'Không tải được ảnh. Vui lòng thử lại.' }
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return { path, url: data.publicUrl }
}

async function removeProductImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null
) {
  if (!path) return
  const { error } = await supabase.storage.from('product-images').remove([path])
  if (error) console.error('Lỗi xóa ảnh tải lên chưa được sử dụng:', error)
}

export async function createProductAction(formData: {
  name: string
  categoryId: string
  unit: string
  priceMode: 'auto' | 'fixed'
  costPrice: number
  sellPrice: number
  initialStock: number
  minStock: number
  barcode?: string
  expiryDate?: string
  imageFile?: File | null
}) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Bạn cần đăng nhập để thao tác' }

  const { imageFile, ...productData } = formData
  const validated = ProductSchema.safeParse(productData)
  if (!validated.success) {
    const firstErr = validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ'
    return { error: firstErr }
  }

  const { data } = validated
  const uploadedImage = imageFile ? await uploadProductImage(supabase, imageFile) : null
  if (uploadedImage && 'error' in uploadedImage) return { error: uploadedImage.error }

  const { data: created, error } = await supabase.rpc('create_product', {
    p_category_id: data.categoryId,
    p_name: data.name,
    p_barcode: data.barcode || null,
    p_unit: data.unit,
    p_price_mode: data.priceMode,
    p_cost_price: data.costPrice,
    p_sell_price: data.sellPrice,
    p_initial_stock: data.initialStock,
    p_min_stock: data.minStock,
    p_expiry_date: data.expiryDate || null,
    p_image_url: uploadedImage?.url ?? null,
  })

  if (error) {
    await removeProductImage(supabase, uploadedImage?.path ?? null)
    console.error('Lỗi tạo hàng hóa:', error)
    return { error: 'Không thêm được hàng hóa. Vui lòng kiểm tra thông tin và thử lại.' }
  }

  const parsedProduct = ProductRowSchema.safeParse(created)
  if (!parsedProduct.success) {
    console.error('Dữ liệu hàng hóa mới không hợp lệ:', parsedProduct.error)
    return { error: 'Hàng hóa đã được tạo nhưng dữ liệu trả về không hợp lệ. Vui lòng tải lại trang.' }
  }

  revalidatePath('/hang-hoa')
  revalidatePath('/ban-hang')
  revalidatePath('/nhap-hang')
  invalidateCache(CACHE_TAGS.PRODUCTS)
  return { success: true, product: parsedProduct.data }
}

export async function updateProductAction(
  id: string,
  formData: {
    name: string
    categoryId: string
    unit: string
    priceMode: 'auto' | 'fixed'
    costPrice: number
    sellPrice: number
    minStock: number
    barcode?: string
    expiryDate?: string
    imageFile?: File | null
  }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Bạn cần đăng nhập để thao tác' }

  const productId = uuidSchema().safeParse(id)
  if (!productId.success) return { error: 'Hàng hóa không hợp lệ' }

  const { imageFile, ...productData } = formData
  const validated = ProductSchema.omit({ initialStock: true }).safeParse(productData)
  if (!validated.success) {
    const firstErr = validated.error.issues[0]?.message || 'Dữ liệu không hợp lệ'
    return { error: firstErr }
  }

  const { data } = validated

  const uploadedImage = imageFile ? await uploadProductImage(supabase, imageFile) : null
  if (uploadedImage && 'error' in uploadedImage) return { error: uploadedImage.error }

  const { data: updated, error } = await supabase.rpc('update_product', {
    p_product_id: productId.data,
    p_name: data.name,
    p_barcode: data.barcode || null,
    p_category_id: data.categoryId,
    p_unit: data.unit,
    p_price_mode: data.priceMode,
    p_cost_price: data.costPrice,
    p_sell_price: data.sellPrice,
    p_min_stock: data.minStock,
    p_expiry_date: data.expiryDate || null,
    p_image_url: uploadedImage?.url ?? null,
  })

  if (error) {
    await removeProductImage(supabase, uploadedImage?.path ?? null)
    console.error('Lỗi cập nhật hàng hóa:', error)
    return { error: 'Không cập nhật được hàng hóa. Vui lòng kiểm tra thông tin và thử lại.' }
  }

  const parsedProduct = ProductRowSchema.safeParse(updated)
  if (!parsedProduct.success) {
    console.error('Dữ liệu hàng hóa sau khi sửa không hợp lệ:', parsedProduct.error)
    return { error: 'Hàng hóa đã được sửa nhưng dữ liệu trả về không hợp lệ. Vui lòng tải lại trang.' }
  }

  revalidatePath('/hang-hoa')
  revalidatePath('/ban-hang')
  revalidatePath('/nhap-hang')
  invalidateCache(CACHE_TAGS.PRODUCTS)
  return { success: true }
}

export async function toggleProductActiveAction(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Bạn cần đăng nhập để thao tác' }
  const productId = uuidSchema().safeParse(id)
  if (!productId.success || typeof isActive !== 'boolean') {
    return { error: 'Thông tin hàng hóa không hợp lệ' }
  }

  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', productId.data)

  if (error) {
    return { error: 'Lỗi thao tác: ' + error.message }
  }

  revalidatePath('/hang-hoa')
  revalidatePath('/ban-hang')
  invalidateCache(CACHE_TAGS.PRODUCTS)
  return { success: true }
}

const cachedGetProductDetails = createUserCache('product-details', [
  CACHE_TAGS.PRODUCTS,
], async (supabase, productId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('id, code, name, barcode, category_id, unit, price_mode, base_cost, base_price, last_cost, sell_price, avg_cost, stock, min_stock, expiry_date, image_url, is_active, created_at, updated_at, category:categories(id, name, code)')
    .eq('id', productId)
    .single()

  if (error) {
    console.error('Lỗi tải chi tiết hàng hóa:', error)
    throw new Error('Không tải được chi tiết hàng hóa')
  }

  return { product: data }
})

export async function getProductDetailsAction(id: string) {
  const productId = uuidSchema().safeParse(id)
  if (!productId.success) throw new Error('Hàng hóa không hợp lệ')
  return cachedGetProductDetails(await getCacheIdentity(), productId.data)
}

const cachedGetProductPriceHistory = createUserCache('product-price-history', [
  CACHE_TAGS.PRODUCTS,
], async (supabase, productId: string) => {
  const { data, error } = await supabase
    .from('price_history')
    .select('id, old_cost, new_cost, old_price, new_price, changed_by, changed_by_name, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(15)

  if (error) {
    console.error('Lỗi tải lịch sử giá hàng hóa:', error)
    throw new Error('Không tải được lịch sử giá hàng hóa')
  }
  return data
})

export async function getProductPriceHistoryAction(id: string) {
  const productId = uuidSchema().safeParse(id)
  if (!productId.success) throw new Error('Hàng hóa không hợp lệ')
  return cachedGetProductPriceHistory(await getCacheIdentity(), productId.data)
}

const cachedGetProductStockHistory = createUserCache('product-stock-history', [
  CACHE_TAGS.PRODUCTS,
], async (supabase, productId: string) => {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('id, type, quantity, balance_before, balance_after, note, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Lỗi tải lịch sử kho hàng hóa:', error)
    throw new Error('Không tải được lịch sử kho hàng hóa')
  }
  return data
})

export async function getProductStockHistoryAction(id: string) {
  const productId = uuidSchema().safeParse(id)
  if (!productId.success) throw new Error('Hàng hóa không hợp lệ')
  return cachedGetProductStockHistory(await getCacheIdentity(), productId.data)
}
