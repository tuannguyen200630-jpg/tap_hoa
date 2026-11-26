import { describe, expect, it } from 'vitest'
import { calculateChange } from '@/lib/money'
import {
  calculateCartSubtotal,
  calculateDiscountAmount,
  calculateSaleTotal,
  parseQuantityInput,
} from '@/lib/sales'

describe('Tính tiền bán hàng', () => {
  it('tính tổng từng dòng, gồm số lượng lẻ và giá riêng của dòng', () => {
    expect(calculateCartSubtotal([
      { quantity: 2, unitPrice: 12_500 },
      { quantity: 0.75, unitPrice: 20_000 },
      { quantity: 1, unitPrice: 10_000 },
    ])).toBe(50_000)
    expect(calculateCartSubtotal([{ quantity: 0.001, unitPrice: 500 }])).toBe(1)
  })

  it('tính giảm giá theo số tiền hoặc phần trăm và không vượt tổng tiền', () => {
    expect(calculateDiscountAmount(100_000, 'amount', 12_500)).toBe(12_500)
    expect(calculateDiscountAmount(100_000, 'percent', 12.5)).toBe(12_500)
    expect(calculateDiscountAmount(100_000, 'amount', 120_000)).toBe(100_000)
    expect(calculateSaleTotal(100_000, 12_500)).toBe(87_500)
  })

  it('tính tiền thối từ số tiền khách đưa', () => {
    expect(calculateChange(100_000, 87_500)).toBe(12_500)
    expect(calculateChange(50_000, 87_500)).toBe(-37_500)
  })

  it('đọc số lượng lẻ tối đa ba chữ số thập phân', () => {
    expect(parseQuantityInput('1,25')).toBe(1.25)
    expect(parseQuantityInput('0.125')).toBe(0.125)
    expect(parseQuantityInput('1.2345')).toBeNull()
    expect(parseQuantityInput('-1')).toBeNull()
  })
})
