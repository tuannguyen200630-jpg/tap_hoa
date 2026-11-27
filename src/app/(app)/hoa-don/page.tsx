import { connection } from 'next/server'
import { getSalesForDate } from './actions'
import { InvoiceList } from './invoice-list'
import { getInitialIsDesktop } from '@/lib/device'

function getTodayInVietnam(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export default async function HoaDonPage() {
  await connection()
  const today = getTodayInVietnam()
  const [initialPage, initialIsDesktop] = await Promise.all([
    getSalesForDate({ date: today }),
    getInitialIsDesktop(),
  ])

  return (
    <InvoiceList
      initialDate={today}
      initialSales={initialPage.sales}
      initialIsDesktop={initialIsDesktop}
    />
  )
}
