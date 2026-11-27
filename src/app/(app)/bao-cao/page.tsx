import { connection } from 'next/server'
import { getInitialIsDesktop } from '@/lib/device'
import { getReportData } from './actions'
import { ReportDashboard } from './report-dashboard'

export default async function BaoCaoPage() {
  await connection()
  const initialReport = await getReportData({ period: 'today' })
  const initialIsDesktop = await getInitialIsDesktop()
  return <ReportDashboard initialReport={initialReport} initialIsDesktop={initialIsDesktop} />
}
