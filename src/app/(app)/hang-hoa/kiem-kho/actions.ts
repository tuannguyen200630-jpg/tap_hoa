'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { CACHE_TAGS, invalidateCache } from '@/lib/cache'
import { DatabaseNumberSchema, uuidSchema } from '@/lib/validation'

const AdjustStockSchema = z.object({
  productId: uuidSchema(),
  actualStock: z.number()
    .min(0, 'Số lượng thực tế không được âm.')
    .max(999999999.999)
    .refine((value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-8, 'Số lượng chỉ được có tối đa 3 chữ số thập phân.'),
})

export async function adjustStockAction(input: {
  productId: string
  actualStock: number
}): Promise<{ error?: string; difference?: number }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Bạn cần đăng nhập để kiểm kho.' }

  const parsed = AdjustStockSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Số lượng kiểm kho không hợp lệ.' }
  }

  const { data, error } = await supabase.rpc('adjust_stock', {
    p_product_id: parsed.data.productId,
    p_actual_stock: parsed.data.actualStock,
    p_note: 'Kiểm kho',
  })

  if (error) {
    console.error('Lỗi điều chỉnh số lượng sau kiểm kho:', error)
    return { error: 'Không lưu được số lượng kiểm kho. Vui lòng tải lại và thử lại.' }
  }

  const result = z.object({
    success: z.literal(true),
    difference: DatabaseNumberSchema,
  }).safeParse(data)
  if (!result.success) {
    console.error('Kết quả kiểm kho không hợp lệ:', result.error)
    return { error: 'Không xác nhận được kết quả kiểm kho. Vui lòng kiểm tra lại hàng hóa.' }
  }

  revalidatePath('/hang-hoa')
  revalidatePath('/hang-hoa/kiem-kho')
  revalidatePath('/bao-cao')
  invalidateCache(CACHE_TAGS.PRODUCTS)
  return { difference: Number(result.data.difference) }
}
