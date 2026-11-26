import { describe, expect, it } from 'vitest'
import { DatabaseNumberSchema, uuidSchema } from '@/lib/validation'

describe('Xác thực dữ liệu Supabase', () => {
  it.each([
    '10000015-0000-0000-0000-000000000015',
    'c4444444-4444-4444-4444-444444444444',
    'ABCDEF12-3456-7890-ABCD-EF1234567890',
  ])('chấp nhận UUID đủ 36 ký tự hex: %s', (value) => {
    expect(uuidSchema().safeParse(value).success).toBe(true)
  })

  it.each([
    'p0000015-0000-0000-0000-000000000015',
    '10000015-0000-0000-0000-00000000001',
    '10000015-0000-0000-0000-000000000015-extra',
  ])('từ chối UUID sai định dạng: %s', (value) => {
    expect(uuidSchema().safeParse(value).success).toBe(false)
  })

  it('chuyển số dạng chuỗi từ cột numeric thành number', () => {
    expect(DatabaseNumberSchema.parse('12.375')).toBe(12.375)
    expect(DatabaseNumberSchema.parse(2)).toBe(2)
    expect(DatabaseNumberSchema.safeParse('không phải số').success).toBe(false)
  })
})
