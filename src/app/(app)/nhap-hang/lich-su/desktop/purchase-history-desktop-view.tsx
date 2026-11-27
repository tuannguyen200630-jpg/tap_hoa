'use client'

import Link from 'next/link'
import { ArrowLeft, ReceiptText, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatMoney } from '@/lib/money'
import type { usePurchaseHistory } from '../use-purchase-history'

export function PurchaseHistoryDesktopView({ model }: { model: ReturnType<typeof usePurchaseHistory> }) {
  const { suppliers, search, setSearch, period, setPeriod, choosePeriod, fromDate, setFromDate, toDate, setToDate, supplierId, setSupplierId, payment, setPayment, totalCount, totalAmount, filteredPurchases, visiblePurchases, openDetails, sentinelRef, visibleCount, detailsOpen, closeDetails, detailsLoading, detailsError, details, formatDateTime, formatQuantity } = model

  return (
    <div className="mx-auto max-w-7xl space-y-5 max-sm:space-y-3 p-4 max-sm:p-3 pb-8 max-sm:pb-3 sm:p-6 lg:p-8">
      <header className="space-y-3">
        <Link
          href="/nhap-hang"
          className="flex min-h-[48px] w-fit items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 max-sm:px-3 text-lg max-sm:text-sm font-bold text-gray-800 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại nhập hàng
        </Link>
        <h1 className="text-3xl max-sm:text-lg font-bold text-gray-900">Lịch sử nhập hàng</h1>
      </header>

      <section className="grid grid-cols-2 gap-3 max-sm:gap-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 max-sm:p-3">
          <p className="text-base font-semibold text-blue-800">Số phiếu nhập</p>
          <p className="mt-1 text-2xl max-sm:text-lg font-bold text-blue-950">{totalCount}</p>
        </div>
        <div className="rounded-2xl border border-green-100 bg-green-50 p-4 max-sm:p-3">
          <p className="text-base font-semibold text-green-800">Tổng tiền nhập hàng</p>
          <p className="mt-1 whitespace-nowrap text-base font-bold text-green-950 sm:text-xl">{formatMoney(totalAmount)}</p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 max-sm:p-3 shadow-sm">
        <label className="block text-xs font-medium leading-snug text-gray-800 sm:text-base">
          Tìm kiếm phiếu nhập
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Mã phiếu, tên món hoặc nhà cung cấp"
            className="mt-1 h-12 px-3 py-2 text-sm"
          />
        </label>

        <div>
          <p className="mb-2 text-lg max-sm:text-sm font-semibold text-gray-800">Thời gian</p>
          <div className="flex flex-wrap gap-2">
            {([
              ['all', 'Tất cả'],
              ['today', 'Hôm nay'],
              ['week', '7 ngày qua'],
              ['month', 'Tháng này'],
            ] as const).map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => choosePeriod(value)}
                className={`min-h-[48px] rounded-xl border-2 px-4 max-sm:px-3 text-lg max-sm:text-sm font-semibold ${
                  period === value && !fromDate && !toDate
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-gray-300 bg-white text-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-sm:gap-2">
          <label className="text-base font-semibold text-gray-800">
            Từ ngày
            <Input
              type="date"
              value={fromDate}
              onChange={(event) => {
                setPeriod('all')
                setFromDate(event.target.value)
              }}
              className="mt-1 h-12 text-base"
            />
          </label>
          <label className="text-base font-semibold text-gray-800">
            Đến ngày
            <Input
              type="date"
              value={toDate}
              onChange={(event) => {
                setPeriod('all')
                setToDate(event.target.value)
              }}
              className="mt-1 h-12 text-base"
            />
          </label>
        </div>

        <div className="grid gap-3 max-sm:gap-2 sm:grid-cols-2">
          <label className="text-lg max-sm:text-sm font-semibold text-gray-800">
            Nhà cung cấp
            <select
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              className="mt-1 h-12 w-full rounded-lg border-2 border-gray-300 bg-white px-3 text-lg max-sm:text-sm"
            >
              <option value="">Tất cả nhà cung cấp</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </label>

          <div>
            <p className="mb-1 text-lg max-sm:text-sm font-semibold text-gray-800">Hình thức thanh toán</p>
            <div className="flex flex-wrap gap-2">
              {([
                ['all', 'Tất cả'],
                ['paid', 'Đã trả đủ'],
                ['debt', 'Ghi nợ'],
              ] as const).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setPayment(value)}
                  className={`min-h-[48px] rounded-xl border-2 px-4 max-sm:px-3 text-lg max-sm:text-sm font-semibold ${
                    payment === value
                      ? 'border-blue-600 bg-blue-50 text-blue-800'
                      : 'border-gray-300 bg-white text-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {filteredPurchases.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <ReceiptText className="mx-auto mb-3 h-14 w-14 text-gray-400" />
          <h2 className="text-2xl max-sm:text-lg font-bold text-gray-900">Không tìm thấy phiếu nhập</h2>
          <p className="mt-2 text-lg max-sm:text-sm text-gray-600">Hãy thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visiblePurchases.map((purchase) => {
            const isDebt = purchase.debt_amount > 0
            const itemCount = purchase.items.length
            return (
              <article
                key={purchase.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 max-sm:p-3 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => openDetails(purchase.id)}
                  className="block w-full text-left"
                  aria-label={`Xem chi tiết phiếu ${purchase.code}`}
                >
                  <div className="flex flex-col gap-3 max-sm:gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl max-sm:text-base font-bold text-gray-900">{purchase.code}</h2>
                        <span className={`rounded-full px-3 py-1 text-lg max-sm:text-sm font-semibold ${
                          isDebt
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isDebt ? 'Ghi nợ' : 'Trả ngay'}
                        </span>
                      </div>
                      <p className="text-lg max-sm:text-sm text-gray-700">{formatDateTime(purchase.created_at)}</p>
                      <p className="text-lg max-sm:text-sm text-gray-700">
                        {purchase.supplier?.name || 'Không chọn nhà cung cấp'} · {itemCount} mặt hàng
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm font-semibold text-gray-600">Tổng tiền phiếu nhập</p>
                      <p className="whitespace-nowrap text-base font-bold text-blue-800 sm:text-xl">{formatMoney(purchase.total_amount)}</p>
                      {isDebt && (
                        <p className="mt-1 text-base font-semibold text-orange-700">
                          Còn nợ {formatMoney(purchase.debt_amount)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="mt-3 flex min-h-[48px] items-center justify-center rounded-xl bg-blue-600 px-4 max-sm:px-3 text-lg max-sm:text-sm font-bold text-white sm:ml-auto sm:w-fit">
                    Xem chi tiết
                  </span>
                </button>
              </article>
            )
          })}
          {totalCount > visibleCount && (
            <div ref={sentinelRef} className="min-h-10 text-center text-lg max-sm:text-sm text-gray-600" aria-live="polite">
              Cuộn để xem thêm phiếu nhập...
            </div>
          )}
        </div>
      )}

      {detailsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết phiếu nhập"
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl">
            <div className="sticky top-0 flex min-h-16 items-center justify-between border-b border-gray-200 bg-white px-4 max-sm:px-3">
              <h2 className="text-xl max-sm:text-base font-bold text-gray-900">Chi tiết phiếu nhập</h2>
              <button
                type="button"
                onClick={closeDetails}
                className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg hover:bg-gray-100"
                aria-label="Đóng chi tiết phiếu nhập"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {detailsLoading ? (
              <p className="p-6 max-sm:p-3 text-lg max-sm:text-sm text-gray-700">Đang tải chi tiết...</p>
            ) : detailsError ? (
              <p className="p-6 max-sm:p-3 text-lg max-sm:text-sm text-red-700" role="alert">{detailsError}</p>
            ) : details ? (
              <div className="space-y-4 max-sm:space-y-3 p-4 max-sm:p-3 sm:p-6">
                <div className="grid gap-3 max-sm:gap-2 rounded-xl bg-gray-50 p-4 max-sm:p-3 sm:grid-cols-2">
                  <p className="text-lg max-sm:text-sm"><strong>Mã phiếu:</strong> {details.code}</p>
                  <p className="text-lg max-sm:text-sm"><strong>Ngày giờ:</strong> {formatDateTime(details.created_at)}</p>
                  <p className="text-lg max-sm:text-sm">
                    <strong>Nhà cung cấp:</strong>{' '}
                    {Array.isArray(details.supplier) ? details.supplier[0]?.name : details.supplier?.name || 'Không chọn nhà cung cấp'}
                  </p>
                  <p className="text-lg max-sm:text-sm">
                    <strong>Hình thức:</strong>{' '}
                    <span className={details.debt_amount > 0 ? 'font-bold text-orange-700' : 'font-bold text-green-700'}>
                      {details.debt_amount > 0 ? 'Ghi nợ' : 'Trả ngay'}
                    </span>
                  </p>
                  {details.note && (
                    <p className="text-lg max-sm:text-sm sm:col-span-2"><strong>Ghi chú:</strong> {details.note}</p>
                  )}
                </div>

                <div className="space-y-2">
                  {details.items.map((item, index: number) => (
                    <div key={item.id || index} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex items-start justify-between gap-3 max-sm:gap-2">
                        <div>
                          <p className="text-lg max-sm:text-sm font-bold text-gray-900">{item.product_name}</p>
                          <p className="mt-1 text-base text-gray-700">
                            {formatQuantity(Number(item.quantity))} {item.unit} × {formatMoney(Number(item.cost_price))}
                          </p>
                          {item.expiry_date && (
                            <p className="mt-1 text-base text-gray-700">
                              Hạn sử dụng: {new Intl.DateTimeFormat('vi-VN').format(new Date(`${item.expiry_date}T12:00:00+07:00`))}
                            </p>
                          )}
                        </div>
                        <p className="whitespace-nowrap text-lg max-sm:text-sm font-bold text-blue-800">
                          {formatMoney(Number(item.subtotal))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between rounded-xl bg-blue-600 p-4 max-sm:p-3 text-white">
                  <span className="text-xl max-sm:text-base font-semibold">Tổng cộng</span>
                  <span className="whitespace-nowrap text-base font-bold sm:text-xl">{formatMoney(details.total_amount)}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
