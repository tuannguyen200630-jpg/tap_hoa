'use client'

import { useEffect, useMemo, useState } from 'react'
import type { RefObject } from 'react'
import { useRouter } from 'next/navigation'
import { createQuickCustomerAction, createSaleAction, type SaleCustomer, type SaleProduct } from './actions'
import { parseMoney } from '@/lib/money'
import { calculateCartSubtotal, parseQuantityInput } from '@/lib/sales'
import { matchesSearch, normalizeText } from '@/lib/search'
import { useProgressiveList } from '@/lib/use-progressive-list'

export type Category = {
  id: string
  name: string
}

export type SaleDisplayProduct = Pick<
  SaleProduct,
  'id' | 'code' | 'name' | 'barcode' | 'category_id' | 'unit' | 'sell_price' | 'stock' | 'category'
> & {
  sold_quantity?: number
}

export type CartLine = {
  product: SaleDisplayProduct
  quantityInput: string
  unitPrice: number
}

export type SaleCart = {
  lines: CartLine[]
  paymentMethod: 'cash' | 'transfer' | 'debt'
  customerId: string
}

export type ReceiptData = {
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

export function useSalesTerminal({
  categories,
  initialProducts,
  favoriteProducts,
  initialCustomers,
  allowSellOut,
  searchInputRef,
  sentinelRef,
}: {
  categories: Category[]
  initialProducts: SaleDisplayProduct[]
  favoriteProducts: SaleProduct[]
  initialCustomers: SaleCustomer[]
  allowSellOut: boolean
  searchInputRef: RefObject<HTMLInputElement | null>
  sentinelRef: RefObject<HTMLDivElement | null>
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
  const { visibleCount } = useProgressiveList(allProducts.length, resetKey, sentinelRef)
  const visibleProducts = allProducts.slice(0, visibleCount)

  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) searchInputRef.current?.focus()
  }, [searchInputRef])

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

  return {
    categories,
    initialProducts,
    favoriteProducts,
    initialCustomers,
    allowSellOut,
    cart,
    setCart,
    customers,
    setCustomers,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    searchError,
    setSearchError,
    checkoutError,
    setCheckoutError,
    isSubmitting,
    setIsSubmitting,
    lastReceipt,
    setLastReceipt,
    isCartOpen,
    setIsCartOpen,
    isQuickCustomerOpen,
    setIsQuickCustomerOpen,
    quickCustomerName,
    setQuickCustomerName,
    quickCustomerPhone,
    setQuickCustomerPhone,
    quickCustomerError,
    setQuickCustomerError,
    isCreatingCustomer,
    parsedLines,
    subtotal,
    total,
    hasInvalidQuantity,
    hasInvalidPrice,
    exceedsStock,
    overIntegerAmountLimit,
    selectedCustomer,
    filteredProducts,
    visibleFavorites,
    allProducts,
    resetKey,
    visibleProducts,
    visibleCount,
    updateCart,
    addProduct,
    handleSearchEnter,
    updateLineQuantity,
    updateLinePrice,
    removeLine,
    addQuickCustomer,
    completeSale,
  }
}
