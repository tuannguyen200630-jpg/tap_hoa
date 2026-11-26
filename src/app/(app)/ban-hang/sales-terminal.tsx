'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Plus, Printer, Trash2, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatMoney, formatMoneyInput, parseMoney } from '@/lib/money'
import {
  calculateCartSubtotal,
  parseQuantityInput,
} from '@/lib/sales'
import {
  createQuickCustomerAction,
  createSaleAction,
  type SaleCustomer,
  type SaleProduct,
} from './actions'
import { cn } from '@/lib/utils'
import { matchesSearch, normalizeText } from '@/lib/search'
import { useProgressiveList } from '@/lib/use-progressive-list'

type Category = {
  id: string
  name: string
}

type SaleDisplayProduct = Pick<
  SaleProduct,
  'id' | 'code' | 'name' | 'barcode' | 'category_id' | 'unit' | 'sell_price' | 'stock' | 'category'
> & {
  sold_quantity?: number
}

type CartLine = {
  product: SaleDisplayProduct
  quantityInput: string
  unitPrice: number
}

type SaleCart = {
  lines: CartLine[]
  paymentMethod: 'cash' | 'transfer' | 'debt'
  customerId: string
}

type ReceiptData = {
  code: string
  createdAt: string
  lines: Array<{
    name: string
    code: string
    unit: string
    quantity: number
    unitPrice: number
    subtotal: number
  }>
  subtotal: number
  total: number
  paymentMethod: 'cash' | 'transfer' | 'debt'
  customerName: string | null
}

const emptyCart = (): SaleCart => ({
  lines: [],
  paymentMethod: 'cash',
  customerId: '',
})

const paymentLabels = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  debt: 'Ghi nợ',
} as const

function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(quantity)
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function SalesTerminal({
  categories,
  initialProducts,
  favoriteProducts,
  initialCustomers,
  allowSellOut,
}: {
  categories: Category[]
  initialProducts: SaleDisplayProduct[]
  favoriteProducts: SaleProduct[]
  initialCustomers: SaleCustomer[]
  allowSellOut: boolean
}) {
  const router = useRouter()
  const [cart, setCart] = useState<SaleCart>(emptyCart)
  const [customers, setCustomers] = useState(initialCustomers)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchError, setSearchError] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false)
  const [quickCustomerName, setQuickCustomerName] = useState('')
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('')
  const [quickCustomerError, setQuickCustomerError] = useState('')
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const parsedLines = useMemo(() => cart.lines.map((line) => ({
    ...line,
    quantity: parseQuantityInput(line.quantityInput),
  })), [cart.lines])
  const subtotal = calculateCartSubtotal(parsedLines.map((line) => ({
    quantity: line.quantity ?? 0,
    unitPrice: line.unitPrice,
  })))
  const total = subtotal
  const hasInvalidQuantity = parsedLines.some((line) => line.quantity === null)
  const hasInvalidPrice = cart.lines.some(
    (line) => !Number.isSafeInteger(line.unitPrice) || line.unitPrice < 0 || line.unitPrice > 2_147_483_647
  )
  const exceedsStock = parsedLines.some(
    (line) => line.quantity !== null && line.quantity > Number(line.product.stock)
  )
  const overIntegerAmountLimit = !Number.isSafeInteger(subtotal) || subtotal > 2_147_483_647
  const selectedCustomer = customers.find((customer) => customer.id === cart.customerId) || null
  const filteredProducts = useMemo(() => initialProducts.filter((product) =>
    (selectedCategory === 'all' || product.category_id === selectedCategory) &&
    matchesSearch(search, product.name, product.code, product.barcode)
  ), [initialProducts, search, selectedCategory])
  const visibleFavorites = useMemo(() => favoriteProducts.filter((product) =>
    (selectedCategory === 'all' || product.category_id === selectedCategory) &&
    matchesSearch(search, product.name, product.code, product.barcode)
  ), [favoriteProducts, search, selectedCategory])
  const allProducts = useMemo(() => {
    const favoriteIds = new Set(visibleFavorites.map((product) => product.id))
    return filteredProducts.filter((product) => !favoriteIds.has(product.id))
  }, [filteredProducts, visibleFavorites])
  const resetKey = JSON.stringify([search, selectedCategory])
  const { sentinelRef, visibleCount } = useProgressiveList(allProducts.length, resetKey)
  const visibleProducts = allProducts.slice(0, visibleCount)

  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) searchInputRef.current?.focus()
  }, [])

  const updateCart = (update: (current: SaleCart) => SaleCart) => {
    setCart(update)
  }

  const addProduct = (product: SaleDisplayProduct) => {
    setCheckoutError('')
    if ('vibrate' in navigator) navigator.vibrate(25)
    updateCart((current) => {
      const existing = current.lines.find((line) => line.product.id === product.id)
      if (existing) {
        return {
          ...current,
          lines: current.lines.map((line) => line.product.id === product.id
            ? {
                ...line,
                quantityInput: String((parseQuantityInput(line.quantityInput) ?? 0) + 1),
              }
            : line
          ),
        }
      }
      return {
        ...current,
        lines: [...current.lines, { product, quantityInput: '1', unitPrice: product.sell_price }],
      }
    })
  }

  const handleSearchEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !search.trim()) return
    event.preventDefault()
    const term = normalizeText(search)
    const exactMatch = [...filteredProducts, ...visibleFavorites].find((product) =>
      normalizeText(product.code) === term ||
      normalizeText(product.barcode || '') === term
    )
    if (exactMatch) {
      addProduct(exactMatch)
      setSearch('')
    } else {
      setSearchError('Không tìm thấy món hàng có mã này.')
    }
  }

  const updateLineQuantity = (productId: string, quantityInput: string) => {
    setCheckoutError('')
    updateCart((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.product.id === productId ? { ...line, quantityInput } : line
      ),
    }))
  }

  const updateLinePrice = (productId: string, value: string) => {
    const price = parseMoney(value)
    updateCart((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.product.id === productId ? { ...line, unitPrice: Math.max(0, price) } : line
      ),
    }))
  }

  const removeLine = (productId: string) => {
    updateCart((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.product.id !== productId),
    }))
  }

  const addQuickCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setQuickCustomerError('')
    setIsCreatingCustomer(true)
    try {
      const result = await createQuickCustomerAction({
        name: quickCustomerName,
        phone: quickCustomerPhone || null,
      })
      if (result.error || !result.customer) {
        setQuickCustomerError(result.error || 'Không thêm được khách hàng. Vui lòng thử lại.')
        return
      }
      setCustomers((current) =>
        [...current, result.customer!].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      )
      updateCart((current) => ({ ...current, customerId: result.customer!.id }))
      setQuickCustomerName('')
      setQuickCustomerPhone('')
      setIsQuickCustomerOpen(false)
    } catch {
      setQuickCustomerError('Không thêm được khách hàng. Vui lòng thử lại.')
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  const completeSale = async () => {
    setCheckoutError('')
    if (cart.lines.length === 0) {
      setCheckoutError('Hãy chọn ít nhất một món hàng để bán.')
      return
    }
    if (hasInvalidQuantity || parsedLines.some((line) => !line.quantity || line.quantity <= 0)) {
      setCheckoutError('Vui lòng kiểm tra số lượng từng món hàng.')
      return
    }
    if (hasInvalidPrice) {
      setCheckoutError('Giá bán riêng phải là số đồng nguyên từ 0 đến 2.147.483.647.')
      return
    }
    if (overIntegerAmountLimit) {
      setCheckoutError('Tổng tiền vượt giới hạn cho phép. Hãy chia hóa đơn thành hai lần bán.')
      return
    }
    if (exceedsStock && !allowSellOut) {
      setCheckoutError('Cài đặt hiện không cho phép bán vượt số lượng còn trong kho.')
      return
    }
    if (cart.paymentMethod === 'debt' && !cart.customerId) {
      setCheckoutError('Vui lòng chọn hoặc thêm khách hàng khi ghi nợ.')
      return
    }
    const receiptLines = parsedLines.map((line) => {
      const quantity = line.quantity ?? 0
      return {
        name: line.product.name,
        code: line.product.code,
        unit: line.product.unit,
        quantity,
        unitPrice: line.unitPrice,
        subtotal: Math.round(quantity * line.unitPrice),
      }
    })

    setIsSubmitting(true)
    try {
      const result = await createSaleAction({
        customer_id: cart.customerId || null,
        discount_amount: 0,
        customer_paid: cart.paymentMethod === 'debt' ? 0 : total,
        payment_method: cart.paymentMethod,
        note: null,
        items: parsedLines.map((line) => ({
          product_id: line.product.id,
          quantity: line.quantity ?? 0,
          sell_price: line.unitPrice,
        })),
      })
      if (result.error || !result.sale) {
        setCheckoutError(result.error || 'Không hoàn tất được hóa đơn. Vui lòng thử lại.')
        return
      }

      setLastReceipt({
        code: result.sale.code,
        createdAt: new Date().toISOString(),
        lines: receiptLines,
        subtotal: result.sale.total_amount,
        total: result.sale.final_amount,
        paymentMethod: cart.paymentMethod,
        customerName: selectedCustomer?.name ?? null,
      })
      updateCart(() => emptyCart())
      router.refresh()
      setIsCartOpen(false)
    } catch {
      setCheckoutError('Không kết nối được để hoàn tất hóa đơn. Hãy kiểm tra trang Hóa đơn trước khi thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderProductGrid = (products: SaleDisplayProduct[]) => (
    <div className="grid min-w-0 max-w-full grid-cols-2 gap-2 sm:grid-cols-3">
      {products.map((product) => {
        const selectedLine = cart.lines.find((line) => line.product.id === product.id)
        const selectedQuantity = selectedLine
          ? parseQuantityInput(selectedLine.quantityInput) ?? 0
          : 0
        return (
          <button
            type="button"
            key={product.id}
            onClick={() => addProduct(product)}
            style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 130px' }}
            aria-pressed={selectedQuantity > 0}
            className={cn(
              'relative flex min-h-[104px] min-w-0 max-w-full flex-col items-start justify-between rounded-xl border-2 p-2.5 text-left transition duration-150 active:scale-[0.98] focus-visible:outline-blue-600',
              selectedQuantity > 0
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50'
            )}
            aria-label={`Thêm ${product.name}, giá ${formatMoney(product.sell_price)}`}
          >
            {selectedQuantity > 0 && (
              <span
                className="absolute right-2 top-2 inline-flex min-h-7 min-w-7 items-center justify-center rounded-full bg-blue-700 px-2 text-xs font-bold text-white"
                aria-label={`Đã chọn ${formatQuantity(selectedQuantity)} ${product.unit}`}
              >
                {formatQuantity(selectedQuantity)}
              </span>
            )}
            <span className={cn(
              'line-clamp-2 min-w-0 max-w-full text-sm font-semibold leading-tight text-gray-900',
              selectedQuantity > 0 && 'pr-10'
            )}>{product.name}</span>
            <span className="min-w-0 max-w-full whitespace-nowrap text-sm font-bold text-blue-700">{formatMoney(product.sell_price)}</span>
            <span className="w-full min-w-0 truncate whitespace-nowrap text-xs text-gray-600">
              Còn: {formatQuantity(Number(product.stock))} {product.unit}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      <div className="no-print min-w-0 max-w-full space-y-3 pb-40 md:space-y-4 md:pb-6">
        <header className="flex flex-col gap-3 max-sm:gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Bán hàng</h1>
          </div>
        </header>

        {lastReceipt && (
          <div className="flex flex-col gap-3 max-sm:gap-2 rounded-xl border-2 border-green-300 bg-green-50 p-4 max-sm:p-3 sm:flex-row sm:items-center sm:justify-between" role="status">
            <div className="flex items-start gap-3 max-sm:gap-2 text-green-900">
              <CheckCircle2 className="mt-1 h-6 w-6 shrink-0" />
              <div>
                <p className="text-lg max-sm:text-sm font-bold">Đã lưu hóa đơn {lastReceipt.code}</p>
                <p className="text-lg max-sm:text-sm">Có thể in biên lai hoặc tiếp tục bán hàng.</p>
              </div>
            </div>
            <Button onClick={() => window.print()} className="min-h-[48px] text-lg max-sm:text-sm">
              <Printer className="h-5 w-5" />
              In biên lai
            </Button>
          </div>
        )}

        <div className="grid min-w-0 max-w-full gap-5 max-sm:gap-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
          <section className="min-w-0 max-w-full space-y-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:space-y-4 sm:p-5" aria-label="Chọn hàng hóa">
            <label htmlFor="sale-search" className="block text-sm font-semibold text-gray-800 sm:text-base">
              Tìm món hàng
            </label>
            <div className="relative">
              <Input
                ref={searchInputRef}
                id="sale-search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setSearchError('')
                }}
                onKeyDown={handleSearchEnter}
                placeholder="Gõ tên hoặc mã hàng..."
                autoComplete="off"
                className="h-12 min-w-0 px-3 py-2 pr-10 text-sm"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Xóa nội dung tìm kiếm"
                  onClick={() => {
                    setSearch('')
                    setSearchError('')
                  }}
                  className="absolute right-1 top-1/2 flex min-h-[48px] min-w-[48px] -translate-y-1/2 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="min-w-0 max-w-full space-y-1">
              <label htmlFor="sale-category" className="block text-sm font-semibold text-gray-800 sm:text-base">
                Nhóm hàng
              </label>
              <select
                id="sale-category"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-12 min-h-[48px] w-full min-w-0 max-w-full rounded-xl border-2 border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 sm:text-base"
              >
                <option value="all">Tất cả nhóm</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {searchError && (
              <p className="rounded-lg bg-red-50 p-3 text-lg max-sm:text-sm text-red-800" role="alert">{searchError}</p>
            )}

            <div className="min-w-0 max-w-full space-y-5 max-sm:space-y-3">
              {visibleFavorites.length > 0 && (
                <section className="min-w-0 max-w-full space-y-3" aria-label="Món thường bán">
                  <h2 className="text-xl max-sm:text-base font-bold text-gray-900">Món thường bán</h2>
                  {renderProductGrid(visibleFavorites)}
                </section>
              )}

              <section className="min-w-0 max-w-full space-y-3" aria-label="Tất cả món hàng">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-gray-900 sm:text-lg">Tất cả món hàng</h2>
                  <span className="whitespace-nowrap text-xs text-gray-600 sm:text-sm">{allProducts.length} món</span>
                </div>
                {visibleProducts.length > 0 ? renderProductGrid(visibleProducts) : (
                  <div className="rounded-xl border-2 border-dashed border-gray-300 p-7 text-center">
                    <p className="text-lg max-sm:text-sm font-semibold text-gray-700">
                      {initialProducts.length === 0 ? 'Chưa có món hàng để hiển thị' : 'Không tìm thấy món hàng phù hợp'}
                    </p>
                    <p className="mt-1 text-lg max-sm:text-sm text-gray-600">
                      {search.trim() ? 'Thử từ khóa khác hoặc chọn nhóm hàng khác.' : 'Hãy thêm hàng hóa trong mục Hàng hóa trước.'}
                    </p>
                  </div>
                )}
                {visibleProducts.length > 0 && allProducts.length > visibleCount && (
                  <div ref={sentinelRef} className="min-h-10 text-center text-lg max-sm:text-sm text-gray-600" aria-live="polite">
                    Cuộn để xem thêm món hàng...
                  </div>
                )}
              </section>
            </div>
          </section>

          {isCartOpen && (
            <button
              type="button"
              aria-label="Đóng giỏ hàng"
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-[55] bg-black/50 md:hidden"
            />
          )}
          <section
            className={cn(
              'space-y-4 max-sm:space-y-3 rounded-2xl border border-gray-200 bg-white p-4 max-sm:p-3 shadow-sm sm:p-5',
              isCartOpen
                ? 'fixed inset-x-0 top-[env(safe-area-inset-top)] z-[60] flex max-h-[calc(100dvh-env(safe-area-inset-top))] flex-col overflow-y-auto rounded-t-3xl pb-[calc(1rem+env(safe-area-inset-bottom))] md:static md:block md:max-h-none md:overflow-visible md:rounded-2xl'
                : 'hidden md:block'
            )}
            aria-label="Giỏ hàng và thanh toán"
            role={isCartOpen ? 'dialog' : undefined}
            aria-modal={isCartOpen ? true : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Giỏ hàng</h2>
                <span className="text-sm text-gray-600">{cart.lines.length} món</span>
              </div>
              <button
                type="button"
                aria-label="Đóng giỏ hàng"
                onClick={() => setIsCartOpen(false)}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-gray-300 md:hidden"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {cart.lines.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 max-sm:p-3 text-center">
                <p className="text-lg max-sm:text-sm font-semibold text-gray-700">Giỏ hàng đang trống</p>
                <p className="mt-1 text-lg max-sm:text-sm text-gray-600">Chọn món hàng ở bên trái để thêm vào giỏ.</p>
              </div>
            ) : (
              <div className="max-h-[42vh] space-y-3 overflow-y-auto pr-1">
                {parsedLines.map((line) => {
                  const quantity = line.quantity ?? 0
                  const lineSubtotal = Math.round(quantity * line.unitPrice)
                  const isOverStock = quantity > Number(line.product.stock)
                  return (
                    <article key={line.product.id} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="break-words text-lg max-sm:text-sm font-semibold text-gray-900">{line.product.name}</h3>
                          <p className="text-lg max-sm:text-sm text-gray-600">{line.product.code} · Số lượng còn: {formatQuantity(Number(line.product.stock))} {line.product.unit}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(line.product.id)}
                          aria-label={`Bỏ ${line.product.name} khỏi giỏ`}
                          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      {isOverStock && (
                        <p className={`mt-2 flex items-start gap-2 rounded-lg p-2 text-lg max-sm:text-sm ${
                          allowSellOut ? 'bg-amber-50 text-amber-900' : 'bg-red-50 text-red-800'
                        }`} role="status">
                          <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
                          {allowSellOut
                            ? 'Số lượng bán vượt số lượng còn trong kho. Cài đặt hiện cho phép tiếp tục bán.'
                            : 'Số lượng còn không đủ; cài đặt hiện không cho phép bán vượt.'}
                        </p>
                      )}

                      <div className="mt-3 grid grid-cols-2 gap-3 max-sm:gap-2">
                        <label className="text-lg max-sm:text-sm font-medium text-gray-700">
                          Số lượng ({line.product.unit})
                          <div className="mt-1 flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Giảm ${line.product.name}`}
                              onClick={() => {
                                if (quantity <= 1) removeLine(line.product.id)
                                else updateLineQuantity(line.product.id, String(quantity - 1))
                              }}
                              className="min-h-[48px] min-w-[48px] rounded-lg border border-gray-300 text-2xl max-sm:text-lg font-bold hover:bg-gray-100"
                            >
                              −
                            </button>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={line.quantityInput}
                              onChange={(event) => updateLineQuantity(line.product.id, event.target.value)}
                              aria-label={`Số lượng ${line.product.name}`}
                              className="min-w-0 px-2 text-center text-lg max-sm:text-sm font-bold"
                            />
                            <button
                              type="button"
                              aria-label={`Tăng ${line.product.name}`}
                              onClick={() => updateLineQuantity(line.product.id, String(quantity + 1))}
                              className="min-h-[48px] min-w-[48px] rounded-lg border border-gray-300 text-2xl max-sm:text-lg font-bold hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                        </label>
                        <label className="text-lg max-sm:text-sm font-medium text-gray-700">
                          Giá bán riêng (đ)
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={formatMoneyInput(line.unitPrice)}
                            onChange={(event) => updateLinePrice(line.product.id, event.target.value)}
                            aria-label={`Giá bán riêng ${line.product.name}`}
                            className="mt-1 text-lg max-sm:text-sm font-bold"
                          />
                        </label>
                      </div>
                      <div className="mt-2 flex justify-between text-lg max-sm:text-sm">
                        <span className="text-gray-600">Thành tiền</span>
                        <strong>{formatMoney(lineSubtotal)}</strong>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            <div className="space-y-3 border-t border-gray-200 pt-4 max-sm:pt-3">
              <div className="rounded-xl bg-blue-50 p-4 max-sm:p-3 text-right">
                <p className="text-lg max-sm:text-sm font-semibold text-blue-900">Tổng tiền (Khách cần trả)</p>
                <p className="whitespace-nowrap text-base font-bold leading-tight text-blue-900 sm:text-2xl">{formatMoney(total)}</p>
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-lg max-sm:text-sm font-semibold text-gray-800">Hình thức thanh toán</legend>
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'transfer', 'debt'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => updateCart((current) => ({
                      ...current,
                      paymentMethod: method,
                    }))}
                    aria-pressed={cart.paymentMethod === method}
                    className={`min-h-[52px] rounded-xl border-2 px-2 text-lg max-sm:text-sm font-semibold ${
                      cart.paymentMethod === method
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    {paymentLabels[method]}
                  </button>
                ))}
              </div>
            </fieldset>

            {cart.paymentMethod === 'debt' && (
              <div className="space-y-2 rounded-xl border-2 border-amber-200 bg-amber-50 p-3">
                <label htmlFor="sale-customer" className="block text-lg max-sm:text-sm font-semibold text-gray-800">Khách ghi nợ</label>
                <div className="flex gap-2">
                  <select
                    id="sale-customer"
                    value={cart.customerId}
                    onChange={(event) => updateCart((current) => ({ ...current, customerId: event.target.value }))}
                    className="min-h-[48px] min-w-0 flex-1 rounded-lg border-2 border-gray-300 bg-white px-3 text-lg max-sm:text-sm"
                    required
                  >
                    <option value="">Chọn khách hàng</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` · ${customer.phone}` : ''}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setQuickCustomerError('')
                      setIsQuickCustomerOpen(true)
                    }}
                    className="min-h-[48px] shrink-0 px-3 text-lg max-sm:text-sm"
                  >
                    <Plus className="h-5 w-5" />
                    Thêm
                  </Button>
                </div>
                {selectedCustomer && (
                  <p className="text-lg max-sm:text-sm text-amber-900">Khách hiện đang nợ: {formatMoney(selectedCustomer.debt)}</p>
                )}
              </div>
            )}

            {exceedsStock && allowSellOut && (
              <div className="flex gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-lg max-sm:text-sm text-amber-950" role="status">
                <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
                Số lượng bán vượt số lượng còn trong kho. Cửa hàng đã cho phép tiếp tục bán theo cài đặt.
              </div>
            )}

            {checkoutError && (
              <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-lg max-sm:text-sm text-red-800" role="alert">
                {checkoutError}
              </p>
            )}
            {overIntegerAmountLimit && (
              <p className="rounded-lg bg-red-50 p-3 text-lg max-sm:text-sm text-red-800" role="alert">
                Tổng tiền vượt giới hạn cho phép. Hãy chia hóa đơn thành hai lần bán.
              </p>
            )}
            {hasInvalidPrice && (
              <p className="rounded-lg bg-red-50 p-3 text-lg max-sm:text-sm text-red-800" role="alert">
                Giá bán riêng vượt giới hạn cho phép. Hãy nhập số đồng nguyên không quá 2.147.483.647.
              </p>
            )}

            <Button
              type="button"
              size="lg"
              onClick={completeSale}
              disabled={
                isSubmitting ||
                cart.lines.length === 0 ||
                hasInvalidQuantity ||
                hasInvalidPrice ||
                overIntegerAmountLimit ||
                (exceedsStock && !allowSellOut)
              }
              className="sticky bottom-0 z-10 min-h-[60px] w-full shrink-0 bg-blue-700 text-xl max-sm:text-base font-bold shadow-lg"
            >
              {isSubmitting ? 'Đang lưu hóa đơn...' : `Hoàn tất bán · ${formatMoney(total)}`}
            </Button>
          </section>
        </div>

        <div className="no-print fixed inset-x-2 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 md:hidden">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex w-full items-center justify-between gap-2 rounded-xl bg-blue-700 px-3 py-1.5 text-left text-white shadow-xl"
            aria-label={`Xem giỏ hàng: ${cart.lines.length} món, tổng ${formatMoney(total)}`}
          >
            <span className="min-w-0 whitespace-nowrap text-[13px] font-medium leading-none">
              Giỏ: {cart.lines.length} món • {formatMoney(total)}
            </span>
            <span className="inline-flex items-center justify-center h-7 !min-h-0 px-3 py-0 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 leading-none bg-white text-blue-800">
              Xem giỏ
            </span>
          </button>
        </div>
      </div>

      {lastReceipt && (
        <article className="receipt-print mx-auto w-full max-w-[80mm] bg-white p-3 text-black">
          <header className="mb-3 border-b border-dashed border-black pb-2 text-center">
            <h1 className="text-xl max-sm:text-base font-bold">HÓA ĐƠN BÁN HÀNG</h1>
            <p className="text-lg max-sm:text-sm font-semibold">{lastReceipt.code}</p>
            <p className="text-lg max-sm:text-sm">{formatDateTime(lastReceipt.createdAt)}</p>
            {lastReceipt.customerName && <p className="text-lg max-sm:text-sm">Khách hàng: {lastReceipt.customerName}</p>}
          </header>
          <div className="space-y-2">
            {lastReceipt.lines.map((line, index) => (
              <div key={`${line.code}-${index}`} className="border-b border-dotted border-gray-500 pb-1">
                <p className="text-lg max-sm:text-sm font-semibold">{line.name}</p>
                <div className="flex justify-between gap-2 text-lg max-sm:text-sm">
                  <span>{formatQuantity(line.quantity)} {line.unit} × {formatMoney(line.unitPrice)}</span>
                  <span>{formatMoney(line.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-b border-dashed border-black pb-3 text-lg max-sm:text-sm">
            <div className="flex justify-between text-xl max-sm:text-base font-bold"><span>Khách cần trả</span><span>{formatMoney(lastReceipt.total)}</span></div>
            <div className="flex justify-between"><span>Thanh toán</span><span>{paymentLabels[lastReceipt.paymentMethod]}</span></div>
            {lastReceipt.paymentMethod === 'debt' && (
              <div className="flex justify-between"><span>Khách còn nợ</span><span>{formatMoney(lastReceipt.total)}</span></div>
            )}
          </div>
          <p className="mt-3 text-center text-lg max-sm:text-sm">Cảm ơn quý khách và hẹn gặp lại!</p>
        </article>
      )}

      {isQuickCustomerOpen && (
        <div className="no-print fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 max-sm:p-3">
          <form onSubmit={addQuickCustomer} className="w-full max-w-md space-y-4 max-sm:space-y-3 rounded-2xl bg-white p-5 max-sm:p-3 shadow-xl">
            <div className="flex items-center justify-between gap-3 max-sm:gap-2">
              <h2 className="text-2xl max-sm:text-lg font-bold">Thêm khách hàng nhanh</h2>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setIsQuickCustomerOpen(false)}
                className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <label className="block text-lg max-sm:text-sm font-semibold">
              Tên khách hàng *
              <Input
                value={quickCustomerName}
                onChange={(event) => setQuickCustomerName(event.target.value)}
                maxLength={120}
                required
                autoFocus
                className="mt-1"
              />
            </label>
            <label className="block text-lg max-sm:text-sm font-semibold">
              Số điện thoại (không bắt buộc)
              <Input
                value={quickCustomerPhone}
                onChange={(event) => setQuickCustomerPhone(event.target.value)}
                maxLength={30}
                inputMode="tel"
                className="mt-1"
              />
            </label>
            {quickCustomerError && (
              <p className="rounded-lg bg-red-50 p-3 text-lg max-sm:text-sm text-red-800" role="alert">{quickCustomerError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsQuickCustomerOpen(false)} className="min-h-[48px] text-lg max-sm:text-sm">
                Không
              </Button>
              <Button type="submit" disabled={isCreatingCustomer} className="min-h-[48px] text-lg max-sm:text-sm">
                <UserRound className="h-5 w-5" />
                {isCreatingCustomer ? 'Đang lưu...' : 'Lưu khách hàng'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
