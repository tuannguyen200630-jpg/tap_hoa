import { describe, expect, it } from 'vitest'
import {
  calculateSuggestedPrice,
  getNewBaseValues,
  hasCostChanged,
  roundUpToStep,
} from '@/lib/pricing'

describe('Giá bán đề xuất theo mốc', () => {
  const baseCost = 10_000
  const basePrice = 13_000
  const step = 500

  it.each([
    [11_000, 14_000],
    [9_000, 12_000],
    [9_300, 12_500],
    [5_000, 8_000],
  ])('nhập %iđ thì đề xuất %iđ', (newCost, expectedPrice) => {
    expect(calculateSuggestedPrice(baseCost, basePrice, newCost, step)).toBe(expectedPrice)
  })

  it('giữ mốc cũ khi đồng ý đúng giá đề xuất, không cộng dồn lần sau', () => {
    const suggestedPrice = calculateSuggestedPrice(baseCost, basePrice, 9_300, step)
    const nextBase = getNewBaseValues(baseCost, basePrice, 9_300, suggestedPrice, suggestedPrice)

    expect(nextBase).toEqual({ baseCost, basePrice })
    expect(calculateSuggestedPrice(nextBase.baseCost, nextBase.basePrice, 11_000, step)).toBe(14_000)
  })

  it('không đề xuất khi giá nhập không đổi so với mốc', () => {
    expect(hasCostChanged(baseCost, baseCost)).toBe(false)
  })

  it('làm tròn lên chính xác cả khi giá thô âm', () => {
    expect(roundUpToStep(-2_100, step)).toBe(-2_000)
    expect(roundUpToStep(12_500, step)).toBe(12_500)
  })
})
