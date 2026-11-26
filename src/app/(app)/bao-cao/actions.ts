'use server'

import { z } from 'zod'
import { getCacheIdentity } from '@/lib/cache'
import {
  getCachedStoreReport,
  getReportDateRange,
  type ReportPeriod,
} from '@/lib/reporting'

const ReportRequestSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'custom']),
  from: z.string().optional(),
  to: z.string().optional(),
})

export async function getReportData(input: {
  period: ReportPeriod
  from?: string
  to?: string
}) {
  const parsed = ReportRequestSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Thông tin ngày báo cáo không hợp lệ.')
  }

  const range = getReportDateRange(parsed.data.period, {
    from: parsed.data.from,
    to: parsed.data.to,
  })
  const identity = await getCacheIdentity()

  try {
    const report = await getCachedStoreReport(identity, range)
    return { ...report, range }
  } catch (error: unknown) {
    console.error('Lỗi lấy số liệu báo cáo:', error)
    throw new Error('Không tải được báo cáo. Vui lòng thử lại.')
  }
}
