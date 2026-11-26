'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { CACHE_TAGS, createUserCache, getCacheIdentity, invalidateCache } from '@/lib/cache'
import { createClient } from '@/lib/supabase/server'

const StoreSettingsSchema = z.object({
  store_name: z.string().trim().min(1, 'Vui lòng nhập tên cửa hàng.').max(150),
  rounding_step: z.union([z.literal(100), z.literal(500), z.literal(1000)]),
  font_size: z.enum(['medium', 'large', 'xlarge']),
  min_stock_threshold: z.coerce.number()
    .min(0, 'Ngưỡng cảnh báo không được âm.')
    .max(999999999.999)
    .refine((value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-8, 'Ngưỡng chỉ được có tối đa 3 chữ số thập phân.'),
  allow_sell_out_of_stock: z.boolean(),
})

export type StoreSettings = z.infer<typeof StoreSettingsSchema>

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Bạn cần đăng nhập để sử dụng cài đặt.')
  return supabase
}

const cachedStoreSettings = createUserCache('store-settings', [
  CACHE_TAGS.SETTINGS,
], async (supabase): Promise<StoreSettings> => {
  const { data, error } = await supabase
    .from('settings')
    .select('store_name, rounding_step, font_size, min_stock_threshold, allow_sell_out_of_stock')
    .eq('id', 'default')
    .single()

  if (error) {
    console.error('Lỗi lấy cài đặt cửa hàng:', error)
    throw new Error('Không tải được cài đặt cửa hàng.')
  }

  const parsed = StoreSettingsSchema.safeParse(data)
  if (!parsed.success) {
    console.error('Dữ liệu cài đặt cửa hàng không hợp lệ:', parsed.error)
    throw new Error('Dữ liệu cài đặt cửa hàng không đúng định dạng.')
  }
  return parsed.data
})

export async function getStoreSettings(): Promise<StoreSettings> {
  return cachedStoreSettings(await getCacheIdentity())
}

export async function saveStoreSettingsAction(input: StoreSettings): Promise<{ error?: string; success?: boolean }> {
  const supabase = await getAuthenticatedClient()
  const parsed = StoreSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Thông tin cài đặt không hợp lệ.' }
  }

  const { data, error } = await supabase
    .from('settings')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', 'default')
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Lỗi lưu cài đặt cửa hàng:', error)
    return { error: 'Không lưu được cài đặt. Vui lòng thử lại.' }
  }
  if (!data) {
    console.error('Không tìm thấy dòng cài đặt mặc định để cập nhật.')
    return { error: 'Không tìm thấy cài đặt cửa hàng. Vui lòng tải lại trang.' }
  }

  revalidatePath('/cai-dat')
  revalidatePath('/bao-cao')
  revalidatePath('/hang-hoa')
  revalidatePath('/ban-hang')
  revalidatePath('/nhap-hang')
  invalidateCache(CACHE_TAGS.SETTINGS)
  return { success: true }
}

const ChangePasswordSchema = z.object({
  password: z.string().min(8, 'Mật khẩu mới cần ít nhất 8 ký tự.').max(72),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu nhập lại chưa khớp.',
  path: ['confirmPassword'],
})

export async function changePasswordAction(input: {
  password: string
  confirmPassword: string
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await getAuthenticatedClient()
  const parsed = ChangePasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Mật khẩu không hợp lệ.' }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    console.error('Lỗi đổi mật khẩu:', error)
    return { error: 'Không đổi được mật khẩu. Vui lòng kiểm tra lại và thử lại.' }
  }

  revalidatePath('/cai-dat')
  return { success: true }
}
