/**
 * Format an integer amount in VND with dot separators.
 * Example: 12500 → "12.500đ"
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

/**
 * Parse a formatted money string back to integer.
 * "12.500" → 12500, "12500" → 12500
 */
export function parseMoney(value: string): number {
  const cleaned = value.replace(/[^0-9-]/g, '')
  const num = parseInt(cleaned, 10)
  return isNaN(num) ? 0 : num
}

/**
 * Format money for display in input fields (with dot separators, no đ suffix).
 * 12500 → "12.500"
 */
export function formatMoneyInput(amount: number): string {
  if (amount === 0) return ''
  return new Intl.NumberFormat('vi-VN').format(amount)
}

/**
 * Calculate change: customer pays - total.
 */
export function calculateChange(customerPaid: number, total: number): number {
  return customerPaid - total
}

/**
 * Calculate weighted average cost.
 * avg_new = (qty_old * avg_old + qty_new * cost_new) / (qty_old + qty_new)
 * Returns integer (rounded).
 */
export function calculateAvgCost(
  currentQty: number,
  currentAvgCost: number,
  newQty: number,
  newCost: number
): number {
  const totalQty = currentQty + newQty
  if (totalQty <= 0) return newCost
  return Math.round((currentQty * currentAvgCost + newQty * newCost) / totalQty)
}
