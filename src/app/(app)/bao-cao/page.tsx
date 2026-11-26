import { connection } from 'next/server'
import { getReportData } from './actions'
import { ReportDashboard } from './report-dashboard'

export default async function BaoCaoPage() {
  await connection()
  const initialReport = await getReportData({ period: 'today' })
  return <ReportDashboard initialReport={initialReport} />
}
