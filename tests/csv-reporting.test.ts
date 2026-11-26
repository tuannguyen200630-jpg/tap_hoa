import { describe, expect, it } from 'vitest'
import { toCsv } from '../src/lib/csv'
import { getReportDateRange, getVietnamToday } from '../src/lib/reporting'

describe('toCsv', () => {
  it('adds a UTF-8 BOM and escapes CSV values', () => {
    expect(toCsv([
      ['Tên hàng', 'Ghi chú'],
      ['Cà phê', 'Gói "đặc biệt", ngon'],
    ])).toBe('\uFEFFTên hàng,Ghi chú\r\nCà phê,"Gói ""đặc biệt"", ngon"')
  })
})

describe('getReportDateRange', () => {
  it('uses the Vietnam calendar for today, week, and month', () => {
    const now = new Date('2026-11-20T18:00:00.000Z')

    expect(getVietnamToday(now)).toBe('2026-11-21')
    expect(getReportDateRange('week', {}, now)).toEqual({
      from: '2026-11-16',
      to: '2026-11-21',
    })
    expect(getReportDateRange('month', {}, now)).toEqual({
      from: '2026-11-01',
      to: '2026-11-21',
    })
  })

  it('rejects invalid or oversized custom ranges', () => {
    const now = new Date('2026-11-20T18:00:00.000Z')

    expect(() => getReportDateRange('custom', { from: '2026-02-28', to: '2026-03-01' }, now))
      .not.toThrow()
    expect(() => getReportDateRange('custom', { from: '2026-11-22', to: '2026-11-23' }, now))
      .toThrow('Ngày kết thúc không được ở tương lai.')
    expect(() => getReportDateRange('custom', { from: '2025-11-20', to: '2026-11-21' }, now))
      .toThrow('Mỗi báo cáo chỉ xem tối đa 366 ngày.')
  })
})
