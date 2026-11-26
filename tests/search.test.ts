import { describe, expect, it } from 'vitest'
import { matchesSearch, normalizeText } from '@/lib/search'

describe('Vietnamese client search', () => {
  it('normalizes Vietnamese diacritics, casing, and extra whitespace', () => {
    expect(normalizeText('  ĐỒ   UỐNG   CÓ   GAS  ')).toBe('do uong co gas')
  })

  it('matches each keyword across any of the supplied fields', () => {
    expect(matchesSearch('banh choco', 'Bánh quy', 'Choco Pie')).toBe(true)
    expect(matchesSearch('chi lan', 'Chị Lan', '0912345678')).toBe(true)
    expect(matchesSearch('banh lan', 'Bánh choco', 'Chị Mai')).toBe(false)
  })

  it('matches an empty query and ignores empty fields', () => {
    expect(matchesSearch('  ', null, undefined)).toBe(true)
    expect(matchesSearch('phone', null, 'Điện thoại')).toBe(false)
  })
})
