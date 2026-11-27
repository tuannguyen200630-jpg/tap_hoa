'use client'

import { useIsDesktop } from '@/lib/use-is-desktop'
import { useReportDashboard, type ReportDashboardProps } from './use-report-dashboard'
import { ReportDesktopView } from './desktop/report-desktop-view'
import { ReportMobileView } from './mobile/report-mobile-view'

export function ReportDashboard({ initialReport, initialIsDesktop }: ReportDashboardProps & { initialIsDesktop: boolean }) {
  const model = useReportDashboard({ initialReport })
  const isDesktop = useIsDesktop(initialIsDesktop)

  return isDesktop
    ? <ReportDesktopView model={model} />
    : <ReportMobileView model={model} />
}
