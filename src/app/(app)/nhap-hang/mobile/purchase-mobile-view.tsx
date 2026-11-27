'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
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

function ExpandableProductName({ name }: { name: string }) {
  const [expanded, setExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const textRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    if (expanded) return
    const el = textRef.current
    if (!el) return

    const checkTruncation = () => {
      setIsTruncated(el.scrollHeight > el.clientHeight + 1)
    }

    checkTruncation()
    const observer = new ResizeObserver(checkTruncation)
    observer.observe(el)
    return () => observer.disconnect()
  }, [name, expanded])

  return (
    <div className="relative w-full min-w-0">
      <span
        ref={textRef}
        className={`break-words text-sm font-bold leading-5 text-gray-900 sm:text-base ${
          expanded ? 'block' : 'line-clamp-2'
        }`}
      >
        {name}
        {expanded && isTruncated && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="ml-1.5 inline text-xs font-semibold text-blue-950 hover:underline"
          >
            Thu gọn
          </button>
        )}
      </span>

      {!expanded && isTruncated && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="absolute bottom-0 right-0 bg-gradient-to-l from-white via-white via-80% to-transparent pl-3 text-xs font-semibold leading-5 text-blue-950 hover:underline"
        >
          ...thêm
        </button>
      )}
    </div>
  )
}

function HoldRepeatButton({
  onSingleStep,
  onHoldStep,
  className,
  ariaLabel,
  children,
}: {
  onSingleStep: () => void
  onHoldStep: () => void
  className?: string
  ariaLabel: string
  children: React.ReactNode
}) {
  const singleStepRef = useRef(onSingleStep)
  const holdStepRef = useRef(onHoldStep)

  useEffect(() => {
    singleStepRef.current = onSingleStep
    holdStepRef.current = onHoldStep
  }, [onSingleStep, onHoldStep])

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const didHoldRef = useRef(false)
  const isPressingRef = useRef(false)

  const clearTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => clearTimers, [])

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    isPressingRef.current = true
    didHoldRef.current = false
    clearTimers()

    intervalRef.current = setInterval(() => {
      didHoldRef.current = true
      holdStepRef.current()
    }, 500)
  }

  const handlePointerEnd = () => {
    if (!isPressingRef.current) return
    isPressingRef.current = false
    clearTimers()
    if (!didHoldRef.current) {
      singleStepRef.current()
    }
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerLeave={() => {
        isPressingRef.current = false
        clearTimers()
      }}
      onPointerCancel={() => {
        isPressingRef.current = false
        clearTimers()
      }}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault()
          singleStepRef.current()
        }
      }}
      className={`select-none touch-manipulation ${className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function PurchaseMobileView({
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
  const { suppliers, cart, search, setSearch, selectedSupplier, setSelectedSupplier, paidAmount, setPaidAmount, note, setNote, payFull, setPayFull, selectedCategory, setSelectedCategory, expandedCartItems, setExpandedCartItems, isCartOpen, setIsCartOpen, showPriceModal, successInfo, setSuccessInfo, categories, formError, setFormError, isPending, getPurchaseQuantity, totalAmount, debtAmount, filteredProducts, lowStockProducts, allProductsVisibleCount, lowStockVisibleCount, visibleProducts, visibleLowStockProducts, addToCart, updateCartItem, roundQuantity, decreaseCartQuantity, increaseCartQuantity, handleQuantityBlur, removeFromCart, handleSubmit, openQuickAdd } = model
  const [isExtraInfoOpen, setIsExtraInfoOpen] = useState(false)

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
            ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-600/30'
            : 'border-gray-300 bg-white hover:border-blue-700 hover:bg-blue-50'
        }`}
      >
        {selectedQuantity > 0 && (
          <span
            className="absolute right-2 top-2 inline-flex min-h-7 min-w-7 items-center justify-center rounded-full bg-blue-800 px-2 text-xs font-bold text-white"
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
          <span className="max-w-full truncate whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-950">
            Còn: {Number(product.stock)} {product.unit}
          </span>
        )}
        <span className="max-w-full truncate whitespace-nowrap text-xs text-gray-900">
          Giá cũ: {formatMoney(product.last_cost)}
        </span>
        {!lowStock && (
          <span className="max-w-full truncate whitespace-nowrap text-xs text-gray-900">
            Còn: {Number(product.stock)} {product.unit}
          </span>
        )}
      </button>
    )
  }

  const renderSelectedItems = (idPrefix: string) => (
    <div className="min-w-0 max-w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="bg-blue-50 px-4 max-sm:px-3 py-2 border-b border-blue-700">
          <h3 className="font-bold text-blue-950 text-lg max-sm:text-sm">
            Các món cần nhập ({cart.length} món)
          </h3>
        </div>
        {cart.length === 0 ? (
          <p className="px-4 max-sm:px-3 py-2 text-base text-gray-900">
            Chưa chọn món. Chọn thẻ bên dưới để thêm ngay.
          </p>
        ) : (
            <div className="max-h-[42vh] divide-y divide-gray-300 overflow-y-auto pr-1">
            {cart.map((item, index) => {
              const subtotal = Math.round(item.costPrice * getPurchaseQuantity(item))
              const costDiff = item.costPrice - item.product.last_cost
              const hasDiff = costDiff !== 0
              const isOptionsExpanded =
                expandedCartItems[item.product.id] ?? (item.isBulk || Boolean(item.expiryDate))
              const hasOptionalSetting = item.isBulk || Boolean(item.expiryDate)

              return (
                <div key={item.product.id} className="space-y-2 border-b border-gray-300 p-3 last:border-b-0 sm:p-4">
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                      <ExpandableProductName name={item.product.name} />
                      <Badge
                        variant={item.product.price_mode === 'auto' ? 'default' : 'outline'}
                        className="shrink-0 whitespace-nowrap px-2 py-0.5 text-xs leading-4"
                      >
                        {item.product.price_mode === 'auto' ? 'Tự đề xuất giá' : 'Giá cố định'}
                      </Badge>
                    </div>
                    <div className="flex shrink-0 items-start justify-end gap-1">
                      <span className="min-w-0 text-right">
                        <span className="block text-xs font-medium text-gray-900">Thành tiền</span>
                        <span className="block whitespace-nowrap text-sm font-bold tabular-nums text-gray-900 sm:text-lg">
                          {formatMoney(subtotal)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        aria-label={`Xóa ${item.product.name} khỏi phiếu nhập`}
                        title="Xóa khỏi phiếu nhập"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-800 transition-colors hover:bg-red-50 hover:text-red-800 sm:h-10 sm:w-10"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-[124px_minmax(0,1fr)] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <div className="min-w-0">
                      <label className="mb-1 block text-xs font-semibold leading-tight text-gray-900 sm:text-sm">
                        {item.isBulk ? 'Số thùng' : `Số lượng (${item.product.unit})`}
                      </label>
<div className="flex min-w-0 items-center gap-1">
                        <HoldRepeatButton
                          ariaLabel={`Giảm số lượng ${item.product.name}`}
                          onSingleStep={() => decreaseCartQuantity(index)}
                          onHoldStep={() =>
                            updateCartItem(index, {
                              quantity: item.isBulk
                                ? Math.max(1, Math.floor(item.quantity - 10))
                                : Math.max(1, roundQuantity(item.quantity - 10)),
                            })
                          }
                          className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-900 transition-colors hover:bg-gray-200 sm:h-11 sm:w-11"
                        >
                          <Minus className="h-4 w-4" />
                        </HoldRepeatButton>
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
                          className="h-9 min-w-0 flex-1 appearance-none px-1 text-center text-sm font-bold sm:h-11 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <HoldRepeatButton
                          ariaLabel={`Tăng số lượng ${item.product.name}`}
                          onSingleStep={() => increaseCartQuantity(index)}
                          onHoldStep={() =>
                            updateCartItem(index, {
                              quantity: item.isBulk
                                ? Math.floor(item.quantity) + 10
                                : roundQuantity(item.quantity + 10),
                            })
                          }
                          className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-900 transition-colors hover:bg-gray-200 sm:h-11 sm:w-11"
                        >
                          <Plus className="h-4 w-4" />
                        </HoldRepeatButton>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <label className="mb-1 block text-xs font-semibold leading-tight text-gray-900 sm:text-sm">
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
                        className="h-9 px-2 text-sm font-bold sm:h-11 sm:text-base"
                      />
                      {hasDiff && (
                        <div
                          className={`mt-1 flex items-center gap-1 text-xs font-medium leading-tight ${
                            costDiff > 0 ? 'text-red-800' : 'text-green-900'
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
                      className="col-span-2 flex h-9 min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-900 transition-colors hover:bg-gray-100 sm:col-span-1 sm:h-11 sm:min-w-44 sm:text-sm"
                    >
                      <span className="whitespace-nowrap">Thùng / Hạn SD</span>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            hasOptionalSetting ? 'bg-green-800' : 'bg-gray-300'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="truncate text-xs font-medium text-gray-900">
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
                      className="grid grid-cols-1 gap-2.5 rounded-lg bg-gray-100 p-2.5 sm:grid-cols-2 sm:gap-3 sm:p-3"
                    >
                      <div className="min-w-0">
                        <label className="flex min-h-9 cursor-pointer select-none items-center gap-2 sm:min-h-11">
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
                            className="h-4 w-4 shrink-0 rounded accent-blue-600 sm:h-5 sm:w-5"
                          />
                          <span className="text-xs font-semibold leading-tight text-gray-900 sm:text-sm">
                            Nhập theo thùng
                          </span>
                        </label>

{item.isBulk && (
                          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_124px] items-end gap-2 sm:grid-cols-2">
                            <div className="min-w-0">
                              <label className="mb-1 block text-xs font-semibold leading-tight text-gray-900 sm:text-sm">
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
                                className="h-9 px-2 text-sm font-bold sm:h-11 sm:text-base"
                              />
                            </div>

                            <div className="min-w-0">
                              <label className="mb-1 block text-xs font-semibold leading-tight text-gray-900 sm:text-sm">
                                Số {item.product.unit} trong thùng
                              </label>
                              <div className="flex min-w-0 items-center gap-1">
                                <HoldRepeatButton
                                  ariaLabel={`Giảm số ${item.product.unit} trong thùng`}
                                  onSingleStep={() => {
                                    const u = Math.max(1, item.unitsPerBulk - 1)
                                    updateCartItem(index, {
                                      unitsPerBulk: u,
                                      bulkPrice: item.bulkPriceEdited ? item.bulkPrice : item.costPrice * u,
                                      isBulk: true,
                                    })
                                  }}
                                  onHoldStep={() => {
                                    const u = Math.max(1, item.unitsPerBulk - 10)
                                    updateCartItem(index, {
                                      unitsPerBulk: u,
                                      bulkPrice: item.bulkPriceEdited ? item.bulkPrice : item.costPrice * u,
                                      isBulk: true,
                                    })
                                  }}
                                  className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-300 text-gray-900 transition-colors hover:bg-gray-100 sm:h-11 sm:w-11"
                                >
                                  <Minus className="h-4 w-4" />
                                </HoldRepeatButton>

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
                                  className="h-9 min-w-0 flex-1 appearance-none px-1 text-center text-sm font-bold sm:h-11 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />

                                <HoldRepeatButton
                                  ariaLabel={`Tăng số ${item.product.unit} trong thùng`}
                                  onSingleStep={() => {
                                    const u = item.unitsPerBulk + 1
                                    updateCartItem(index, {
                                      unitsPerBulk: u,
                                      bulkPrice: item.bulkPriceEdited ? item.bulkPrice : item.costPrice * u,
                                      isBulk: true,
                                    })
                                  }}
                                  onHoldStep={() => {
                                    const u = item.unitsPerBulk + 10
                                    updateCartItem(index, {
                                      unitsPerBulk: u,
                                      bulkPrice: item.bulkPriceEdited ? item.bulkPrice : item.costPrice * u,
                                      isBulk: true,
                                    })
                                  }}
                                  className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-300 text-gray-900 transition-colors hover:bg-gray-100 sm:h-11 sm:w-11"
                                >
                                  <Plus className="h-4 w-4" />
                                </HoldRepeatButton>
                              </div>
                            </div>

                            <div className="col-span-2 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-950 sm:text-sm">
                              → Giá mỗi {item.product.unit}:{' '}
                              <strong>{formatMoney(item.costPrice)}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <label className="mb-1 block text-xs font-semibold text-gray-900 sm:text-sm">
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
                          className="h-9 text-sm sm:h-11"
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

  const renderPurchaseInformation = (idPrefix: string) => {
    const hasExtraInfo = Boolean(selectedSupplier) || Boolean(note.trim())

    return (
      <div className="min-w-0 space-y-3 rounded-2xl border border-gray-300 bg-white p-3 shadow-sm sm:p-4">
        <h3 className="text-sm font-bold text-gray-900 sm:text-base">Thông tin phiếu nhập</h3>

        <fieldset className="min-w-0">
          <legend className="mb-1.5 block text-xs font-semibold text-gray-900 sm:text-sm">Thanh toán</legend>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPayFull(true)}
              aria-pressed={payFull}
              className={`min-h-11 rounded-xl border-2 px-2.5 py-1.5 text-left text-sm transition-all ${
                payFull
                  ? 'border-blue-700 bg-blue-50 text-blue-950'
                  : 'border-gray-300 hover:border-gray-300'
              }`}
            >
              <span className="block font-bold">Trả ngay</span>
            </button>
            <button
              type="button"
              onClick={() => setPayFull(false)}
              aria-pressed={!payFull}
              className={`min-h-11 rounded-xl border-2 px-2.5 py-1.5 text-left text-sm transition-all ${
                !payFull
                  ? 'border-blue-700 bg-blue-50 text-blue-950'
                  : 'border-gray-300 hover:border-gray-300'
              }`}
            >
              <span className="block font-bold">Ghi nợ</span>
            </button>
          </div>

          {!payFull && (
            <div className="mt-2.5 min-w-0">
              <label htmlFor={`${idPrefix}-paid-amount`} className="mb-1 block text-xs font-semibold text-gray-900 sm:text-sm">
                Số tiền trả trước (đ)
              </label>
              <Input
                id={`${idPrefix}-paid-amount`}
                type="text"
                inputMode="numeric"
                value={formatMoneyInput(paidAmount)}
                onChange={(e) => setPaidAmount(parseMoney(e.target.value))}
                className="h-10 min-w-0 text-sm font-bold"
              />
              {debtAmount > 0 && (
                <p className="mt-1 text-xs font-medium text-red-800">
                  Nợ nhà cung cấp: {formatMoney(debtAmount)}
                </p>
              )}
            </div>
          )}
        </fieldset>

        <div className="min-w-0">
          <button
            type="button"
            aria-expanded={isExtraInfoOpen}
            aria-controls={`${idPrefix}-extra-info`}
            onClick={() => setIsExtraInfoOpen((prev) => !prev)}
            className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-gray-100 px-2.5 text-xs font-semibold text-gray-900 transition-colors hover:bg-gray-100 sm:text-sm"
          >
            <span className="flex items-center gap-1.5">
              <span>Thêm</span>
              <span className="font-normal text-gray-900">(Nhà cung cấp, ghi chú)</span>
              {hasExtraInfo && (
                <span className="h-2 w-2 rounded-full bg-green-800" aria-hidden="true" />
              )}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-900 transition-transform ${
                isExtraInfoOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isExtraInfoOpen && (
            <div
              id={`${idPrefix}-extra-info`}
              className="mt-2 space-y-2.5 rounded-lg border border-gray-300 bg-gray-100/70 p-2.5"
            >
              <div className="min-w-0">
                <label htmlFor={`${idPrefix}-supplier`} className="mb-1 block text-xs font-semibold text-gray-900">
                  Nhà cung cấp (không bắt buộc)
                </label>
                <select
                  id={`${idPrefix}-supplier`}
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="h-10 w-full min-w-0 max-w-full rounded-lg border border-gray-300 bg-white px-2.5 text-sm focus:border-blue-700"
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

              <div className="min-w-0">
                <label htmlFor={`${idPrefix}-note`} className="mb-1 block text-xs font-semibold text-gray-900">
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  id={`${idPrefix}-note`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full min-w-0 max-w-full resize-none rounded-lg border border-gray-300 bg-white p-2 text-sm focus:border-blue-700 focus:outline-none"
                  placeholder="Ghi chú thêm nếu cần..."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderPurchaseSummary = () => (
    <div className="space-y-3 rounded-2xl bg-blue-800 p-4 max-sm:p-3 text-white shadow-md sm:p-5">
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
      <div className="mt-2 border-t border-blue-700 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xl max-sm:text-base font-semibold">Tổng tiền:</span>
          <span className="whitespace-nowrap text-base font-bold sm:text-xl">{formatMoney(totalAmount)}</span>
        </div>
      </div>
      {!payFull && debtAmount > 0 && (
        <div className="flex items-center justify-between gap-2 text-base text-amber-950">
          <span>Nợ nhà cung cấp:</span>
          <span className="font-bold">{formatMoney(debtAmount)}</span>
        </div>
      )}
      <Button
        onClick={handleSubmit}
        disabled={isPending || cart.length === 0}
        className="mt-2 min-h-14 w-full rounded-xl bg-white text-xl max-sm:text-base font-bold text-blue-950 shadow-md hover:bg-blue-50"
      >
        {isPending ? 'Đang xử lý...' : 'Lưu phiếu nhập'}
      </Button>
    </div>
  )

const renderPurchaseHistoryLink = () => (
    <Link
      href="/nhap-hang/lich-su"
      className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-blue-700 bg-white px-2.5 text-xs font-semibold text-blue-950 shadow-sm transition-colors hover:bg-blue-50 sm:h-10 sm:px-3.5 sm:text-sm"
    >
      <History className="h-4 w-4 shrink-0" />
      Lịch sử nhập hàng
    </Link>
  )

  return (
    <div className="min-w-0 max-w-full space-y-6 max-sm:space-y-3 pb-40 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl max-sm:text-lg sm:text-3xl font-bold text-gray-900 flex items-center gap-3 max-sm:gap-2">
          Nhập hàng
        </h1>
        {renderPurchaseHistoryLink()}
      </div>


      {/* Lỗi form */}
      {formError && (
        <div className="bg-red-50 border-2 border-red-300 text-red-800 p-4 max-sm:p-3 rounded-xl text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-800" />
          <span>{formError}</span>
          <button onClick={() => setFormError('')} className="ml-auto text-red-800 hover:text-red-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Thông báo nhập thành công */}
      {successInfo && !showPriceModal && (
        <div className="bg-emerald-100 border-2 border-emerald-400 p-5 max-sm:p-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 max-sm:gap-2 mb-3">
            <CheckCircle className="w-8 h-8 text-green-900" />
            <div>
              <div className="text-xl max-sm:text-base font-bold text-green-900">
                Nhập hàng thành công!
              </div>
              <div className="text-green-900 text-base">
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
                Còn nợ nhà cung cấp: <strong className="text-red-800">{formatMoney(successInfo.debt)}</strong>
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
          <div className="min-w-0 max-w-full rounded-2xl border border-gray-300 bg-white p-3 shadow-sm sm:p-5">
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
                className="h-12 min-w-0 border-2 border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-700"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('')
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-900 hover:text-gray-900 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="mt-3 min-w-0 max-w-full" aria-label="Lọc theo nhóm hàng">
              <label htmlFor="purchase-category" className="mb-1 block text-sm font-semibold text-gray-900 sm:text-base">
                Nhóm hàng
              </label>
              <select
                id="purchase-category"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-12 min-h-[48px] w-full min-w-0 max-w-full rounded-xl border-2 border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-700 sm:text-base"
              >
                <option value="all">Tất cả nhóm</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {lowStockProducts.length > 0 && (
              <section className="mt-4 max-sm:mt-3 space-y-3" aria-label="Hàng gần hết">
                <h3 className="text-xl max-sm:text-base font-bold text-gray-900">Hàng gần hết</h3>
                <div className="grid min-w-0 max-w-full grid-cols-2 gap-3 max-sm:gap-2 sm:grid-cols-3">
                  {visibleLowStockProducts.map((product) => renderProductCard(product, true))}
                </div>
                {lowStockProducts.length > lowStockVisibleCount && (
                  <div ref={lowStockSentinelRef} className="min-h-10 text-center text-lg max-sm:text-sm text-gray-900">
                    Cuộn để xem thêm hàng gần hết...
                  </div>
                )}
              </section>
            )}

            <section className="mt-4 max-sm:mt-3 space-y-3" aria-label="Tất cả món hàng">
              <div className="flex items-center justify-between gap-2">
                <h3 className="whitespace-nowrap text-base font-bold text-gray-900">Tất cả món hàng</h3>
                <span className="whitespace-nowrap text-xs text-gray-900">{filteredProducts.length} món</span>
              </div>
              {visibleProducts.length > 0 ? (
                <div className="grid min-w-0 max-w-full grid-cols-2 gap-3 max-sm:gap-2 sm:grid-cols-3">
                  {visibleProducts.map((product) => renderProductCard(product))}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-gray-300 p-7 text-center">
                  <PackageIcon className="mx-auto mb-2 h-10 w-10 text-gray-900" />
                  <p className="text-lg max-sm:text-sm font-semibold text-gray-900">
                    {search.trim() ? 'Không tìm thấy món hàng phù hợp' : 'Chưa có món hàng để hiển thị'}
                  </p>
                  {search.trim() && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 min-h-[48px] text-green-900 border-emerald-400 hover:bg-emerald-100"
                      onClick={openQuickAdd}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Tạo hàng mới ngay
                    </Button>
                  )}
                </div>
              )}
              {visibleProducts.length > 0 && (
                <div ref={allProductsSentinelRef} className="min-h-10 text-center text-lg max-sm:text-sm text-gray-900" aria-live="polite">
                  {allProductsVisibleCount < filteredProducts.length ? 'Cuộn để tải thêm món...' : ''}
                </div>
              )}
            </section>
          </div>

          {/* Danh sách hàng đã chọn */}
          {false && cart.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
              <div className="bg-blue-50 px-5 max-sm:px-3 py-3 max-sm:py-2 border-b border-blue-700">
                <h3 className="font-bold text-blue-950 text-lg max-sm:text-sm">
                  Các món cần nhập ({cart.length} món)
                </h3>
              </div>
              <div className="max-h-[45vh] divide-y divide-gray-300 overflow-y-auto">
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
                            <span className="bg-gray-100 text-gray-900 px-2 py-0.5 rounded text-xs font-mono font-bold">
                              {item.product.code}
                            </span>
                            <span className="text-gray-900 text-sm">ĐVT: {item.product.unit}</span>
                            <Badge variant={item.product.price_mode === 'auto' ? 'default' : 'outline'}>
                              {item.product.price_mode === 'auto' ? 'Tự đề xuất giá' : 'Giá cố định'}
                            </Badge>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-800 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa khỏi phiếu nhập"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Dòng 2: Số lượng + Giá nhập */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-sm:gap-2">
                        {/* Số lượng */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-1">
                            Số {item.isBulk ? 'thùng' : `lượng (${item.product.unit})`}
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => decreaseCartQuantity(index)}
                              className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-900 transition-colors"
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
                              className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-900 transition-colors"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Giá nhập */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-1">
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
                                costDiff > 0 ? 'text-red-800' : 'text-green-900'
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
                      <div className="bg-gray-100 rounded-xl p-3">
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
                          <span className="text-sm font-medium text-gray-900">
                            Nhập theo thùng 
                          </span>
                        </label>

                        {item.isBulk && (
                          <div className="grid grid-cols-2 gap-3 max-sm:gap-2 mt-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-900 mb-1">
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
                              <label className="block text-xs font-semibold text-gray-900 mb-1">
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
                            <div className="col-span-2 text-sm text-blue-950 bg-blue-50 px-3 py-2 rounded-lg">
                              → Giá mỗi {item.product.unit}:{' '}
                              <strong>{formatMoney(item.costPrice)}</strong>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Dòng 4: Hạn dùng (không bắt buộc) */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">
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
                      <div className="flex justify-end items-center pt-1 border-t border-gray-300 text-base">
                        <span className="text-gray-900 mr-2">Thành tiền:</span>
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
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-300 text-center">
              <PackagePlus className="w-16 h-16 text-gray-900 mx-auto mb-4 max-sm:mb-3" />
              <h3 className="text-xl max-sm:text-base font-bold text-gray-900 mb-2">Chưa có món hàng nào</h3>
              <p className="text-gray-900 text-base max-w-md mx-auto">
                Dùng ô tìm kiếm phía trên để chọn hàng cần nhập, hoặc bấm &quot;Tạo hàng mới&quot; nếu chưa có trong danh sách.
              </p>
            </div>
          )}
        </div>

        <aside className="hidden min-w-0 space-y-4 max-sm:space-y-3 lg:sticky lg:top-4 lg:block lg:self-start">
          {renderSelectedItems('desktop')}
          {renderPurchaseInformation('desktop')}
          {renderPurchaseSummary()}
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
        className={`fixed inset-x-0 bottom-0 z-[60] flex max-h-[90dvh] min-w-0 flex-col overflow-y-auto rounded-t-3xl bg-gray-100 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl transition-[transform,visibility] duration-300 lg:hidden ${
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
            <p className="rounded-xl border-2 border-red-300 bg-red-50 p-3 text-base text-red-800" role="alert">
              {formError}
            </p>
          )}
          {renderSelectedItems('mobile')}
          {renderPurchaseInformation('mobile')}
          {renderPurchaseSummary()}
        </div>
      </section>

      <div className="fixed inset-x-2 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 lg:hidden">
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex w-full items-center justify-between gap-2 rounded-xl bg-blue-800 px-3 py-1.5 text-left text-white shadow-xl"
          aria-label={`Xem phiếu nhập: ${cart.length} món, tổng ${formatMoney(totalAmount)}`}
          aria-expanded={isCartOpen}
        >
          <span className="min-w-0 whitespace-nowrap text-[13px] font-medium leading-none">
            Phiếu: {cart.length} món • {formatMoney(totalAmount)}
          </span>
          <span className="inline-flex items-center justify-center h-7 !min-h-0 px-3 py-0 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 leading-none bg-white text-blue-950">
            Xem phiếu
          </span>
        </button>
      </div>

      <PurchaseModals model={model} />
    </div>
  )
}
