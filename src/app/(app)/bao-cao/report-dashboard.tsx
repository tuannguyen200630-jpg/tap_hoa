'use client'

import { Children, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatDate } from '@/lib/codes'
import { formatMoney } from '@/lib/money'
import type { ReportData, ReportDateRange, ReportPeriod } from '@/lib/reporting'
import { getReportData } from './actions'

type ReportResult = ReportData & { range: ReportDateRange }

function formatReportDay(date: string) {
  return formatDate(new Date(`${date}T12:00:00+07:00`))
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value)
}

export function ReportDashboard({ initialReport }: { initialReport: ReportResult }) {
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

  return (
    <section className="space-y-6 max-sm:space-y-3">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
        <h1 className="min-w-0 text-lg font-bold text-gray-950 sm:text-3xl">Báo cáo</h1>
        <a
          href={exportUrl}
          className="col-start-2 row-start-1 inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800 sm:px-5 sm:py-3 sm:text-base"
        >
          Tải báo cáo
        </a>
        <p className="col-span-2 row-start-2 text-xs text-gray-600 sm:text-base">
          Số liệu từ {formatReportDay(report.range.from)} đến {formatReportDay(report.range.to)}.
        </p>
      </header>

      <section className="space-y-2 rounded-xl border border-gray-300 bg-white p-3 sm:space-y-3 sm:p-4" aria-label="Lọc thời gian báo cáo">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-950">Chọn khoảng thời gian</h2>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['today', 'Hôm nay'],
              ['week', 'Tuần này'],
              ['month', 'Tháng này'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                disabled={isLoading}
                onClick={() => void loadReport(value)}
                className={`whitespace-nowrap rounded-lg border px-2.5 py-2 text-xs font-medium sm:px-4 sm:py-3 sm:text-sm ${
                  period === value
                    ? 'border-blue-700 bg-blue-50 text-blue-900'
                    : 'border-gray-400 bg-white text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              aria-expanded={showDateFilters}
              aria-controls="report-date-filters"
              onClick={() => setShowDateFilters((isExpanded) => !isExpanded)}
              className="inline-flex min-h-10 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-gray-400 bg-white px-2.5 py-2 text-xs font-medium text-gray-900 sm:min-h-12 sm:gap-2 sm:px-4 sm:text-sm"
            >
              Thêm
              <ChevronDown
                aria-hidden="true"
                className={`h-4 w-4 transition-transform sm:h-5 sm:w-5 ${showDateFilters ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
        {showDateFilters && (
          <div id="report-date-filters" className="flex flex-col gap-3 max-sm:gap-2 sm:flex-row sm:items-end">
            <label className="flex-1 text-xs font-semibold text-gray-900 sm:text-base">
              Từ ngày
              <input
                type="date"
                value={customFrom}
                onChange={(event) => {
                  setCustomFrom(event.target.value)
                  setPeriod('custom')
                  setShowDateFilters(true)
                }}
                className="mt-1 min-h-11 w-full rounded-lg border border-gray-400 px-3 py-2 text-sm font-normal sm:min-h-12 sm:text-base"
              />
            </label>
            <label className="flex-1 text-xs font-semibold text-gray-900 sm:text-base">
              Đến ngày
              <input
                type="date"
                value={customTo}
                onChange={(event) => {
                  setCustomTo(event.target.value)
                  setPeriod('custom')
                  setShowDateFilters(true)
                }}
                className="mt-1 min-h-11 w-full rounded-lg border border-gray-400 px-3 py-2 text-sm font-normal sm:min-h-12 sm:text-base"
              />
            </label>
            <button
              type="button"
              disabled={isLoading || !customFrom || !customTo}
              onClick={() => void loadReport('custom', customFrom, customTo)}
              className="min-h-11 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60 sm:min-h-12 sm:px-5 sm:py-3 sm:text-base"
            >
              Xem báo cáo
            </button>
          </div>
        )}
        {isLoading && <p role="status" className="text-gray-700">Đang cập nhật số liệu…</p>}
        {error && <p role="alert" className="text-red-800">{error}</p>}
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4" aria-label="Thống kê nhanh">
        <MetricCard title="Doanh thu" value={formatMoney(report.summary.revenue)} />
        <MetricCard title="Lãi gộp" value={formatMoney(report.summary.gross_profit)} />
        <MetricCard title="Số hóa đơn" value={formatQuantity(report.summary.invoice_count)} />
      </section>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-3 sm:p-5">
        <h2 className="text-xs font-medium text-gray-600">Tổng giá trị hàng còn trong kho</h2>
        <p className="mt-1 whitespace-nowrap text-base font-bold text-blue-950 sm:text-lg">{formatMoney(report.stock_value)}</p>
        <p className="mt-1 text-xs text-gray-600">Ước tính theo số lượng hiện có và giá vốn bình quân.</p>
      </section>

      <div className="grid items-start gap-5 max-sm:gap-2 lg:grid-cols-2">
        <ReportList title="Hàng bán chạy" emptyText="Chưa có hàng nào được bán trong khoảng này.">
          {report.top_products.map((product) => (
            <li key={`${product.code}-${product.name}`} className="rounded-lg border border-gray-200 p-4 max-sm:p-3">
              <p className="font-bold">{product.name} <span className="hidden font-normal text-gray-700 md:inline">({product.code})</span></p>
              <p className="mt-1 text-gray-700">
                Đã bán {formatQuantity(product.quantity)} {product.unit} · Doanh thu {formatMoney(product.revenue)}
              </p>
            </li>
          ))}
        </ReportList>

        <ReportList title="Hàng ít bán" emptyText="Chưa có hàng hóa đang bán để thống kê.">
          {report.slow_products.map((product) => (
            <li key={product.code} className="rounded-lg border border-gray-200 p-4 max-sm:p-3">
              <p className="font-bold">{product.name} <span className="hidden font-normal text-gray-700 md:inline">({product.code})</span></p>
              <p className="mt-1 text-gray-700">
                {product.quantity > 0
                  ? `Đã bán ${formatQuantity(product.quantity)} ${product.unit}`
                  : 'Chưa bán trong khoảng thời gian này'}
              </p>
            </li>
          ))}
        </ReportList>

        <ReportList title="Hàng sắp hết" emptyText="Không có hàng nào dưới ngưỡng cảnh báo.">
          {report.low_stock.map((product) => (
            <li key={product.id} className="rounded-lg border border-gray-200 p-4 max-sm:p-3">
              <p className="font-bold">{product.name} <span className="hidden font-normal text-gray-700 md:inline">({product.code})</span></p>
              <p className="mt-1 text-gray-700">
                Còn trong kho: {formatQuantity(product.stock)} {product.unit}
                {' · '}Ngưỡng báo: {formatQuantity(product.warning_threshold)} {product.unit}
              </p>
            </li>
          ))}
        </ReportList>

        <ReportList title="Hàng sắp hết hạn (30 ngày)" emptyText="Không có hàng sắp hết hạn trong 30 ngày tới.">
          {report.near_expiry.map((product) => (
            <li key={product.id} className="rounded-lg border border-gray-200 p-4 max-sm:p-3">
              <p className="font-bold">{product.name} <span className="hidden font-normal text-gray-700 md:inline">({product.code})</span></p>
              <p className="mt-1 text-gray-700">
                Còn trong kho: {formatQuantity(product.stock)} {product.unit}
                {' · '}Hạn dùng: {formatReportDay(product.expiry_date)}
              </p>
            </li>
          ))}
        </ReportList>
      </div>
    </section>
  )
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-xl border border-gray-300 bg-white p-3">
      <h2 className="text-xs text-gray-600">{title}</h2>
      <p className="mt-1 whitespace-nowrap text-base font-bold text-gray-950 sm:text-lg">{value}</p>
    </article>
  )
}

function ReportList({
  title,
  emptyText,
  children,
}: {
  title: string
  emptyText: string
  children: React.ReactNode
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const items = Children.toArray(children)
  const visibleItems = isExpanded ? items : items.slice(0, 3)

  return (
    <section className="space-y-2 rounded-xl border border-gray-300 bg-white p-3">
      <h2 className="text-sm font-bold text-gray-950">{title}</h2>
      {items.length > 0
        ? (
          <>
            <ul className="space-y-2">{visibleItems}</ul>
            {items.length > 3 && (
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setIsExpanded((expanded) => !expanded)}
                className="min-h-11 w-full rounded-lg border border-gray-400 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
              >
                {isExpanded ? 'Thu gọn' : `Thêm (xem tất cả ${items.length} món)`}
              </button>
            )}
          </>
        )
        : <p className="text-xs text-gray-700">{emptyText}</p>}
    </section>
  )
}
