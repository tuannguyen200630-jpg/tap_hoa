export type SaleLineAmount = {
  quantity: number
  unitPrice: number
}

export type SaleDiscountMode = 'amount' | 'percent'

export function calculateCartSubtotal(lines: SaleLineAmount[]): number {
  return lines.reduce((total, line) => {
    if (
      !Number.isFinite(line.quantity) ||
      line.quantity <= 0 ||
      !Number.isSafeInteger(line.unitPrice) ||
      line.unitPrice < 0
    ) {
      return total
    }

    return total + Math.round(line.quantity * line.unitPrice)
  }, 0)
}

export function calculateDiscountAmount(
  subtotal: number,
  mode: SaleDiscountMode,
  value: number
): number {
  if (!Number.isSafeInteger(subtotal) || subtotal <= 0 || !Number.isFinite(value) || value <= 0) {
    return 0
  }

  const discount = mode === 'percent'
    ? Math.round(subtotal * Math.min(value, 100) / 100)
    : Math.round(value)

  return Math.min(subtotal, Math.max(0, discount))
}

export function calculateSaleTotal(subtotal: number, discountAmount: number): number {
  if (!Number.isSafeInteger(subtotal) || !Number.isSafeInteger(discountAmount)) return 0
  return Math.max(0, subtotal - Math.max(0, discountAmount))
}

export function parseQuantityInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d+(?:\.\d{0,3})?$/.test(normalized)) return null

  const quantity = Number(normalized)
  if (!Number.isFinite(quantity) || quantity > 999_999_999.999) return null
  return Math.round(quantity * 1000) / 1000
}
