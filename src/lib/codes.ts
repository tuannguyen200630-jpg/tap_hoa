/**
 * Remove Vietnamese diacritics from a string.
 */
export function removeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
}

/**
 * Generate a product code from category name and sequence number.
 * "Nước giải khát" + 1 → "NGK001"
 * Takes first letter of each word (uppercase), plus zero-padded sequence.
 */
export function generateProductCode(categoryName: string, sequence: number): string {
  const initials = removeDiacritics(categoryName)
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase())
    .filter(c => /[A-Z]/.test(c))
    .join('')
  
  const prefix = initials || 'SP' // SP = sản phẩm (fallback)
  return prefix + String(sequence).padStart(3, '0')
}

/**
 * Generate invoice code: HD-YYYYMMDD-NNN
 * Uses date and a daily sequence number.
 */
export function generateInvoiceCode(date: Date, dailySequence: number): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `HD-${y}${m}${d}-${String(dailySequence).padStart(3, '0')}`
}

/**
 * Search normalization: remove diacritics and lowercase for comparison.
 * "Cà phê" → "ca phe"
 */
export function normalizeSearch(str: string): string {
  return removeDiacritics(str).toLowerCase().trim()
}

/**
 * Format a date to dd/MM/yyyy in Vietnam timezone.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format a date with time to dd/MM/yyyy HH:mm.
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
