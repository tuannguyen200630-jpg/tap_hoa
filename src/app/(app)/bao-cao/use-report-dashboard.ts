'use client'

import { useRef, useState } from 'react'
import type { ReportData, ReportDateRange, ReportPeriod } from '@/lib/reporting'
import { getReportData } from './actions'

type ReportResult = ReportData & { range: ReportDateRange }

export interface ReportDashboardProps { initialReport: ReportResult }

export type ReportDashboardModel = ReturnType<typeof useReportDashboard>

export function useReportDashboard({ initialReport }: ReportDashboardProps) {
  const [report, setReport] = useState(initialReport)
  const [period, setPeriod] = useState<ReportPeriod>('today')
  const [customFrom, setCustomFrom] = useState(initialReport.range.from)
  const [customTo, setCustomTo] = useState(initialReport.range.to)
  const [showDateFilters, setShowDateFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef(0)
  const reportCache = useRef(new Map<string, ReportResult>([['today', initialReport]]))

  async function loadReport(
    nextPeriod: ReportPeriod,
    from?: string,
    to?: string
  ) {
    const cacheKey = nextPeriod === 'custom'
      ? `custom:${from || ''}:${to || ''}`
      : nextPeriod
    const request = ++requestId.current
    setPeriod(nextPeriod)
    setShowDateFilters(nextPeriod === 'custom')
    const cachedReport = reportCache.current.get(cacheKey)
    if (cachedReport) {
      setReport(cachedReport)
      setError('')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const result = await getReportData({ period: nextPeriod, from, to })
      if (request === requestId.current) {
        reportCache.current.set(cacheKey, result)
        setReport(result)
      }
    } catch (caught: unknown) {
      if (request === requestId.current) {
        setError(caught instanceof Error ? caught.message : 'Không tải được báo cáo.')
      }
    } finally {
      if (request === requestId.current) setIsLoading(false)
    }
  }

  const exportUrl = `/api/bao-cao/csv?from=${encodeURIComponent(report.range.from)}&to=${encodeURIComponent(report.range.to)}`
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({})
  function toggleListExpanded(title: string) {
    setExpandedLists((current) => ({ ...current, [title]: !current[title] }))
  }

  return {
    report,
    setReport,
    period,
    setPeriod,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    showDateFilters,
    setShowDateFilters,
    isLoading,
    setIsLoading,
    error,
    setError,
    requestId,
    reportCache,
    loadReport,
    exportUrl,
    expandedLists,
    toggleListExpanded,
  }
}
