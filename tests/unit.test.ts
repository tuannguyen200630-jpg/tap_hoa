import { describe, it, expect } from 'vitest'
import {
  calculateSuggestedPrice,
  roundUpToStep,
  hasCostChanged,
  isPriceBelowOrEqualCost,
  getNewBaseValues,
} from '@/lib/pricing'
import {
  formatMoney,
  parseMoney,
  formatMoneyInput,
  calculateChange,
  calculateAvgCost,
} from '@/lib/money'
import {
  removeDiacritics,
  generateProductCode,
  generateInvoiceCode,
  normalizeSearch,
  formatDate,
} from '@/lib/codes'

describe('Quy tắc tính giá bán theo giá nhập (lib/pricing.ts)', () => {
  const baseCost = 10000
  const basePrice = 13000
  const step = 500

  it('Nhập 11.000 thì giá bán đề xuất 14.000', () => {
    const suggested = calculateSuggestedPrice(baseCost, basePrice, 11000, step)
    expect(suggested).toBe(14000)
  })

  it('Nhập 9.000 thì giá bán đề xuất 12.000', () => {
    const suggested = calculateSuggestedPrice(baseCost, basePrice, 9000, step)
    expect(suggested).toBe(12000)
  })

  it('Nhập 9.300 thì 12.300, làm tròn lên 12.500', () => {
    const suggested = calculateSuggestedPrice(baseCost, basePrice, 9300, step)
    expect(suggested).toBe(12500)
  })

  it('Nhập 5.000 thì giá bán đề xuất 8.000', () => {
    const suggested = calculateSuggestedPrice(baseCost, basePrice, 5000, step)
    expect(suggested).toBe(8000)
  })

  it('Đồng ý 12.500 (nhập 9.300) rồi nhập 11.000 thì giá bán 14.000 (tính từ mốc cũ)', () => {
    // Trường hợp 1: Nhập 9.300 đề xuất 12.500, người dùng ĐỒNG Ý
    const suggested1 = calculateSuggestedPrice(baseCost, basePrice, 9300, step)
    expect(suggested1).toBe(12500)
    
    // Khi đồng ý đúng giá đề xuất, mốc giữ nguyên (10.000 và 13.000)
    const newBase = getNewBaseValues(baseCost, basePrice, 9300, suggested1, 12500)
    expect(newBase.baseCost).toBe(10000)
    expect(newBase.basePrice).toBe(13000)

    // Lần nhập tiếp theo giá 11.000, tính từ mốc cũ
    const suggested2 = calculateSuggestedPrice(newBase.baseCost, newBase.basePrice, 11000, step)
    expect(suggested2).toBe(14000)
  })

  it('Người dùng sửa giá hoặc giữ giá cũ thì cập nhật mốc mới', () => {
    const suggested = calculateSuggestedPrice(baseCost, basePrice, 11000, step) // 14000
    // Người dùng sửa thành 14.500
    const newBaseCustom = getNewBaseValues(baseCost, basePrice, 11000, suggested, 14500)
    expect(newBaseCustom.baseCost).toBe(11000)
    expect(newBaseCustom.basePrice).toBe(14500)

    // Người dùng chọn giữ giá cũ 13.000
    const newBaseKeep = getNewBaseValues(baseCost, basePrice, 11000, suggested, 13000)
    expect(newBaseKeep.baseCost).toBe(11000)
    expect(newBaseKeep.basePrice).toBe(13000)
  })

  it('Nhập đúng giá mốc thì hasCostChanged = false (không đề xuất)', () => {
    expect(hasCostChanged(baseCost, 10000)).toBe(false)
    expect(hasCostChanged(baseCost, 10500)).toBe(true)
  })

  it('Cảnh báo khi giá bán thấp hơn hoặc bằng giá nhập', () => {
    expect(isPriceBelowOrEqualCost(10000, 10000)).toBe(true)
    expect(isPriceBelowOrEqualCost(9000, 10000)).toBe(true)
    expect(isPriceBelowOrEqualCost(11000, 10000)).toBe(false)
  })

  it('Làm tròn lên theo các bước khác nhau (100, 500, 1000)', () => {
    expect(roundUpToStep(12300, 100)).toBe(12300)
    expect(roundUpToStep(12340, 100)).toBe(12400)
    expect(roundUpToStep(12300, 500)).toBe(12500)
    expect(roundUpToStep(12500, 500)).toBe(12500)
    expect(roundUpToStep(12300, 1000)).toBe(13000)
  })
})

describe('Định dạng tiền và tính toán (lib/money.ts)', () => {
  it('Định dạng tiền Việt Nam 12.500đ', () => {
    expect(formatMoney(12500)).toBe('12.500đ')
    expect(formatMoney(0)).toBe('0đ')
    expect(formatMoney(1000000)).toBe('1.000.000đ')
  })

  it('Parse chuỗi tiền về số nguyên', () => {
    expect(parseMoney('12.500')).toBe(12500)
    expect(parseMoney('12.500đ')).toBe(12500)
    expect(parseMoney('')).toBe(0)
    expect(parseMoney('500000')).toBe(500000)
  })

  it('Format cho ô nhập số', () => {
    expect(formatMoneyInput(12500)).toBe('12.500')
    expect(formatMoneyInput(0)).toBe('')
  })

  it('Tính tiền thối', () => {
    expect(calculateChange(50000, 35000)).toBe(15000)
    expect(calculateChange(20000, 20000)).toBe(0)
    expect(calculateChange(10000, 20000)).toBe(-10000)
  })

  it('Tính giá vốn bình quân gia quyền', () => {
    // Tồn 10 cái giá 8.000, nhập 10 cái giá 10.000 => avg = 9.000
    expect(calculateAvgCost(10, 8000, 10, 10000)).toBe(9000)
    // Tồn 0, nhập mới 5 cái giá 12.000 => avg = 12.000
    expect(calculateAvgCost(0, 0, 5, 12000)).toBe(12000)
  })
})

describe('Sinh mã và chuẩn hóa tiếng Việt (lib/codes.ts)', () => {
  it('Bỏ dấu tiếng Việt', () => {
    expect(removeDiacritics('Nước giải khát')).toBe('Nuoc giai khat')
    expect(removeDiacritics('Đồ ăn vặt')).toBe('Do an vat')
    expect(removeDiacritics('Cà phê')).toBe('Ca phe')
  })

  it('Sinh mã sản phẩm tự động', () => {
    expect(generateProductCode('Nước giải khát', 1)).toBe('NGK001')
    expect(generateProductCode('Đồ hộp', 12)).toBe('DH012')
    expect(generateProductCode('Bia', 105)).toBe('B105')
  })

  it('Sinh mã hóa đơn HD-YYYYMMDD-001', () => {
    const fixedDate = new Date(2026, 10, 20) // Tháng 11 (0-indexed: 10)
    const code = generateInvoiceCode(fixedDate, 1)
    expect(code).toBe('HD-20261120-001')
  })

  it('Chuẩn hóa tìm kiếm không dấu', () => {
    expect(normalizeSearch('Cà phê')).toBe('ca phe')
    expect(normalizeSearch('  BIA SÀI GÒN  ')).toBe('bia sai gon')
  })

  it('Định dạng ngày dd/MM/yyyy', () => {
    const date = new Date('2026-11-20T10:00:00Z')
    const formatted = formatDate(date)
    expect(formatted).toMatch(/20\/11\/2026/)
  })
})
