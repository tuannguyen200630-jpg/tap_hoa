export const paymentLabels = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  debt: 'Ghi nợ',
} as const

export function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(quantity)
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
