'use client'

import type { RefObject } from 'react'
import Link from 'next/link'
import { formatMoney, parseMoney, formatMoneyInput } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Minus,
  Trash2,
  PackagePlus,
  AlertTriangle,
  CheckCircle,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  Package as PackageIcon,
  ChevronDown,
  History,
} from 'lucide-react'
import type { PurchaseProduct } from '../actions'
import type { usePurchaseForm } from '../use-purchase-form'
import { PurchaseModals } from '../shared/purchase-modals'


export function PurchaseDesktopView({
  model,
  searchRef,
  allProductsSentinelRef,
  lowStockSentinelRef,
}: {
  model: ReturnType<typeof usePurchaseForm>
  searchRef: RefObject<HTMLInputElement | null>
  allProductsSentinelRef: RefObject<HTMLDivElement | null>
  lowStockSentinelRef: RefObject<HTMLDivElement | null>
}) {
  const { suppliers, cart, search, setSearch, selectedSupplier, setSelectedSupplier, paidAmount, setPaidAmount, note, setNote, payFull, setPayFull, selectedCategory, setSelectedCategory, feedback, expandedCartItems, setExpandedCartItems, isCartOpen, setIsCartOpen, showPriceModal, successInfo, setSuccessInfo, categories, formError, setFormError, isPending, getPurchaseQuantity, totalAmount, debtAmount, filteredProducts, lowStockProducts, allProductsVisibleCount, lowStockVisibleCount, visibleProducts, visibleLowStockProducts, addToCart, updateCartItem, roundQuantity, decreaseCartQuantity, increaseCartQuantity, handleQuantityBlur, removeFromCart, handleSubmit, openQuickAdd } = model

  const renderProductCard = (product: PurchaseProduct, lowStock = false) => {
    const selectedItem = cart.find((item) => item.product.id === product.id)
    const selectedQuantity = selectedItem ? getPurchaseQuantity(selectedItem) : 0

    return (
      <button
        type="button"
        key={product.id}
        onClick={() => addToCart(product)}
        aria-label={`Thêm ${product.name} vào phiếu nhập`}
        aria-pressed={selectedQuantity > 0}
        style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 120px' }}
        className={`relative flex min-h-[104px] min-w-0 max-w-full flex-col items-start justify-between rounded-xl border-2 p-2.5 text-left transition duration-150 active:scale-[0.98] ${
          selectedQuantity > 0
            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
            : 'border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50'
        }`}
      >
        {selectedQuantity > 0 && (
          <span
            className="absolute right-2 top-2 inline-flex min-h-7 min-w-7 items-center justify-center rounded-full bg-blue-700 px-2 text-xs font-bold text-white"
            aria-label={`Đã chọn ${selectedQuantity}`}
          >
            {selectedQuantity}
          </span>
        )}
        <span className={`line-clamp-2 min-w-0 max-w-full text-sm font-semibold leading-tight text-gray-900 ${
          selectedQuantity > 0 ? 'pr-10' : ''
        }`}>
          {product.name}
        </span>
        {lowStock && (
          <span className="max-w-full truncate whitespace-nowrap rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800">
            Còn: {Number(product.stock)} {product.unit}
          </span>
        )}
        <span className="max-w-full truncate whitespace-nowrap text-xs text-gray-600">
          Giá cũ: {formatMoney(product.last_cost)}
        </span>
        {!lowStock && (
          <span className="max-w-full truncate whitespace-nowrap text-xs text-gray-600">
            Còn: {Number(product.stock)} {product.unit}
          </span>
        )}
      </button>
    )
  }

  const renderSelectedItems = (idPrefix: string) => (
    <div className="min-w-0 max-w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-blue-50 px-4 max-sm:px-3 py-2 border-b border-blue-100">
          <h3 className="font-bold text-blue-900 text-lg max-sm:text-sm">
            Các món cần nhập ({cart.length} món)
          </h3>
        </div>
        {cart.length === 0 ? (
          <p className="px-4 max-sm:px-3 py-2 text-base text-gray-500">
            Chưa chọn món. Chọn thẻ bên dưới để thêm ngay.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {cart.map((item, index) => {
              const subtotal = Math.round(item.costPrice * getPurchaseQuantity(item))
              const costDiff = item.costPrice - item.product.last_cost
              const hasDiff = costDiff !== 0
              const isOptionsExpanded =
                expandedCartItems[item.product.id] ?? (item.isBulk || Boolean(item.expiryDate))
              const hasOptionalSetting = item.isBulk || Boolean(item.expiryDate)

              return (
                <div key={item.product.id} className="space-y-2 border-b border-gray-100 p-3 last:border-b-0 sm:p-4">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="min-w-0 break-words text-lg max-sm:text-sm font-bold leading-tight text-gray-900">
                        {item.product.name}
                      </span>
                      <Badge
                        variant={item.product.price_mode === 'auto' ? 'default' : 'outline'}
                        className="px-2 py-0.5 text-xs leading-4"
                      >
                        {item.product.price_mode === 'auto' ? 'Tự đề xuất giá' : 'Giá cố định'}
                      </Badge>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="text-right">
                        <span className="block text-xs font-medium text-gray-500">Thành tiền</span>
                        <span className="block whitespace-nowrap text-lg max-sm:text-sm font-bold text-gray-900 sm:text-xl">
                          {formatMoney(subtotal)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        aria-label={`Xóa ${item.product.name} khỏi phiếu nhập`}
                        title="Xóa khỏi phiếu nhập"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <label className="mb-1 block text-sm font-semibold leading-tight text-gray-700">
                        {item.isBulk ? 'Số thùng' : `Số lượng (${item.product.unit})`}
                      </label>
                      <div className="flex min-w-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Giảm số lượng ${item.product.name}`}
                          onClick={() => decreaseCartQuantity(index)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        <Input
                          type="number"
                          inputMode={item.isBulk ? 'numeric' : 'decimal'}
                          step={item.isBulk ? '1' : 'any'}
                          min={item.isBulk ? '1' : '0.001'}
                          value={item.quantity}
                          onChange={(e) => {
                            const rawValue = e.target.value
                            if (rawValue === '') {
                              return
                            }
                            const quantity = Number(rawValue)
                            if (!Number.isFinite(quantity)) return
                            updateCartItem(index, {
                              quantity: item.isBulk
                                ? Math.max(1, Math.floor(quantity))
                                : roundQuantity(quantity),
                            })
                          }}
                          onBlur={(e) => handleQuantityBlur(index, e.target.value)}
                          aria-label={item.isBulk ? 'Số thùng' : `Số lượng (${item.product.unit})`}
                          className="h-11 min-w-0 px-1 text-center text-lg max-sm:text-sm font-bold"
                        />
                        <button
                          type="button"
                          aria-label={`Tăng số lượng ${item.product.name}`}
                          onClick={() => increaseCartQuantity(index)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <label className="mb-1 block text-sm font-semibold leading-tight text-gray-700">
                        Giá nhập mỗi {item.product.unit} (đ)
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatMoneyInput(item.costPrice)}
                        readOnly={item.isBulk}
                        onChange={(e) =>
                          updateCartItem(index, {
                            costPrice: parseMoney(e.target.value),
                            isBulk: false,
                          })
                        }
                        aria-label={`Giá nhập mỗi ${item.product.unit}`}
                        className="h-11 px-2 text-base font-bold sm:text-lg"
                      />
                      {hasDiff && (
                        <div
                          className={`mt-1 flex items-center gap-1 text-xs font-medium leading-tight ${
                            costDiff > 0 ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {costDiff > 0 ? (
                            <ArrowUpCircle className="h-4 w-4 shrink-0" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4 shrink-0" />
                          )}
                          <span>
                            {costDiff > 0 ? 'Tăng' : 'Giảm'} {formatMoney(Math.abs(costDiff))} so với lần trước
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      aria-expanded={isOptionsExpanded}
                      aria-controls={`${idPrefix}-purchase-options-${item.product.id}`}
                      onClick={() =>
                        setExpandedCartItems((prev) => ({
                          ...prev,
                          [item.product.id]: !isOptionsExpanded,
                        }))
                      }
                      className="col-span-2 flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 text-base font-semibold text-gray-800 transition-colors hover:bg-gray-50 sm:col-span-1 sm:min-w-44"
                    >
                      <span className="whitespace-nowrap">Thùng / Hạn SD</span>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            hasOptionalSetting ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="truncate text-xs font-medium text-gray-600">
                          {item.isBulk && item.expiryDate
                            ? 'Theo thùng · Có HSD'
                            : item.isBulk
                              ? 'Theo thùng'
                              : item.expiryDate
                                ? 'Có HSD'
                                : 'Tùy chọn'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            isOptionsExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </span>
                    </button>
                  </div>

                  {isOptionsExpanded && (
                    <div
                      id={`${idPrefix}-purchase-options-${item.product.id}`}
                      className="grid grid-cols-1 gap-3 max-sm:gap-2 rounded-lg bg-gray-50 p-3 sm:grid-cols-2"
                    >
                      <div className="min-w-0">
                        <label className="flex min-h-11 cursor-pointer select-none items-center gap-2">
                          <input
                            type="checkbox"
                            checked={item.isBulk}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateCartItem(index, {
                                  isBulk: true,
                                  bulkPrice: item.costPrice * item.unitsPerBulk,
                                  bulkPriceEdited: false,
                                })
                              } else {
                                updateCartItem(index, { isBulk: false, bulkPriceEdited: false })
                              }
                              setExpandedCartItems((prev) => ({
                                ...prev,
                                [item.product.id]: true,
                              }))
                            }}
                            className="h-5 w-5 shrink-0 rounded accent-blue-600"
                          />
                          <span className="text-base font-medium leading-tight text-gray-800">
                            Nhập theo thùng (tự tính giá mỗi {item.product.unit})
                          </span>
                        </label>

                        {item.isBulk && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="min-w-0">
                              <label className="mb-1 block text-sm font-semibold leading-tight text-gray-700">
                                Giá cả thùng (đ)
                              </label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={formatMoneyInput(item.bulkPrice)}
                                onChange={(e) => {
                                  const bp = parseMoney(e.target.value)
                                  updateCartItem(index, {
                                    bulkPrice: bp,
                                    isBulk: true,
                                    bulkPriceEdited: true,
                                  })
                                }}
                                aria-label="Giá cả thùng"
                                className="h-11 px-2 text-base font-bold"
                              />
                            </div>
                            <div className="min-w-0">
                              <label className="mb-1 block text-sm font-semibold leading-tight text-gray-700">
                                Số {item.product.unit} trong thùng
                              </label>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                value={item.unitsPerBulk}
                                onChange={(e) => {
                                  const u = Math.max(1, Math.floor(Number(e.target.value) || 1))
                                  updateCartItem(index, {
                                    unitsPerBulk: u,
                                    bulkPrice: item.bulkPriceEdited ? item.bulkPrice : item.costPrice * u,
                                    isBulk: true,
                                  })
                                }}
                                aria-label={`Số ${item.product.unit} trong thùng`}
                                className="h-11 px-2 text-base font-bold"
                              />
                            </div>
                            <div className="col-span-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
                              → Giá mỗi {item.product.unit}:{' '}
                              <strong>{formatMoney(item.costPrice)}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Hạn sử dụng (không bắt buộc)
                        </label>
                        <Input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => {
                            updateCartItem(index, { expiryDate: e.target.value })
                            if (e.target.value) {
                              setExpandedCartItems((prev) => ({
                                ...prev,
                                [item.product.id]: true,
                              }))
                            }
                          }}
                          aria-label="Hạn sử dụng (không bắt buộc)"
                          className="h-11"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  const renderPurchaseInformation = (idPrefix: string) => (
    <div className="min-w-0 space-y-4 max-sm:space-y-3 rounded-2xl border border-gray-100 bg-white p-4 max-sm:p-3 shadow-sm sm:p-5">
      <h3 className="text-lg max-sm:text-sm font-bold text-gray-900">Thông tin phiếu nhập</h3>

      <div className="min-w-0">
        <label htmlFor={`${idPrefix}-supplier`} className="mb-1 block text-base font-semibold text-gray-700">
          Nhà cung cấp (không bắt buộc)
        </label>
        <select
          id={`${idPrefix}-supplier`}
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
          className="min-h-12 w-full min-w-0 max-w-full rounded-xl border-2 border-gray-300 bg-white px-3 text-lg max-sm:text-sm focus:border-blue-500"
        >
          <option value="">-- Không chọn --</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
              {supplier.phone ? ` (${supplier.phone})` : ''}
              {supplier.debt > 0 ? ` • Nợ: ${formatMoney(supplier.debt)}` : ''}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="min-w-0">
        <legend className="mb-1.5 block text-base font-semibold text-gray-700">Thanh toán</legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPayFull(true)}
            aria-pressed={payFull}
            className={`min-h-12 rounded-xl border-2 px-3 text-left text-base transition-all ${
              payFull
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="block font-bold">Trả ngay</span>
            <span className="mt-0.5 block text-sm text-gray-500">Thanh toán hết</span>
          </button>
          <button
            type="button"
            onClick={() => setPayFull(false)}
            aria-pressed={!payFull}
            className={`min-h-12 rounded-xl border-2 px-3 text-left text-base transition-all ${
              !payFull
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="block font-bold">Ghi nợ</span>
            <span className="mt-0.5 block text-sm text-gray-500">Trả một phần / sau</span>
          </button>
        </div>

        {!payFull && (
          <div className="mt-3 min-w-0">
            <label htmlFor={`${idPrefix}-paid-amount`} className="mb-1 block text-base font-semibold text-gray-700">
              Số tiền trả trước (đ)
            </label>
            <Input
              id={`${idPrefix}-paid-amount`}
              type="text"
              inputMode="numeric"
              value={formatMoneyInput(paidAmount)}
              onChange={(e) => setPaidAmount(parseMoney(e.target.value))}
              className="h-12 min-w-0 text-lg max-sm:text-sm font-bold"
            />
            {debtAmount > 0 && (
              <p className="mt-1 text-base font-medium text-red-600">
                Nợ nhà cung cấp: {formatMoney(debtAmount)}
              </p>
            )}
          </div>
        )}
      </fieldset>

      <div className="min-w-0">
        <label htmlFor={`${idPrefix}-note`} className="mb-1 block text-base font-semibold text-gray-700">
          Ghi chú (không bắt buộc)
        </label>
        <textarea
          id={`${idPrefix}-note`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full min-w-0 max-w-full resize-none rounded-xl border-2 border-gray-300 p-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="Ghi chú thêm nếu cần..."
        />
      </div>
    </div>
  )

  const renderPurchaseSummary = () => (
    <div className="space-y-3 rounded-2xl bg-blue-600 p-4 max-sm:p-3 text-white shadow-md sm:p-5">
      <div className="flex items-center justify-between gap-2 text-lg max-sm:text-sm">
        <span>Tổng hàng:</span>
        <span className="font-semibold">{cart.length} món</span>
      </div>
      <div className="flex items-center justify-between gap-2 text-lg max-sm:text-sm">
        <span>Tổng số lượng:</span>
        <span className="font-semibold">
          {cart.reduce((sum, item) => sum + getPurchaseQuantity(item), 0)}
        </span>
      </div>
      <div className="mt-2 border-t border-blue-500 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xl max-sm:text-base font-semibold">Tổng tiền:</span>
          <span className="whitespace-nowrap text-base font-bold sm:text-xl">{formatMoney(totalAmount)}</span>
        </div>
      </div>
      {!payFull && debtAmount > 0 && (
        <div className="flex items-center justify-between gap-2 text-base text-yellow-200">
          <span>Nợ nhà cung cấp:</span>
          <span className="font-bold">{formatMoney(debtAmount)}</span>
        </div>
      )}
      <Button
        onClick={handleSubmit}
        disabled={isPending || cart.length === 0}
        className="mt-2 min-h-14 w-full rounded-xl bg-white text-xl max-sm:text-base font-bold text-blue-700 shadow-md hover:bg-blue-50"
      >
        {isPending ? 'Đang xử lý...' : 'Lưu phiếu nhập'}
      </Button>
    </div>
  )

  const renderPurchaseHistoryLink = () => (
    <Link
      href="/nhap-hang/lich-su"
      className="flex min-h-[52px] items-center justify-center gap-3 max-sm:gap-2 rounded-2xl border-2 border-blue-600 bg-white px-5 max-sm:px-3 text-lg max-sm:text-sm font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
    >
      <History className="h-6 w-6" />
      Lịch sử nhập hàng
    </Link>
  )

  return (
    <div className="min-w-0 max-w-full space-y-6 max-sm:space-y-3 pb-40 lg:pb-6">
      {/* Header */}
      
        <h1 className="text-2xl max-sm:text-lg sm:text-3xl font-bold text-gray-900 flex items-center gap-3 max-sm:gap-2">
          Nhập hàng
        </h1>


      {/* Lỗi form */}
      {formError && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 max-sm:p-3 rounded-xl text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{formError}</span>
          <button onClick={() => setFormError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Thông báo nhập thành công */}
      {successInfo && !showPriceModal && (
        <div className="bg-green-50 border-2 border-green-300 p-5 max-sm:p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 max-sm:gap-2 mb-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-xl max-sm:text-base font-bold text-green-800">
                Nhập hàng thành công!
              </div>
              <div className="text-green-700 text-base">
                Phiếu nhập: <strong>{successInfo.code}</strong>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 max-sm:gap-2 text-base">
            <div>
              Tổng tiền nhập: <strong className="text-gray-900">{formatMoney(successInfo.total)}</strong>
            </div>
            {successInfo.debt > 0 && (
              <div>
                Còn nợ nhà cung cấp: <strong className="text-red-600">{formatMoney(successInfo.debt)}</strong>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className="mt-3 min-h-[44px]"
            onClick={() => setSuccessInfo(null)}
          >
            Đóng
          </Button>
        </div>
      )}

      <div className="grid min-w-0 max-w-full grid-cols-1 gap-6 max-sm:gap-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
        {/* ————————————————————————————————————
            CỘT TRÁI: Chọn hàng
           ———————————————————————————————————— */}
        <div className="min-w-0 max-w-full space-y-4 max-sm:space-y-3">
          {/* Tìm hàng */}
          <div className="min-w-0 max-w-full rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-5">
            <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
              <h2 className="min-w-0 text-base font-bold text-gray-900">Chọn hàng nhập</h2>
              
            </div>
            <div className="relative">
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                }}
                placeholder="Gõ tên hoặc mã hàng..."
                className="h-12 min-w-0 border-2 border-gray-200 px-3 py-2 pr-10 text-sm focus:border-blue-500"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('')
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="mt-3 min-w-0 max-w-full" aria-label="Lọc theo nhóm hàng">
              <label htmlFor="purchase-category" className="mb-1 block text-sm font-semibold text-gray-800 sm:text-base">
                Nhóm hàng
              </label>
              <select
                id="purchase-category"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-12 min-h-[48px] w-full min-w-0 max-w-full rounded-xl border-2 border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 sm:text-base"
              >
                <option value="all">Tất cả nhóm</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {feedback && (
              <p className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-lg max-sm:text-sm font-semibold text-green-800" role="status">
                {feedback}
              </p>
            )}

            {lowStockProducts.length > 0 && (
              <section className="mt-4 max-sm:mt-3 space-y-3" aria-label="Hàng gần hết">
                <h3 className="text-xl max-sm:text-base font-bold text-gray-900">Hàng gần hết</h3>
                <div className="grid min-w-0 max-w-full grid-cols-2 gap-3 max-sm:gap-2 sm:grid-cols-3">
                  {visibleLowStockProducts.map((product) => renderProductCard(product, true))}
                </div>
                {lowStockProducts.length > lowStockVisibleCount && (
                  <div ref={lowStockSentinelRef} className="min-h-10 text-center text-lg max-sm:text-sm text-gray-600">
                    Cuộn để xem thêm hàng gần hết...
                  </div>
                )}
              </section>
            )}

            <section className="mt-4 max-sm:mt-3 space-y-3" aria-label="Tất cả món hàng">
              <div className="flex items-center justify-between gap-2">
                <h3 className="whitespace-nowrap text-base font-bold text-gray-900">Tất cả món hàng</h3>
                <span className="whitespace-nowrap text-xs text-gray-600">{filteredProducts.length} món</span>
              </div>
              {visibleProducts.length > 0 ? (
                <div className="grid min-w-0 max-w-full grid-cols-2 gap-3 max-sm:gap-2 sm:grid-cols-3">
                  {visibleProducts.map((product) => renderProductCard(product))}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-gray-300 p-7 text-center">
                  <PackageIcon className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                  <p className="text-lg max-sm:text-sm font-semibold text-gray-700">
                    {search.trim() ? 'Không tìm thấy món hàng phù hợp' : 'Chưa có món hàng để hiển thị'}
                  </p>
                  {search.trim() && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 min-h-[48px] text-green-700 border-green-300 hover:bg-green-50"
                      onClick={openQuickAdd}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Tạo hàng mới ngay
                    </Button>
                  )}
                </div>
              )}
              {visibleProducts.length > 0 && (
                <div ref={allProductsSentinelRef} className="min-h-10 text-center text-lg max-sm:text-sm text-gray-600" aria-live="polite">
                  {allProductsVisibleCount < filteredProducts.length ? 'Cuộn để tải thêm món...' : ''}
                </div>
              )}
            </section>
          </div>

          {/* Danh sách hàng đã chọn */}
          {false && cart.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-blue-50 px-5 max-sm:px-3 py-3 max-sm:py-2 border-b border-blue-100">
                <h3 className="font-bold text-blue-900 text-lg max-sm:text-sm">
                  Các món cần nhập ({cart.length} món)
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {cart.map((item, index) => {
                  const subtotal = Math.round(item.costPrice * getPurchaseQuantity(item))
                  const costDiff = item.costPrice - item.product.last_cost
                  const hasDiff = costDiff !== 0

                  return (
                    <div key={item.product.id} className="p-4 max-sm:p-3 sm:p-5 space-y-3">
                      {/* Dòng 1: Tên hàng + Nút xóa */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="font-bold text-gray-900 text-lg max-sm:text-sm">{item.product.name}</div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono font-bold">
                              {item.product.code}
                            </span>
                            <span className="text-gray-500 text-sm">ĐVT: {item.product.unit}</span>
                            <Badge variant={item.product.price_mode === 'auto' ? 'default' : 'outline'}>
                              {item.product.price_mode === 'auto' ? 'Tự đề xuất giá' : 'Giá cố định'}
                            </Badge>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa khỏi phiếu nhập"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Dòng 2: Số lượng + Giá nhập */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-sm:gap-2">
                        {/* Số lượng */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Số {item.isBulk ? 'thùng' : `lượng (${item.product.unit})`}
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => decreaseCartQuantity(index)}
                              className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                            <Input
                              type="number"
                              inputMode={item.isBulk ? 'numeric' : 'decimal'}
                              step={item.isBulk ? '1' : 'any'}
                              min={item.isBulk ? '1' : '0.001'}
                              value={item.quantity}
                              onChange={(e) => {
                                const rawValue = e.target.value
                                if (rawValue === '') {
                                  return
                                }
                                const quantity = Number(rawValue)
                                if (!Number.isFinite(quantity)) return
                                updateCartItem(index, {
                                  quantity: item.isBulk
                                    ? Math.max(1, Math.floor(quantity))
                                    : roundQuantity(quantity),
                                })
                              }}
                              onBlur={(e) => handleQuantityBlur(index, e.target.value)}
                              className="text-center text-lg max-sm:text-sm font-bold flex-1 h-12"
                            />
                            <button
                              type="button"
                              onClick={() => increaseCartQuantity(index)}
                              className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Giá nhập */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Giá nhập mỗi {item.product.unit} (đ)
                          </label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={formatMoneyInput(item.costPrice)}
                            onChange={(e) =>
                              updateCartItem(index, {
                                costPrice: parseMoney(e.target.value),
                                isBulk: false,
                              })
                            }
                            className="text-lg max-sm:text-sm font-bold h-12"
                          />
                          {hasDiff && (
                            <div
                              className={`text-sm mt-1 flex items-center gap-1 font-medium ${
                                costDiff > 0 ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {costDiff > 0 ? (
                                <ArrowUpCircle className="w-4 h-4" />
                              ) : (
                                <ArrowDownCircle className="w-4 h-4" />
                              )}
                              {costDiff > 0 ? 'Tăng' : 'Giảm'} {formatMoney(Math.abs(costDiff))} so với lần trước ({formatMoney(item.product.last_cost)})
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dòng 3: Nhập theo thùng (toggle) */}
                      <div className="bg-gray-50 rounded-xl p-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.isBulk}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateCartItem(index, {
                                  isBulk: true,
                                  bulkPrice: item.costPrice * item.unitsPerBulk,
                                  bulkPriceEdited: false,
                                })
                              } else {
                                updateCartItem(index, { isBulk: false, bulkPriceEdited: false })
                              }
                            }}
                            className="w-5 h-5 rounded accent-blue-600"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Nhập theo thùng (tự tính giá mỗi {item.product.unit})
                          </span>
                        </label>

                        {item.isBulk && (
                          <div className="grid grid-cols-2 gap-3 max-sm:gap-2 mt-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Giá cả thùng (đ)
                              </label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={formatMoneyInput(item.bulkPrice)}
                                onChange={(e) => {
                                  const bp = parseMoney(e.target.value)
                                  updateCartItem(index, {
                                    bulkPrice: bp,
                                    isBulk: true,
                                    bulkPriceEdited: true,
                                  })
                                }}
                                className="text-base font-bold h-11"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Số {item.product.unit} trong thùng
                              </label>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                value={item.unitsPerBulk}
                                onChange={(e) => {
                                  const u = Math.max(1, Math.floor(Number(e.target.value) || 1))
                                  updateCartItem(index, {
                                    unitsPerBulk: u,
                                    bulkPrice: item.bulkPriceEdited ? item.bulkPrice : item.costPrice * u,
                                    isBulk: true,
                                  })
                                }}
                                className="text-base font-bold h-11"
                              />
                            </div>
                            <div className="col-span-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                              → Giá mỗi {item.product.unit}:{' '}
                              <strong>{formatMoney(item.costPrice)}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Dòng 4: Hạn dùng (không bắt buộc) */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Hạn sử dụng (không bắt buộc)
                        </label>
                        <Input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) =>
                            updateCartItem(index, { expiryDate: e.target.value })
                          }
                          className="h-11 max-w-xs"
                        />
                      </div>

                      {/* Thành tiền */}
                      <div className="flex justify-end items-center pt-1 border-t border-gray-100 text-base">
                        <span className="text-gray-500 mr-2">Thành tiền:</span>
                        <span className="text-xl max-sm:text-base font-bold text-gray-900">{formatMoney(subtotal)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Trạng thái trống */}
          {false && cart.length === 0 && !successInfo && (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
              <PackagePlus className="w-16 h-16 text-gray-300 mx-auto mb-4 max-sm:mb-3" />
              <h3 className="text-xl max-sm:text-base font-bold text-gray-700 mb-2">Chưa có món hàng nào</h3>
              <p className="text-gray-500 text-base max-w-md mx-auto">
                Dùng ô tìm kiếm phía trên để chọn hàng cần nhập, hoặc bấm &quot;Tạo hàng mới&quot; nếu chưa có trong danh sách.
              </p>
            </div>
          )}
        </div>

        <aside className="hidden min-w-0 space-y-4 max-sm:space-y-3 lg:sticky lg:top-4 lg:block lg:self-start">
          {renderSelectedItems('desktop')}
          {renderPurchaseInformation('desktop')}
          {renderPurchaseSummary()}
          {renderPurchaseHistoryLink()}
        </aside>
      </div>

      {isCartOpen && (
        <button
          type="button"
          aria-label="Đóng phiếu nhập"
          onClick={() => setIsCartOpen(false)}
          className="fixed inset-0 z-[55] bg-black/50 lg:hidden"
        />
      )}
      <section
        className={`fixed inset-x-0 bottom-0 z-[60] flex max-h-[90dvh] min-w-0 flex-col overflow-y-auto rounded-t-3xl bg-gray-50 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl transition-[transform,visibility] duration-300 lg:hidden ${
          isCartOpen ? 'visible translate-y-0' : 'invisible translate-y-full'
        }`}
        aria-label="Phiếu nhập"
        role={isCartOpen ? 'dialog' : undefined}
        aria-modal={isCartOpen ? true : undefined}
        aria-hidden={!isCartOpen}
      >
        <div className="mb-3 flex items-center justify-between gap-3 max-sm:gap-2">
          <h2 className="text-xl max-sm:text-base font-bold text-gray-900">Phiếu nhập</h2>
          <button
            type="button"
            aria-label="Đóng phiếu nhập"
            onClick={() => setIsCartOpen(false)}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-gray-300 bg-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="min-w-0 space-y-4 max-sm:space-y-3">
          {formError && (
            <p className="rounded-xl border-2 border-red-200 bg-red-50 p-3 text-base text-red-700" role="alert">
              {formError}
            </p>
          )}
          {renderSelectedItems('mobile')}
          {renderPurchaseInformation('mobile')}
          {renderPurchaseSummary()}
          {renderPurchaseHistoryLink()}
        </div>
      </section>

      <div className="fixed inset-x-2 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 lg:hidden">
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex w-full items-center justify-between gap-2 rounded-xl bg-blue-700 px-3 py-1.5 text-left text-white shadow-xl"
          aria-label={`Xem phiếu nhập: ${cart.length} món, tổng ${formatMoney(totalAmount)}`}
          aria-expanded={isCartOpen}
        >
          <span className="min-w-0 whitespace-nowrap text-[13px] font-medium leading-none">
            Phiếu: {cart.length} món • {formatMoney(totalAmount)}
          </span>
          <span className="inline-flex items-center justify-center h-7 !min-h-0 px-3 py-0 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 leading-none bg-white text-blue-800">
            Xem phiếu
          </span>
        </button>
      </div>

      <PurchaseModals model={model} />
    </div>
  )
}
