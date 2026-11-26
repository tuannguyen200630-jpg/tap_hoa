'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Eye, Printer, ReceiptText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatMoney } from '@/lib/money'
import { matchesSearch } from '@/lib/search'
import { useProgressiveList } from '@/lib/use-progressive-list'
import { cancelSaleAction, getSaleDetailsAction, getSalesForDate } from './actions'

type InvoiceRow = Awaited<ReturnType<typeof getSalesForDate>>['sales'][number]
type InvoiceDetails = Awaited<ReturnType<typeof getSaleDetailsAction>>

const paymentLabels = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  debt: 'Ghi nợ',
} as const

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function InvoiceList({
  initialDate,
  initialSales,
}: {
  initialDate: string
  initialSales: InvoiceRow[]
}) {
  const [date, setDate] = useState(initialDate)
  const [search, setSearch] = useState('')
  const [sales, setSales] = useState(initialSales)
  const [totalCount, setTotalCount] = useState(initialSales.length)
  const [revision, setRevision] = useState(0)
  const [listError, setListError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const detailRequestNumber = useRef(0)
  const skipFirstRequest = useRef(true)

  useEffect(() => {
    if (skipFirstRequest.current) {
      skipFirstRequest.current = false
      return
    }

    let isCurrent = true
    setIsLoading(true)
    void getSalesForDate({ date })
      .then((result) => {
        if (!isCurrent) return
        setSales(result.sales)
        setTotalCount(result.totalCount)
        setListError('')
      })
      .catch(() => {
        if (isCurrent) setListError('Không tải được hóa đơn. Vui lòng thử lại.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [date, revision])

  const filteredSales = useMemo(() => sales.filter((sale) =>
    matchesSearch(search, sale.code, sale.customer_name, sale.customer_phone)
  ), [sales, search])
  const resetKey = JSON.stringify([date, search])
  const { sentinelRef, visibleCount } = useProgressiveList(filteredSales.length, resetKey)
  const visibleSales = filteredSales.slice(0, visibleCount)

  const loadInvoicesAgain = () => setRevision((value) => value + 1)

  const openInvoice = async (id: string) => {
    const request = ++detailRequestNumber.current
    setIsDetailsOpen(true)
    setIsDetailsLoading(true)
    setDetailsError('')
    setInvoiceDetails(null)
    setIsCancelOpen(false)
    try {
      const details = await getSaleDetailsAction(id)
      if (request === detailRequestNumber.current) setInvoiceDetails(details)
    } catch {
      if (request === detailRequestNumber.current) {
        setDetailsError('Không tải được chi tiết hóa đơn. Vui lòng đóng và thử lại.')
      }
    } finally {
      if (request === detailRequestNumber.current) setIsDetailsLoading(false)
    }
  }

  const closeDetails = () => {
    detailRequestNumber.current += 1
    setIsDetailsOpen(false)
    setIsCancelOpen(false)
    setInvoiceDetails(null)
    setDetailsError('')
  }

  const confirmCancellation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!invoiceDetails) return
    setCancelError('')
    if (cancelReason.trim().length < 3) {
      setCancelError('Vui lòng nhập lý do hủy hóa đơn, ít nhất 3 ký tự.')
      return
    }

    setIsCancelling(true)
    try {
      const result = await cancelSaleAction(invoiceDetails.id, cancelReason)
      if (result.error) {
        setCancelError(result.error)
        return
      }

      setInvoiceDetails((current) => current ? {
        ...current,
        status: 'cancelled',
        cancel_reason: cancelReason.trim(),
      } : current)
      setIsCancelOpen(false)
      setCancelReason('')
      setSuccessMessage(`Đã hủy hóa đơn ${result.code || invoiceDetails.code}.`)
      setRevision((value) => value + 1)
    } catch {
      setCancelError('Không hủy được hóa đơn. Vui lòng tải lại và thử lại.')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <>
      <div className="no-print space-y-5 max-sm:space-y-3 pb-6 max-sm:pb-3">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
          <h1 className="min-w-0 text-lg font-bold text-gray-900 sm:text-3xl">Hóa đơn</h1>
          <div className="col-start-2 row-start-1 shrink-0 whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-900">
            {totalCount} hóa đơn trong ngày
          </div>
          <p className="col-span-2 row-start-2 text-xs text-gray-600 sm:text-lg">Xem, in lại hoặc hủy hóa đơn đã bán.</p>
        </header>

        {successMessage && (
          <div className="flex items-center justify-between gap-3 max-sm:gap-2 rounded-xl border-2 border-green-300 bg-green-50 p-4 max-sm:p-3 text-lg max-sm:text-sm text-green-900" role="status">
            <span>{successMessage}</span>
            <button type="button" aria-label="Đóng thông báo" onClick={() => setSuccessMessage('')} className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg hover:bg-green-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <section className="grid gap-2.5 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:grid-cols-[minmax(220px,0.4fr)_1fr] sm:items-end sm:gap-3 sm:p-4">
          <label className="block text-xs font-medium leading-snug text-gray-800 sm:text-base">
            Ngày xem hóa đơn
            <Input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                setSuccessMessage('')
                setSales([])
                setTotalCount(0)
              }}
              className="mt-1 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium leading-snug text-gray-800 sm:text-base">
            Tìm theo mã hóa đơn, tên hoặc số điện thoại khách
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setSuccessMessage('')
              }}
              placeholder="Ví dụ: HD-20261120-001 hoặc Nguyễn Văn..."
              className="mt-1 h-12 px-3 py-2 text-sm"
            />
          </label>
        </section>

        {listError && (
          <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 max-sm:p-3 text-lg max-sm:text-sm text-red-800" role="alert">
            {listError}
            <Button onClick={loadInvoicesAgain} className="ml-3 min-h-[48px] text-lg max-sm:text-sm">Tải lại danh sách</Button>
          </div>
        )}
        {isLoading && <p className="text-lg max-sm:text-sm text-gray-700" role="status">Đang tải hóa đơn...</p>}

        {!listError && filteredSales.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <ReceiptText className="mx-auto mb-4 max-sm:mb-3 h-14 w-14 text-gray-400" />
            <h2 className="text-2xl max-sm:text-lg font-bold text-gray-900">
              {search ? 'Không tìm thấy hóa đơn' : 'Chưa có hóa đơn trong ngày này'}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-lg max-sm:text-sm text-gray-600">
              {search
                ? 'Hãy kiểm tra lại mã hóa đơn hoặc tên khách hàng.'
                : 'Chọn ngày khác hoặc tạo hóa đơn mới trong mục Bán hàng.'}
            </p>
          </div>
        ) : !listError && (
          <div className="space-y-3">
            {visibleSales.map((sale) => (
              <article key={sale.id} className="space-y-1 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
                <div className="flex flex-col gap-3 max-sm:gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-gray-900 sm:text-xl">{sale.code}</h2>
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                        sale.status === 'cancelled' ? 'bg-gray-200 text-gray-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {sale.status === 'cancelled' ? 'Đã hủy' : 'Hoàn tất'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 sm:text-base">{formatDateTime(sale.created_at)}</p>
                    <p className="text-xs text-gray-700 sm:text-base">
                      Khách hàng: {sale.customer_name || 'Khách lẻ'} · {sale.item_count} món
                    </p>
                    <p className="text-xs text-gray-700 sm:text-base">Thanh toán: {paymentLabels[sale.payment_method]}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <p className="whitespace-nowrap text-base font-bold text-blue-800 sm:text-xl">{formatMoney(sale.final_amount)}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openInvoice(sale.id)}
                      className="min-h-[48px] text-lg max-sm:text-sm"
                    >
                      <Eye className="h-5 w-5" />
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              </article>
            ))}
            {visibleSales.length > 0 && filteredSales.length > visibleCount && (
              <div ref={sentinelRef} className="min-h-10 text-center text-lg max-sm:text-sm text-gray-600" aria-live="polite">
                Cuộn để xem thêm hóa đơn...
              </div>
            )}
          </div>
        )}
      </div>

      {isDetailsOpen && (
        <div className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 sm:p-5">
          <section className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl" aria-labelledby="invoice-details-title">
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 max-sm:gap-2 border-b bg-white p-4 max-sm:p-3">
              <div>
                <h2 id="invoice-details-title" className="text-2xl max-sm:text-lg font-bold">
                  {invoiceDetails ? `Hóa đơn ${invoiceDetails.code}` : 'Chi tiết hóa đơn'}
                </h2>
                {invoiceDetails && <p className="text-lg max-sm:text-sm text-gray-600">{formatDateTime(invoiceDetails.created_at)}</p>}
              </div>
              <button type="button" onClick={closeDetails} aria-label="Đóng chi tiết hóa đơn" className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg hover:bg-gray-100">
                <X className="h-6 w-6" />
              </button>
            </header>

            <div className="space-y-4 max-sm:space-y-3 p-4 max-sm:p-3 sm:p-5">
              {isDetailsLoading && <p className="text-center text-lg max-sm:text-sm text-gray-700" role="status">Đang tải chi tiết...</p>}
              {detailsError && <p className="rounded-lg bg-red-50 p-3 text-lg max-sm:text-sm text-red-800" role="alert">{detailsError}</p>}
              {invoiceDetails && (
                <>
                  <div className="grid gap-3 max-sm:gap-2 rounded-xl bg-gray-50 p-4 max-sm:p-3 text-lg max-sm:text-sm sm:grid-cols-2">
                    <p><strong>Khách hàng:</strong> {invoiceDetails.customer?.name || 'Khách lẻ'}</p>
                    <p><strong>Thanh toán:</strong> {paymentLabels[invoiceDetails.payment_method]}</p>
                    <p><strong>Trạng thái:</strong> {invoiceDetails.status === 'cancelled' ? 'Đã hủy' : 'Hoàn tất'}</p>
                    {invoiceDetails.customer?.phone && <p><strong>Điện thoại:</strong> {invoiceDetails.customer.phone}</p>}
                  </div>

                  {invoiceDetails.status === 'cancelled' && invoiceDetails.cancel_reason && (
                    <p className="rounded-lg bg-gray-100 p-3 text-lg max-sm:text-sm text-gray-800">
                      <strong>Lý do hủy:</strong> {invoiceDetails.cancel_reason}
                    </p>
                  )}

                  <div className="hidden overflow-x-auto rounded-xl border border-gray-200 lg:block">
                    <table className="w-full min-w-[620px] text-left text-lg max-sm:text-sm">
                      <thead className="border-b bg-gray-50">
                        <tr>
                          <th className="p-3">Món hàng</th>
                          <th className="p-3 text-right">Số lượng</th>
                          <th className="p-3 text-right">Giá bán</th>
                          <th className="p-3 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoiceDetails.items.map((item) => (
                          <tr key={item.id}>
                            <td className="p-3">
                              <strong>{item.product_name}</strong>
                              <span className="block text-gray-600">{item.product_code}</span>
                            </td>
                            <td className="p-3 text-right">{item.quantity} {item.unit}</td>
                            <td className="p-3 text-right">{formatMoney(item.sell_price)}</td>
                            <td className="p-3 text-right font-semibold">{formatMoney(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="space-y-3 lg:hidden">
                    {invoiceDetails.items.map((item) => (
                      <article key={item.id} className="rounded-xl border border-gray-200 p-4 max-sm:p-3 text-lg max-sm:text-sm">
                        <h3 className="break-words font-bold text-gray-950">{item.product_name}</h3>
                        <p className="text-gray-700">{item.product_code}</p>
                        <div className="mt-2 flex justify-between gap-3 max-sm:gap-2">
                          <span className="text-gray-700">Số lượng</span>
                          <strong>{item.quantity} {item.unit}</strong>
                        </div>
                        <div className="flex justify-between gap-3 max-sm:gap-2">
                          <span className="text-gray-700">Giá bán</span>
                          <strong>{formatMoney(item.sell_price)}</strong>
                        </div>
                        <div className="mt-1 flex justify-between gap-3 max-sm:gap-2 border-t border-gray-200 pt-2">
                          <span className="font-semibold text-gray-800">Thành tiền</span>
                          <strong className="text-blue-800">{formatMoney(item.subtotal)}</strong>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="ml-auto max-w-md space-y-2 rounded-xl bg-blue-50 p-4 max-sm:p-3 text-lg max-sm:text-sm">
                    <div className="flex justify-between"><span>Tổng tiền hàng</span><strong>{formatMoney(invoiceDetails.total_amount)}</strong></div>
                    {invoiceDetails.discount_amount > 0 && (
                      <div className="flex justify-between"><span>Giảm giá</span><strong>−{formatMoney(invoiceDetails.discount_amount)}</strong></div>
                    )}
                    <div className="flex justify-between border-t border-blue-200 pt-2 text-xl max-sm:text-base"><span>Khách cần trả</span><strong>{formatMoney(invoiceDetails.final_amount)}</strong></div>
                    {invoiceDetails.customer_paid > 0 && (
                      <div className="flex justify-between"><span>Khách đã đưa</span><span>{formatMoney(invoiceDetails.customer_paid)}</span></div>
                    )}
                    {invoiceDetails.change_amount > 0 && (
                      <div className="flex justify-between"><span>Tiền thối</span><span>{formatMoney(invoiceDetails.change_amount)}</span></div>
                    )}
                    {invoiceDetails.debt_amount > 0 && (
                      <div className="flex justify-between font-semibold text-amber-900"><span>Còn ghi nợ</span><span>{formatMoney(invoiceDetails.debt_amount)}</span></div>
                    )}
                  </div>
                  {invoiceDetails.note && <p className="text-lg max-sm:text-sm"><strong>Ghi chú:</strong> {invoiceDetails.note}</p>}

                  <div className="flex flex-wrap justify-end gap-2 border-t pt-4 max-sm:pt-3">
                    <Button type="button" variant="outline" onClick={() => window.print()} className="min-h-[48px] text-lg max-sm:text-sm">
                      <Printer className="h-5 w-5" />
                      In lại hóa đơn
                    </Button>
                    {invoiceDetails.status === 'completed' && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          setCancelReason('')
                          setCancelError('')
                          setIsCancelOpen(true)
                        }}
                        className="min-h-[48px] text-lg max-sm:text-sm"
                      >
                        <AlertTriangle className="h-5 w-5" />
                        Hủy hóa đơn
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      )}

      {isCancelOpen && invoiceDetails && (
        <div className="no-print fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 max-sm:p-3">
          <form onSubmit={confirmCancellation} className="w-full max-w-lg space-y-4 max-sm:space-y-3 rounded-2xl bg-white p-5 max-sm:p-3 shadow-2xl">
            <div className="flex items-start gap-3 max-sm:gap-2 text-red-800">
              <AlertTriangle className="mt-1 h-7 w-7 shrink-0" />
              <div>
                <h2 className="text-2xl max-sm:text-lg font-bold">Hủy hóa đơn {invoiceDetails.code}?</h2>
                <p className="mt-1 text-lg max-sm:text-sm">Hệ thống sẽ hoàn số lượng hàng và điều chỉnh công nợ liên quan.</p>
              </div>
            </div>
            <label className="block text-lg max-sm:text-sm font-semibold text-gray-800">
              Lý do hủy hóa đơn *
              <textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                maxLength={500}
                required
                rows={3}
                className="mt-1 min-h-24 w-full rounded-xl border-2 border-gray-300 p-3 text-lg max-sm:text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Ví dụ: Khách đổi ý, nhập nhầm món..."
              />
            </label>
            {cancelError && <p className="rounded-lg bg-red-50 p-3 text-lg max-sm:text-sm text-red-800" role="alert">{cancelError}</p>}
            <div className="flex justify-end gap-3 max-sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCancelOpen(false)}
                className="min-h-[48px] text-lg max-sm:text-sm"
              >
                Không
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isCancelling || cancelReason.trim().length < 3}
                className="min-h-[48px] text-lg max-sm:text-sm"
              >
                {isCancelling ? 'Đang hủy...' : 'Có, hủy'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {invoiceDetails && (
        <article className="receipt-print mx-auto w-full max-w-[80mm] bg-white p-3 text-black">
          <header className="mb-3 border-b border-dashed border-black pb-2 text-center">
            <h1 className="text-xl max-sm:text-base font-bold">HÓA ĐƠN BÁN HÀNG</h1>
            <p className="text-lg max-sm:text-sm font-semibold">{invoiceDetails.code}</p>
            <p className="text-lg max-sm:text-sm">{formatDateTime(invoiceDetails.created_at)}</p>
            <p className="text-lg max-sm:text-sm">{invoiceDetails.customer?.name || 'Khách lẻ'}</p>
            {invoiceDetails.status === 'cancelled' && <p className="text-xl max-sm:text-base font-bold">ĐÃ HỦY</p>}
          </header>
          <div className="space-y-2">
            {invoiceDetails.items.map((item) => (
              <div key={item.id} className="border-b border-dotted border-gray-500 pb-1">
                <p className="text-lg max-sm:text-sm font-semibold">{item.product_name}</p>
                <div className="flex justify-between gap-2 text-lg max-sm:text-sm">
                  <span>{item.quantity} {item.unit} × {formatMoney(item.sell_price)}</span>
                  <span>{formatMoney(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-b border-dashed border-black pb-3 text-lg max-sm:text-sm">
            <div className="flex justify-between"><span>Tổng tiền hàng</span><span>{formatMoney(invoiceDetails.total_amount)}</span></div>
            {invoiceDetails.discount_amount > 0 && (
              <div className="flex justify-between"><span>Giảm giá</span><span>−{formatMoney(invoiceDetails.discount_amount)}</span></div>
            )}
            <div className="flex justify-between text-xl max-sm:text-base font-bold"><span>Khách cần trả</span><span>{formatMoney(invoiceDetails.final_amount)}</span></div>
            <div className="flex justify-between"><span>Thanh toán</span><span>{paymentLabels[invoiceDetails.payment_method]}</span></div>
            {invoiceDetails.customer_paid > 0 && (
              <div className="flex justify-between"><span>Khách đã đưa</span><span>{formatMoney(invoiceDetails.customer_paid)}</span></div>
            )}
            {invoiceDetails.change_amount > 0 && (
              <div className="flex justify-between"><span>Tiền thối</span><span>{formatMoney(invoiceDetails.change_amount)}</span></div>
            )}
            {invoiceDetails.debt_amount > 0 && (
              <div className="flex justify-between"><span>Còn ghi nợ</span><span>{formatMoney(invoiceDetails.debt_amount)}</span></div>
            )}
          </div>
          {invoiceDetails.cancel_reason && <p className="mt-2 text-lg max-sm:text-sm">Lý do hủy: {invoiceDetails.cancel_reason}</p>}
          {invoiceDetails.note && <p className="mt-2 text-lg max-sm:text-sm">Ghi chú: {invoiceDetails.note}</p>}
          <p className="mt-3 text-center text-lg max-sm:text-sm">Cảm ơn quý khách và hẹn gặp lại!</p>
        </article>
      )}
    </>
  )
}
