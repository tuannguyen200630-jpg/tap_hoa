import { describe, expect, it } from 'vitest'
import {
  formatMoney,
  formatMoneyInput,
  parseMoney,
  calculateChange,
  calculateAvgCost,
} from '@/lib/money'
import {
  generateInvoiceCode,
  generateProductCode,
  normalizeSearch,
  removeDiacritics,
} from '@/lib/codes'

describe('Mã hàng và tìm kiếm tiếng Việt', () => {
  it('bỏ dấu và chuyển Đ/đ thành D/d', () => {
    expect(removeDiacritics('Đồ ăn vặt')).toBe('Do an vat')
    expect(removeDiacritics('Cà phê')).toBe('Ca phe')
  })

  it('lấy chữ cái đầu tên nhóm và giữ số thứ tự ít nhất ba chữ số', () => {
    expect(generateProductCode('Nước giải khát', 1)).toBe('NGK001')
    expect(generateProductCode('Đồ hộp', 12)).toBe('DH012')
    expect(generateProductCode('Bia', 105)).toBe('B105')
  })

  it('chuẩn hóa tìm kiếm không dấu, không phân biệt hoa thường', () => {
    expect(normalizeSearch('  BIA SÀI GÒN  ')).toBe('bia sai gon')
  })

  it('tạo mã hóa đơn theo ngày và số thứ tự', () => {
    expect(generateInvoiceCode(new Date(2026, 10, 20), 1)).toBe('HD-20261120-001')
  })
})

describe('Định dạng và tính tiền đồng', () => {
  it('định dạng tiền và ô nhập với dấu chấm phân cách hàng nghìn', () => {
    expect(formatMoney(12_500)).toBe('12.500đ')
    expect(formatMoney(1_000_000)).toBe('1.000.000đ')
    expect(formatMoneyInput(12_500)).toBe('12.500')
    expect(formatMoneyInput(0)).toBe('')
  })

  it('đọc tiền có dấu phân cách, ký hiệu đồng và số âm', () => {
    expect(parseMoney('12.500đ')).toBe(12_500)
    expect(parseMoney('-1.000')).toBe(-1_000)
    expect(parseMoney('')).toBe(0)
    expect(parseMoney('1-2')).toBe(0)
    expect(parseMoney('9007199254740992')).toBe(0)
  })

  it('tính tiền thối có thể âm khi khách đưa thiếu', () => {
    expect(calculateChange(50_000, 35_000)).toBe(15_000)
    expect(calculateChange(10_000, 20_000)).toBe(-10_000)
  })

  it('tính giá vốn bình quân và làm tròn về đồng', () => {
    expect(calculateAvgCost(10, 8_000, 10, 10_000)).toBe(9_000)
    expect(calculateAvgCost(1, 1, 1, 2)).toBe(2)
    expect(calculateAvgCost(0, 0, 5, 12_000)).toBe(12_000)
  })
})
