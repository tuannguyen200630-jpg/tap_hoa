'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import type { RefObject } from 'react'
import type * as React from 'react'
import { matchesSearch } from '@/lib/search'
import { useProgressiveList } from '@/lib/use-progressive-list'
import {
  createPurchaseAction,
  confirmPriceChangeAction,
  quickCreateProductAction,
  type PurchaseProduct,
  type PriceChangeItem,
  type Supplier,
} from './actions'
import { getCategories } from '@/app/(app)/hang-hoa/actions'

export type CartItem = {
  product: PurchaseProduct
  quantity: number
  costPrice: number
  expiryDate: string
  // Nhập theo thùng
  isBulk: boolean
  bulkPrice: number      // giá cả thùng
  bulkPriceEdited: boolean
  unitsPerBulk: number   // số cái trong thùng
}

export type Category = {
  id: string
  code: string
  name: string
  description: string | null
}

export interface PurchaseFormProps {
  products: PurchaseProduct[]
  suppliers: Supplier[]
  categories: Category[]
}

// ————————————————————————————————————
// Component
// ————————————————————————————————————

export type PurchaseFormHookRefs = {
  allProductsSentinelRef: RefObject<HTMLDivElement | null>
  lowStockSentinelRef: RefObject<HTMLDivElement | null>
}

export function usePurchaseForm({
  products: initialProducts,
  suppliers: initialSuppliers,
  categories: initialCategories,
  allProductsSentinelRef,
  lowStockSentinelRef,
}: PurchaseFormProps & PurchaseFormHookRefs) {
  // State
  const [products, setProducts] = useState<PurchaseProduct[]>(initialProducts)
  const [suppliers] = useState<Supplier[]>(initialSuppliers)
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [note, setNote] = useState('')
  const [payFull, setPayFull] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [feedback, setFeedback] = useState('')
  const [expandedCartItems, setExpandedCartItems] = useState<Record<string, boolean>>({})
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Modals
  const [priceChanges, setPriceChanges] = useState<PriceChangeItem[]>([])
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [lossConfirmations, setLossConfirmations] = useState<Record<string, boolean>>({})
  const [successInfo, setSuccessInfo] = useState<{ code: string; total: number; debt: number } | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  // Quick add product form
  const [qaName, setQaName] = useState('')
  const [qaCategory, setQaCategory] = useState('')
  const [qaUnit, setQaUnit] = useState('cái')
  const [qaCost, setQaCost] = useState<number>(0)
  const [qaSell, setQaSell] = useState<number>(0)
  const [qaError, setQaError] = useState('')
  const [categories, setCategories] = useState<Category[]>(initialCategories)

  const [formError, setFormError] = useState('')
  const [isPending, startTransition] = useTransition()

  // Tính tổng tiền
  const getPurchaseQuantity = (item: CartItem) =>
    item.isBulk ? item.quantity * item.unitsPerBulk : item.quantity
  const totalAmount = cart.reduce((sum, item) => sum + Math.round(item.costPrice * getPurchaseQuantity(item)), 0)
  // Khi trả ngay thì paid = total; khi ghi nợ dùng giá trị nhập tay
  const debtAmount = payFull ? 0 : Math.max(0, totalAmount - paidAmount)

  // ————————————————————————————————————
  // Tìm kiếm hàng hóa
  // ————————————————————————————————————
  const filteredProducts = useMemo(() => {
    return [...products]
      .filter((product) => selectedCategory === 'all' ||
        product.category?.id === selectedCategory)
      .filter((product) => matchesSearch(search, product.name, product.code, product.barcode))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  }, [products, search, selectedCategory])

  const lowStockProducts = useMemo(() => {
    return filteredProducts
      .filter((product) => {
        const stock = Number(product.stock)
        return stock <= Number(product.min_stock) || stock <= 5
      })
      .sort((a, b) => Number(a.stock) - Number(b.stock))
  }, [filteredProducts])

  const filterKey = JSON.stringify([search, selectedCategory])
  const { visibleCount: allProductsVisibleCount } = useProgressiveList(filteredProducts.length, filterKey, allProductsSentinelRef)
  const { visibleCount: lowStockVisibleCount } = useProgressiveList(lowStockProducts.length, filterKey, lowStockSentinelRef)
  const visibleProducts = filteredProducts.slice(0, allProductsVisibleCount)
  const visibleLowStockProducts = lowStockProducts.slice(0, lowStockVisibleCount)

  // ————————————————————————————————————
  // Thêm hàng vào phiếu nhập
  // ————————————————————————————————————
  const addToCart = useCallback(
    (product: PurchaseProduct) => {
      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => item.product.id === product.id)
        if (existingIndex >= 0) {
          return prev.map((item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  quantity: item.isBulk
                    ? Math.floor(item.quantity + 1)
                    : Math.round((item.quantity + 1) * 1000) / 1000,
                }
              : item
          )
        }
        return [
          ...prev,
          {
            product,
            quantity: 1,
            costPrice: product.last_cost,
            expiryDate: '',
            isBulk: false,
            bulkPrice: 0,
            bulkPriceEdited: false,
            unitsPerBulk: 1,
          },
        ]
      })
      setFeedback(`Đã thêm ${product.name}`)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(30)
      }
    },
    []
  )

  // ————————————————————————————————————
  // Cập nhật dòng trong cart
  // ————————————————————————————————————
  const updateCartItem = (index: number, updates: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, ...updates }
        // Nếu chuyển sang nhập theo thùng, tự tính giá/đơn vị
        if (updated.isBulk && updated.unitsPerBulk > 0) {
          updated.costPrice = Math.round(updated.bulkPrice / updated.unitsPerBulk)
        }
        return updated
      })
    )
  }

  const roundQuantity = (quantity: number) =>
    Math.round(quantity * 1000) / 1000

  const decreaseCartQuantity = (index: number) => {
    setCart((prev) => {
      const item = prev[index]
      if (!item) return prev

      if (item.quantity <= 1) {
        return prev.filter((_, itemIndex) => itemIndex !== index)
      }

      return prev.map((cartItem, itemIndex) =>
        itemIndex === index
          ? {
              ...cartItem,
              quantity: cartItem.isBulk
                ? Math.max(1, Math.floor(cartItem.quantity - 1))
                : roundQuantity(cartItem.quantity - 1),
            }
          : cartItem
      )
    })
  }

  const increaseCartQuantity = (index: number) => {
    setCart((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item
        return {
          ...item,
          quantity: item.isBulk
            ? Math.floor(item.quantity + 1)
            : roundQuantity(item.quantity + 1),
        }
      })
    )
  }

  const handleQuantityBlur = (index: number, rawValue: string) => {
    if (rawValue.trim() === '') {
      updateCartItem(index, { quantity: 1 })
      return
    }

    const quantity = Number(rawValue)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      removeFromCart(index)
      return
    }

    updateCartItem(index, {
      quantity: cart[index]?.isBulk
        ? Math.max(1, Math.floor(quantity))
        : roundQuantity(quantity),
    })
  }

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  // ————————————————————————————————————
  // Gửi phiếu nhập
  // ————————————————————————————————————
  const handleSubmit = () => {
    setFormError('')
    if (cart.length === 0) {
      setFormError('Chưa có món hàng nào trong phiếu nhập')
      return
    }

    for (const item of cart) {
      if (item.quantity <= 0 || (item.isBulk && (!Number.isInteger(item.quantity) || !Number.isInteger(item.unitsPerBulk)))) {
        setFormError(`Số lượng của "${item.product.name}" phải lớn hơn 0`)
        return
      }
      if (!Number.isSafeInteger(item.costPrice) || item.costPrice < 0) {
        setFormError(`Giá nhập của "${item.product.name}" không hợp lệ`)
        return
      }
    }

    startTransition(async () => {
      const res = await createPurchaseAction({
        supplier_id: selectedSupplier || null,
        paid_amount: payFull ? totalAmount : paidAmount,
        note: note.trim() || null,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: getPurchaseQuantity(item),
          cost_price: item.costPrice,
          expiry_date: item.expiryDate || null,
        })),
      })

      if (res.error) {
        setFormError(res.error)
        return
      }

      // Lưu thành công
      if (res.price_changes && res.price_changes.length > 0) {
        // Có hàng auto cần xác nhận đổi giá
        setPriceChanges(res.price_changes)
        setShowPriceModal(true)
      }

      setSuccessInfo({
        code: res.code || '',
        total: res.total_amount || 0,
        debt: res.debt_amount || 0,
      })

      // Reset form
      setCart([])
      setIsCartOpen(false)
      setSelectedSupplier('')
      setPaidAmount(0)
      setNote('')
      setPayFull(true)
      setFormError('')
    })
  }

  // ————————————————————————————————————
  // Xử lý xác nhận đổi giá từng sản phẩm
  // ————————————————————————————————————
  const [priceConfirmValues, setPriceConfirmValues] = useState<Record<string, number>>({})

  // Khi priceChanges thay đổi, khởi tạo giá đề xuất cho mỗi product chưa có
  const handleConfirmPrice = async (pc: PriceChangeItem, confirmedPrice: number) => {
    const isAccepted = confirmedPrice === pc.suggested_price

    startTransition(async () => {
      const res = await confirmPriceChangeAction(
        pc.product_id,
        confirmedPrice,
        pc.new_cost,
        pc.old_cost,
        isAccepted
      )

      if (res.error) {
        setFormError(res.error)
        return
      }

      // Xóa item đã xử lý xong
      setPriceChanges((prev) => prev.filter((p) => p.product_id !== pc.product_id))
      setLossConfirmations((prev) => {
        const next = { ...prev }
        delete next[pc.product_id]
        return next
      })
    })
  }

  const handleKeepOldPrice = (pc: PriceChangeItem) => {
    // Giữ giá cũ = chọn giá bán hiện tại (old_price)
    handleConfirmPrice(pc, pc.old_price)
  }

  // ————————————————————————————————————
  // Quick add product
  // ————————————————————————————————————
  const openQuickAdd = async () => {
    setQaName('')
    setQaUnit('cái')
    setQaCost(0)
    setQaSell(0)
    setQaError('')
    setShowQuickAdd(true)
    // Load categories nếu chưa
    if (categories.length === 0) {
      const cats = await getCategories()
      setCategories(cats as Category[])
      if (cats.length > 0 && cats[0]) {
        setQaCategory(cats[0].id)
      }
    }
  }

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setQaError('')
    if (!qaName.trim()) {
      setQaError('Vui lòng nhập tên món hàng')
      return
    }
    if (!qaCategory) {
      setQaError('Vui lòng chọn nhóm hàng')
      return
    }

    startTransition(async () => {
      const res = await quickCreateProductAction({
        name: qaName,
        categoryId: qaCategory,
        unit: qaUnit,
        costPrice: qaCost,
        sellPrice: qaSell,
      })

      if (res.error) {
        setQaError(res.error)
        return
      }

      if (res.product) {
        const quickProduct = {
          ...res.product,
          barcode: res.product.barcode ?? null,
          category: categories.find((category) => category.id === qaCategory)
            ? { id: qaCategory, name: categories.find((category) => category.id === qaCategory)!.name }
            : null,
        }
        setProducts((prev) => [...prev, quickProduct])
        addToCart(quickProduct)
        setShowQuickAdd(false)
      }
    })
  }

  // ————————————————————————————————————
  // RENDER
  // ————————————————————————————————————

  return {
    products,
    setProducts,
    suppliers,
    cart,
    setCart,
    search,
    setSearch,
    selectedSupplier,
    setSelectedSupplier,
    paidAmount,
    setPaidAmount,
    note,
    setNote,
    payFull,
    setPayFull,
    selectedCategory,
    setSelectedCategory,
    feedback,
    setFeedback,
    expandedCartItems,
    setExpandedCartItems,
    isCartOpen,
    setIsCartOpen,
    priceChanges,
    setPriceChanges,
    showPriceModal,
    setShowPriceModal,
    lossConfirmations,
    setLossConfirmations,
    successInfo,
    setSuccessInfo,
    showQuickAdd,
    setShowQuickAdd,
    qaName,
    setQaName,
    qaCategory,
    setQaCategory,
    qaUnit,
    setQaUnit,
    qaCost,
    setQaCost,
    qaSell,
    setQaSell,
    qaError,
    setQaError,
    categories,
    setCategories,
    formError,
    setFormError,
    isPending,
    startTransition,
    getPurchaseQuantity,
    totalAmount,
    debtAmount,
    filteredProducts,
    lowStockProducts,
    filterKey,
    allProductsVisibleCount,
    lowStockVisibleCount,
    visibleProducts,
    visibleLowStockProducts,
    addToCart,
    updateCartItem,
    roundQuantity,
    decreaseCartQuantity,
    increaseCartQuantity,
    handleQuantityBlur,
    removeFromCart,
    handleSubmit,
    priceConfirmValues,
    setPriceConfirmValues,
    handleConfirmPrice,
    handleKeepOldPrice,
    openQuickAdd,
    handleQuickAddSubmit,
  }
}
