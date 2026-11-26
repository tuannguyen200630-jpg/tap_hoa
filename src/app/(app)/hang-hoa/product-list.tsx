'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type PointerEvent, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatMoney, parseMoney, formatMoneyInput } from '@/lib/money'
import { formatDate } from '@/lib/codes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createProductAction,
  updateProductAction,
  toggleProductActiveAction,
  createCategoryAction,
  updateCategoryAction,
  getNextProductCode,
  getProductDetailsAction,
  getProductPriceHistoryAction,
  getProductStockHistoryAction,
  getAllProducts,
} from './actions'
import {
  Plus,
  Package,
  AlertTriangle,
  Edit,
  X,
  TrendingUp,
  FolderPlus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { matchesSearch } from '@/lib/search'
import { useProgressiveList } from '@/lib/use-progressive-list'

const QUICK_UNITS = ['cái', 'lon', 'chai', 'gói', 'hộp', 'kg', 'vỉ', 'túi']

export type Category = {
  id: string
  code: string
  name: string
  description: string | null
}

export type Product = {
  id: string
  code: string
  name: string
  barcode: string | null
  category_id: string | null
  unit: string
  price_mode: 'auto' | 'fixed'
  base_cost: number
  base_price: number
  last_cost: number
  sell_price: number
  avg_cost: number
  stock: number
  min_stock: number
  expiry_date: string | null
  image_url: string | null
  is_active: boolean
  category: { id: string; name: string; code: string } | null
}

interface ProductListProps {
  initialProducts: Product[]
  categories: Category[]
  units: string[]
  defaultMinStock: number
}

interface HistoryModalFrameProps {
  title: string
  productName: string
  isLoading: boolean
  error: string
  onClose: () => void
  children: ReactNode
}

function HistoryModalFrame({
  title,
  productName,
  isLoading,
  error,
  onClose,
  children,
}: HistoryModalFrameProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4 max-sm:p-3 backdrop-blur-xs"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="my-8 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gray-800 p-5 max-sm:p-3 text-white">
          <div>
            <h2 className="text-xl max-sm:text-base font-bold sm:text-2xl">{title}</h2>
            <p className="mt-0.5 text-lg max-sm:text-sm text-gray-300">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 hover:text-white"
            aria-label="Quay lại chi tiết hàng hóa"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-5 max-sm:space-y-3 overflow-y-auto p-5 max-sm:p-3 sm:p-6">
          {isLoading && <div className="text-center text-lg max-sm:text-sm text-gray-600" role="status">Đang tải lịch sử...</div>}
          {error && <div className="rounded-lg bg-red-50 p-4 max-sm:p-3 text-lg max-sm:text-sm text-red-800" role="alert">{error}</div>}
          {children}
        </div>

        <div className="flex justify-end border-t border-gray-100 bg-gray-50 p-4 max-sm:p-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onClose}
            className="min-h-[48px] rounded-xl px-6 max-sm:px-3 text-base sm:text-lg"
          >
            Quay lại chi tiết
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ProductList({
  initialProducts,
  categories: initialCategories,
  units: initialUnits,
  defaultMinStock,
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [units, setUnits] = useState<string[]>(initialUnits)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [filterType, setFilterType] = useState<'all' | 'low_stock' | 'near_expiry' | 'inactive'>('all')
  const [priceModeFilter, setPriceModeFilter] = useState<'all' | 'auto' | 'fixed'>('all')
  const [sortBy, setSortBy] = useState<'name_asc' | 'stock_asc' | 'stock_desc' | 'profit_desc' | 'sell_asc' | 'sell_desc'>('name_asc')
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [listRevision, setListRevision] = useState(0)
  const [listError, setListError] = useState('')
  const codeRequestNumber = useRef(0)

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false)
  const [isStockHistoryOpen, setIsStockHistoryOpen] = useState(false)
  const [isNewCatOpen, setIsNewCatOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [isConfirmHideOpen, setIsConfirmHideOpen] = useState(false)
  const [returnToDetailProductId, setReturnToDetailProductId] = useState<string | null>(null)
  const longPressTimer = useRef<number | null>(null)
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null)
  const detailRequestNumber = useRef(0)
  const priceHistoryRequestNumber = useRef(0)
  const stockHistoryRequestNumber = useRef(0)
  const childModalCloseHandler = useRef<(() => void) | null>(null)

  // Current editing / inspecting product
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [priceHistory, setPriceHistory] = useState<Awaited<ReturnType<typeof getProductPriceHistoryAction>> | null>(null)
  const [stockHistory, setStockHistory] = useState<Awaited<ReturnType<typeof getProductStockHistoryAction>> | null>(null)
  const [priceHistoryError, setPriceHistoryError] = useState('')
  const [stockHistoryError, setStockHistoryError] = useState('')
  const [isPriceHistoryLoading, setIsPriceHistoryLoading] = useState(false)
  const [isStockHistoryLoading, setIsStockHistoryLoading] = useState(false)

  // Form states
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formCodePreview, setFormCodePreview] = useState('')
  const [formUnit, setFormUnit] = useState('cái')
  const [formCostPrice, setFormCostPrice] = useState<number>(0)
  const [formSellPrice, setFormSellPrice] = useState<number>(0)
  const [formStock, setFormStock] = useState<number>(0)
  const [formMinStock, setFormMinStock] = useState<number>(defaultMinStock)
  const [formPriceMode, setFormPriceMode] = useState<'auto' | 'fixed'>('auto')
  const [formBarcode, setFormBarcode] = useState('')
  const [formExpiryDate, setFormExpiryDate] = useState('')
  const [formImageFile, setFormImageFile] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const addModalBodyRef = useRef<HTMLDivElement>(null)

  // New category form
  const [newCatName, setNewCatName] = useState('')
  const [newCatError, setNewCatError] = useState('')
  const [detailError, setDetailError] = useState('')
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const [isPending, startTransition] = useTransition()

  // Calculate profit
  const profitPerItem = formSellPrice - formCostPrice
  useEffect(() => {
    if (isAddOpen && addModalBodyRef.current) {
      addModalBodyRef.current.scrollTop = 0
    }
  }, [isAddOpen])

  useEffect(() => {
    if (listRevision === 0) return
    let isCurrent = true
    startTransition(async () => {
      try {
        const result = await getAllProducts()
        if (!isCurrent) return
        setProducts(result.products)
        setListError('')
      } catch {
        if (isCurrent) setListError('Không tải được danh sách hàng hóa. Vui lòng thử lại.')
      }
    })
    return () => {
      isCurrent = false
    }
  }, [listRevision])

  const filteredProducts = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
    const expiryLimit = new Date(`${today}T12:00:00+07:00`)
    expiryLimit.setDate(expiryLimit.getDate() + 30)
    const maxExpiryDate = expiryLimit.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })

    return products
      .filter((product) => {
        if (filterType === 'inactive') return !product.is_active
        if (!product.is_active) return false
        if (filterType === 'low_stock' && Number(product.stock) > Number(product.min_stock)) return false
        if (filterType === 'near_expiry') {
          if (!product.expiry_date || product.expiry_date < today || product.expiry_date > maxExpiryDate) return false
        }
        return true
      })
      .filter((product) => selectedCategory === 'all' || product.category_id === selectedCategory)
      .filter((product) => priceModeFilter === 'all' || product.price_mode === priceModeFilter)
      .filter((product) => matchesSearch(search, product.name, product.code, product.barcode))
      .sort((a, b) => {
        switch (sortBy) {
          case 'stock_asc':
            return Number(a.stock) - Number(b.stock)
          case 'stock_desc':
            return Number(b.stock) - Number(a.stock)
          case 'profit_desc':
            return (b.sell_price - b.last_cost) - (a.sell_price - a.last_cost)
          case 'sell_asc':
            return a.sell_price - b.sell_price
          case 'sell_desc':
            return b.sell_price - a.sell_price
          case 'name_asc':
          default:
            return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
        }
      })
  }, [products, filterType, selectedCategory, priceModeFilter, search, sortBy])

  const totalCount = filteredProducts.length
  const resetKey = JSON.stringify([search, selectedCategory, filterType, priceModeFilter, sortBy])
  const { sentinelRef, visibleCount } = useProgressiveList(totalCount, resetKey)
  const visibleProducts = filteredProducts.slice(0, visibleCount)

  const refreshProductList = () => setListRevision((revision) => revision + 1)

  const activeFilterCount = [
    selectedCategory !== 'all',
    filterType !== 'all',
    priceModeFilter !== 'all',
    sortBy !== 'name_asc',
  ].filter(Boolean).length

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('all')
    setFilterType('all')
    setPriceModeFilter('all')
    setSortBy('name_asc')
  }

  const loadCodePreview = async (categoryId: string) => {
    const request = ++codeRequestNumber.current
    setFormCodePreview('')
    try {
      const code = await getNextProductCode(categoryId)
      if (request === codeRequestNumber.current) setFormCodePreview(code)
    } catch {
      if (request === codeRequestNumber.current) {
        setFormCodePreview('')
        setFormError('Không tạo được mã hàng xem trước. Vui lòng thử lại.')
      }
    }
  }

  // Open Add Modal
  const openAddModal = async () => {
    setFormName('')
    setFormUnit('cái')
    setFormCostPrice(0)
    setFormSellPrice(0)
    setFormStock(0)
    setFormMinStock(5)
    setFormPriceMode('auto')
    setFormBarcode('')
    setFormExpiryDate('')
    setFormImageFile(null)
    setFormError('')
    setIsAdvancedOptionsOpen(false)

    const firstCat = categories[0]?.id || ''
    setFormCategory(firstCat)
    if (firstCat) {
      await loadCodePreview(firstCat)
    } else {
      setFormCodePreview('')
    }
    setIsAddOpen(true)
  }

  // Handle Category Change in Add Modal
  const handleCategoryChange = async (catId: string) => {
    setFormCategory(catId)
    await loadCodePreview(catId)
  }

  // Submit Add
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên món hàng')
      return
    }
    if (!formCategory) {
      setFormError('Vui lòng chọn nhóm hàng')
      return
    }
    if (formSellPrice <= formCostPrice) {
      const confirmLoss = window.confirm(
        'CẢNH BÁO: Giá bán (' +
          formatMoney(formSellPrice) +
          ') bằng hoặc thấp hơn giá nhập (' +
          formatMoney(formCostPrice) +
          ')! Bạn có chắc chắn muốn bán lỗ không?'
      )
      if (!confirmLoss) return
    }

    startTransition(async () => {
      try {
        const res = await createProductAction({
          name: formName,
          categoryId: formCategory,
          unit: formUnit,
          priceMode: formPriceMode,
          costPrice: formCostPrice,
          sellPrice: formSellPrice,
          initialStock: formStock,
          minStock: formMinStock,
          barcode: formBarcode || undefined,
          expiryDate: formExpiryDate || undefined,
          imageFile: formImageFile,
        })

        if (res.error) {
          setFormError(res.error)
        } else if (res.product) {
          if (!units.includes(formUnit)) {
            setUnits([...units, formUnit])
          }
          setIsAddOpen(false)
          refreshProductList()
        }
      } catch {
        setFormError('Không thêm được hàng hóa. Vui lòng thử lại.')
      }
    })
  }

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    setReturnToDetailProductId(p.id)
    closeDetailsModal(true)
    setActiveProduct(p)
    setFormName(p.name)
    setFormCategory(p.category_id || '')
    setFormCodePreview(p.code)
    setFormUnit(p.unit)
    setFormCostPrice(p.last_cost)
    setFormSellPrice(p.sell_price)
    setFormMinStock(p.min_stock)
    setFormPriceMode(p.price_mode)
    setFormBarcode(p.barcode || '')
    setFormExpiryDate(p.expiry_date || '')
    setFormImageFile(null)
    setFormError('')
    setIsEditOpen(true)
  }

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProduct) return
    setFormError('')

    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên món hàng')
      return
    }

    startTransition(async () => {
      try {
        const res = await updateProductAction(activeProduct.id, {
          name: formName,
          categoryId: formCategory,
          unit: formUnit,
          priceMode: formPriceMode,
          costPrice: formCostPrice,
          sellPrice: formSellPrice,
          minStock: formMinStock,
          barcode: formBarcode || undefined,
          expiryDate: formExpiryDate || undefined,
          imageFile: formImageFile,
        })

        if (res.error) {
          setFormError(res.error)
        } else {
          setIsEditOpen(false)
          setIsPriceHistoryOpen(false)
          setIsStockHistoryOpen(false)
          setReturnToDetailProductId(null)
          await loadProductDetails(activeProduct.id, activeProduct)
          refreshProductList()
        }
      } catch {
        setFormError('Không cập nhật được hàng hóa. Vui lòng thử lại.')
      }
    })
  }

  // Toggle Hide / Show
  const handleToggleActive = (p: Product) => {
    setActiveProduct(p)
    setIsConfirmHideOpen(true)
  }

  const confirmToggleActive = () => {
    if (!activeProduct) return
    const newStatus = !activeProduct.is_active

    startTransition(async () => {
      try {
        const res = await toggleProductActiveAction(activeProduct.id, newStatus)
        if (!res.error) {
          setActiveProduct((product) =>
            product?.id === activeProduct.id ? { ...product, is_active: newStatus } : product
          )
          refreshProductList()
        } else {
          setListError(res.error)
        }
      } catch {
        setListError('Không thay đổi được trạng thái hàng hóa. Vui lòng thử lại.')
      } finally {
        setIsConfirmHideOpen(false)
      }
    })
  }

  // Open Details Modal
  const loadProductDetails = useCallback(async (productId: string, fallback: Product) => {
    const request = ++detailRequestNumber.current
    setActiveProduct(fallback)
    setIsDetailOpen(true)
    setDetailError('')
    setIsDetailLoading(true)
    try {
      const details = await getProductDetailsAction(productId)
      if (request === detailRequestNumber.current) setActiveProduct(details.product as Product)
    } catch {
      if (request === detailRequestNumber.current) {
        setDetailError('Không tải được chi tiết hàng hóa. Vui lòng đóng và thử lại.')
      }
    } finally {
      if (request === detailRequestNumber.current) setIsDetailLoading(false)
    }
  }, [])
  const loadProductDetailsHandler = useRef(loadProductDetails)

  const openDetailsModal = (p: Product) => {
    void loadProductDetails(p.id, p)
  }

  const closeDetailsModal = (preserveReturnTarget = false) => {
    detailRequestNumber.current += 1
    setIsDetailOpen(false)
    setIsDetailLoading(false)
    if (!preserveReturnTarget) setReturnToDetailProductId(null)
  }

  const startLongPress = (p: Product, event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    clearLongPress()
    longPressOrigin.current = { x: event.clientX, y: event.clientY }
    longPressTimer.current = window.setTimeout(() => {
      longPressTimer.current = null
      longPressOrigin.current = null
      void openDetailsModal(p)
    }, 450)
  }

  const moveLongPress = (event: PointerEvent<HTMLElement>) => {
    const origin = longPressOrigin.current
    if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8) {
      clearLongPress()
    }
  }

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    longPressOrigin.current = null
  }

  const returnToDetails = useCallback(async () => {
    const productId = returnToDetailProductId
    const product = activeProduct?.id === productId
      ? activeProduct
      : products.find((item) => item.id === productId) ?? null
    setIsEditOpen(false)
    setIsPriceHistoryOpen(false)
    setIsStockHistoryOpen(false)
    setIsPriceHistoryLoading(false)
    setIsStockHistoryLoading(false)
    setReturnToDetailProductId(null)
    if (productId && product) await loadProductDetailsHandler.current(productId, product)
  }, [activeProduct, products, returnToDetailProductId])

  const openPriceHistoryModal = async () => {
    if (!activeProduct) return
    const product = activeProduct
    setReturnToDetailProductId(product.id)
    closeDetailsModal(true)
    setIsStockHistoryOpen(false)
    setIsPriceHistoryOpen(true)
    setPriceHistory(null)
    setPriceHistoryError('')
    setIsPriceHistoryLoading(true)
    const request = ++priceHistoryRequestNumber.current
    try {
      const history = await getProductPriceHistoryAction(product.id)
      if (request === priceHistoryRequestNumber.current) setPriceHistory(history)
    } catch {
      if (request === priceHistoryRequestNumber.current) {
        setPriceHistoryError('Không tải được lịch sử giá. Vui lòng thử lại.')
      }
    } finally {
      if (request === priceHistoryRequestNumber.current) setIsPriceHistoryLoading(false)
    }
  }

  const openStockHistoryModal = async () => {
    if (!activeProduct) return
    const product = activeProduct
    setReturnToDetailProductId(product.id)
    closeDetailsModal(true)
    setIsPriceHistoryOpen(false)
    setIsStockHistoryOpen(true)
    setStockHistory(null)
    setStockHistoryError('')
    setIsStockHistoryLoading(true)
    const request = ++stockHistoryRequestNumber.current
    try {
      const history = await getProductStockHistoryAction(product.id)
      if (request === stockHistoryRequestNumber.current) setStockHistory(history)
    } catch {
      if (request === stockHistoryRequestNumber.current) {
        setStockHistoryError('Không tải được lịch sử kho. Vui lòng thử lại.')
      }
    } finally {
      if (request === stockHistoryRequestNumber.current) setIsStockHistoryLoading(false)
    }
  }

  const closeHistoryOrEditAndReturn = useCallback(() => {
    if (isPriceHistoryOpen) priceHistoryRequestNumber.current += 1
    if (isStockHistoryOpen) stockHistoryRequestNumber.current += 1
    void returnToDetails()
  }, [isPriceHistoryOpen, isStockHistoryOpen, returnToDetails])

  useEffect(() => {
    childModalCloseHandler.current =
      isEditOpen || isPriceHistoryOpen || isStockHistoryOpen
        ? closeHistoryOrEditAndReturn
        : null
  }, [isEditOpen, isPriceHistoryOpen, isStockHistoryOpen, closeHistoryOrEditAndReturn])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && childModalCloseHandler.current) {
        event.preventDefault()
        childModalCloseHandler.current()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const openEditCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setNewCatName(category.name)
    setNewCatError('')
    setIsNewCatOpen(true)
  }

  const openNewCategory = () => {
    setEditingCategoryId(null)
    setNewCatName('')
    setNewCatError('')
    setIsNewCatOpen(true)
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewCatError('')
    if (!newCatName.trim()) {
      setNewCatError('Vui lòng nhập tên nhóm hàng')
      return
    }

    startTransition(async () => {
      try {
        const res = editingCategoryId
          ? await updateCategoryAction(editingCategoryId, newCatName)
          : await createCategoryAction(newCatName)
        if (res.error) {
          setNewCatError(res.error)
        } else if (res.category) {
          const newCat: Category = {
            id: res.category.id,
            name: res.category.name,
            code: res.category.code,
            description: editingCategoryId
              ? categories.find((category) => category.id === res.category?.id)?.description ?? null
              : null,
          }
          if (editingCategoryId) {
            setCategories(categories.map((category) =>
              category.id === newCat.id ? newCat : category
            ))
          } else {
            setCategories([...categories, newCat])
            setFormCategory(newCat.id)
            await loadCodePreview(newCat.id)
          }
          setIsNewCatOpen(false)
          setNewCatName('')
          setEditingCategoryId(null)
          refreshProductList()
        }
      } catch {
        setNewCatError('Không lưu được nhóm hàng. Vui lòng thử lại.')
      }
    })
  }

  return (
    <div className="space-y-6 max-sm:space-y-3 pb-20">
      {/* Header & Quick Action */}
      <div className="flex min-w-0 flex-col gap-3 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Danh sách hàng hóa</h1>
          <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
            Tổng cộng: <strong className="text-blue-600 font-semibold">{totalCount}</strong> món hàng
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Link
            href="/hang-hoa/kiem-kho"
            className="inline-flex w-full min-w-0 items-center justify-center whitespace-nowrap rounded-xl border border-blue-700 px-2 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 sm:w-auto sm:px-3 sm:text-sm"
          >
            Kiểm kho
          </Link>
          <Button
            size="sm"
            className="h-12 w-full min-w-0 justify-center whitespace-nowrap rounded-xl bg-green-600 px-2 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700 sm:w-auto sm:px-3 sm:text-sm"
            onClick={openAddModal}
          >
            <Plus className="h-4 w-4 shrink-0" />
            Thêm món
          </Button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="min-w-0 space-y-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:space-y-4 sm:p-5">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
              }}
              placeholder="Tìm tên món, mã..."
              className="h-12 min-w-0 flex-1 rounded-xl border-2 border-gray-200 px-3 py-2 pr-9 text-sm focus:border-blue-500"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('')
                }}
                aria-label="Xóa nội dung tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <button
            type="button"
            aria-expanded={isFilterExpanded}
            aria-controls="product-filters"
            onClick={() => setIsFilterExpanded((expanded) => !expanded)}
            className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-xl border-2 px-2.5 py-2 text-xs font-semibold sm:px-3 sm:text-sm ${
              activeFilterCount > 0
                ? 'border-blue-300 bg-blue-50 text-blue-800'
                : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            {isFilterExpanded ? 'Thu gọn' : `Thêm lọc${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
            {isFilterExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {activeFilterCount > 0 && !isFilterExpanded && (
            <button
              type="button"
              onClick={clearFilters}
              className="hidden min-h-12 shrink-0 items-center rounded-xl px-2 text-base font-semibold text-blue-700 hover:bg-blue-50 sm:inline-flex"
            >
              Xóa lọc
            </button>
          )}
        </div>

        {activeFilterCount > 0 && !isFilterExpanded && (
          <div className="flex justify-end sm:hidden">
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-12 rounded-xl px-2 text-base font-semibold text-blue-700 hover:bg-blue-50"
            >
              Xóa lọc
            </button>
          </div>
        )}

        {isFilterExpanded && (
          <div id="product-filters" className="space-y-4 max-sm:space-y-3">
            <div className="grid grid-cols-1 gap-3 max-sm:gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1">
                <span className="block text-base font-semibold text-gray-700">Trạng thái hàng hóa</span>
                <select
                  value={filterType}
                  onChange={(event) => {
                    setFilterType(event.target.value as typeof filterType)
                  }}
                  className="h-[50px] w-full rounded-xl border-2 border-gray-200 bg-white px-4 max-sm:px-3 text-lg max-sm:text-sm text-gray-900 outline-none focus:border-blue-500"
                >
                  <option value="all">Tất cả đang bán</option>
                  <option value="low_stock">Sắp hết hàng</option>
                  <option value="near_expiry">Sắp hết hạn</option>
                  <option value="inactive">Đã ẩn</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="block text-base font-semibold text-gray-700">Nhóm hàng</span>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(event) => {
                      setSelectedCategory(event.target.value)
                    }}
                    className="h-[50px] min-w-0 flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 max-sm:px-3 text-lg max-sm:text-sm text-gray-900 outline-none focus:border-blue-500"
                  >
                    <option value="all">Tất cả nhóm</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={selectedCategory === 'all'}
                    onClick={() => {
                      const category = categories.find((item) => item.id === selectedCategory)
                      if (category) openEditCategory(category)
                    }}
                    aria-label="Sửa nhóm hàng"
                    title={selectedCategory === 'all' ? 'Chọn một nhóm để sửa' : 'Sửa nhóm hàng'}
                    className="h-[50px] w-[50px] shrink-0 rounded-xl border-2 border-blue-200 text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
                  >
                    <Edit className="mx-auto h-5 w-5" />
                  </button>
                </div>
              </label>

              <label className="space-y-1">
                <span className="block text-base font-semibold text-gray-700">Cách tính giá</span>
                <select
                  value={priceModeFilter}
                  onChange={(event) => {
                    setPriceModeFilter(event.target.value as typeof priceModeFilter)
                  }}
                  className="h-[50px] w-full rounded-xl border-2 border-gray-200 bg-white px-4 max-sm:px-3 text-lg max-sm:text-sm text-gray-900 outline-none focus:border-blue-500"
                >
                  <option value="all">Tất cả cách tính giá</option>
                  <option value="auto">Tự động theo giá nhập</option>
                  <option value="fixed">Giá bán cố định</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="block text-base font-semibold text-gray-700">Sắp xếp theo</span>
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value as typeof sortBy)
                  }}
                  className="h-[50px] w-full rounded-xl border-2 border-gray-200 bg-white px-4 max-sm:px-3 text-lg max-sm:text-sm text-gray-900 outline-none focus:border-blue-500"
                >
                  <option value="name_asc">Tên món (A → Z)</option>
                  <option value="stock_asc">Còn ít hàng nhất</option>
                  <option value="stock_desc">Còn nhiều hàng nhất</option>
                  <option value="profit_desc">Lãi mỗi cái cao nhất</option>
                  <option value="sell_asc">Giá bán thấp → cao</option>
                  <option value="sell_desc">Giá bán cao → thấp</option>
                </select>
              </label>
            </div>
            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  className="h-12 min-h-[48px] rounded-xl border-gray-300 px-4 max-sm:px-3 text-base font-semibold"
                >
                  <X className="mr-1 h-5 w-5" />
                  Xóa lọc
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product List Table / Cards */}
      <p className="mb-2 text-sm text-gray-500">
        Nhấn giữ vào món hàng để xem chi tiết hoặc chỉnh sửa
      </p>
      {listError && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 max-sm:p-3 text-lg max-sm:text-sm text-red-800" role="alert">
          {listError}
          <Button className="ml-3 min-h-[48px]" onClick={refreshProductList}>Tải lại danh sách</Button>
        </div>
      )}
      {!listError && (products.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4 max-sm:mb-3" />
          <h3 className="text-xl max-sm:text-base font-bold text-gray-700 mb-2">
            {totalCount === 0 && !search && selectedCategory === 'all' && filterType === 'all'
              ? 'Chưa có món hàng nào'
              : 'Không tìm thấy món hàng nào'}
          </h3>
          <p className="text-gray-500 text-lg max-sm:text-sm max-w-md mx-auto mb-6 max-sm:mb-3">
            {totalCount === 0 && !search && selectedCategory === 'all' && filterType === 'all'
              ? 'Bấm “Thêm món mới” để bắt đầu tạo danh sách hàng hóa cho cửa hàng.'
              : 'Thử đổi từ khóa hoặc bộ lọc. Bạn cũng có thể bấm “Thêm món mới” để tạo hàng hóa.'}
          </p>
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white font-medium text-lg max-sm:text-sm px-8 max-sm:px-3 rounded-xl min-h-[48px]"
            onClick={openAddModal}
          >
            Thêm món mới ngay
          </Button>
        </div>
      ) : (
        <div className="bg-transparent p-0 border-0 shadow-none">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-lg max-sm:text-sm">
                  <th className="py-4 max-sm:py-2 px-5 max-sm:px-3">Tên món hàng</th>
                  <th className="py-4 max-sm:py-2 px-4 max-sm:px-3">Nhóm</th>
                  <th className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-center">Còn trong kho</th>
                  <th className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-right">Giá nhập</th>
                  <th className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-right">Giá bán</th>
                  <th className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-right">Lãi mỗi cái</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-lg max-sm:text-sm">
                {visibleProducts.map((p) => {
                  const isLow = Number(p.stock) < Number(p.min_stock)
                  const isOutOfStock = Number(p.stock) <= 0
                  const profit = p.sell_price - p.last_cost

                  return (
                    <tr
                      key={p.id}
                      onPointerDown={(event) => startLongPress(p, event)}
                      onPointerUp={clearLongPress}
                      onPointerLeave={clearLongPress}
                      onPointerMove={moveLongPress}
                      onPointerCancel={clearLongPress}
                      onContextMenu={(event) => event.preventDefault()}
                      className={`cursor-pointer touch-pan-y hover:bg-blue-50/50 transition-colors ${
                        !p.is_active ? 'bg-gray-50/80 opacity-75' : ''
                      }`}
                    >
                      <td className="py-4 max-sm:py-2 px-5 max-sm:px-3">
                        <div className="font-bold text-gray-900 text-lg max-sm:text-sm">{p.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gray-400 text-lg max-sm:text-sm">ĐVT: {p.unit}</span>
                          {p.expiry_date && (
                            <span className="text-purple-600 text-lg max-sm:text-sm bg-purple-50 px-2 py-0.5 rounded">
                              HSD: {formatDate(p.expiry_date)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-gray-600">
                        {p.category?.name || 'Chưa phân nhóm'}
                      </td>
                      <td className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-center">
                        <div
                          className={`inline-block font-bold px-3 py-1 rounded-full text-lg max-sm:text-sm ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {Number(p.stock)} {p.unit}
                        </div>
                        {isLow && !isOutOfStock && (
                          <div className="text-amber-600 text-lg max-sm:text-sm mt-0.5">Sắp hết hàng</div>
                        )}
                        {isOutOfStock && (
                          <div className="text-red-600 text-lg max-sm:text-sm mt-0.5 font-semibold">Hết hàng</div>
                        )}
                      </td>
                      <td className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-right text-gray-600 font-medium">
                        {formatMoney(p.last_cost)}
                      </td>
                      <td className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-right font-bold text-gray-900 text-lg max-sm:text-sm">
                        {formatMoney(p.sell_price)}
                      </td>
                      <td className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-right">
                        <span
                          className={`font-semibold ${
                            profit < 0 ? 'text-red-600' : 'text-green-700'
                          }`}
                        >
                          {profit > 0 ? '+' : ''}
                          {formatMoney(profit)}
                        </span>
                      </td>
                      </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Cards View */}
          <div className="flex flex-col gap-3 lg:hidden">
            {visibleProducts.map((p) => {
              const isLow = Number(p.stock) < Number(p.min_stock)
              const isOutOfStock = Number(p.stock) <= 0
              const profit = p.sell_price - p.last_cost

              return (
                <div
                  key={p.id}
                  onPointerDown={(event) => startLongPress(p, event)}
                  onPointerUp={clearLongPress}
                  onPointerLeave={clearLongPress}
                  onPointerMove={moveLongPress}
                  onPointerCancel={clearLongPress}
                  onContextMenu={(event) => event.preventDefault()}
                  className={`cursor-pointer touch-pan-y space-y-2 bg-white border-2 border-slate-300 shadow-sm rounded-xl p-3 ${!p.is_active ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {p.image_url && (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={p.image_url}
                          alt={`Ảnh ${p.name}`}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 min-w-0 text-sm font-semibold leading-tight text-slate-900">{p.name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-slate-500">{p.category?.name || 'Chưa phân nhóm'}</span>
                          {p.expiry_date && (
                            <span className="inline-flex items-center whitespace-nowrap rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-600">
                              HSD: {formatDate(p.expiry_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${
                          isOutOfStock
                            ? 'bg-red-100 text-red-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {Number(p.stock)} {p.unit}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-3 divide-x divide-slate-200/80 rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                    <div className="min-w-0">
                      <div className="text-[12px] text-slate-500">Giá nhập</div>
                      <div className="whitespace-nowrap text-xs font-semibold text-slate-700">{formatMoney(p.last_cost)}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] text-slate-500">Giá bán</div>
                      <div className="whitespace-nowrap text-sm font-bold text-blue-600">{formatMoney(p.sell_price)}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] text-slate-500">Lãi</div>
                      <div
                        className={`whitespace-nowrap text-xs font-semibold ${
                          profit < 0 ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {profit > 0 ? '+' : ''}
                        {formatMoney(profit)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {visibleProducts.length > 0 && totalCount > visibleCount && !listError && (
        <div ref={sentinelRef} className="min-h-10 rounded-xl bg-white p-4 max-sm:p-3 text-center text-lg max-sm:text-sm text-gray-600" aria-live="polite">
          Cuộn để xem thêm hàng hóa...
        </div>
      )}

      {/* MODAL THÊM HÀNG MỚI */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90dvh] sm:max-w-lg sm:rounded-2xl">
            <header className="flex shrink-0 items-center justify-between bg-blue-600 p-4 max-sm:p-3 text-white">
              <div>
                <h2 className="text-xl max-sm:text-base font-bold">Thêm món mới</h2>
                <p className="mt-0.5 text-sm text-blue-100">Điền thông tin để đưa vào bán hàng</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-white/90 hover:bg-white/10 hover:text-white"
                aria-label="Đóng cửa sổ thêm món mới"
              >
                <X className="h-6 w-6" />
              </button>
            </header>

            <form onSubmit={handleAddSubmit} className="flex min-h-0 flex-1 flex-col">
              <div
                ref={addModalBodyRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth p-4 max-sm:p-3"
              >
              {formError && (
                <div className="mb-4 max-sm:mb-3 flex items-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 p-3.5 text-base text-red-700" role="alert">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="mb-4 max-sm:mb-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="text-base font-semibold text-gray-800">Nhóm hàng *</label>
                    <button
                      type="button"
                      onClick={openNewCategory}
                      className="flex min-h-12 items-center gap-1 rounded-lg px-2 text-base font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <FolderPlus className="h-4 w-4" />
                      + Thêm nhóm
                    </button>
                  </div>
                  <select
                    value={formCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="h-12 w-full rounded-xl border-2 border-gray-300 bg-white px-3 text-base focus:border-blue-500"
                    required
                  >
                    <option value="">-- Chọn nhóm --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4 max-sm:mb-3">
                <label className="mb-1.5 block text-base font-semibold text-gray-800">
                  Tên món hàng *
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Nước ngọt Coca Cola 330ml, Gạo ST25..."
                  className="text-base font-medium"
                  required
                />
              </div>

              <div className="mb-4 max-sm:mb-3">
                <label className="mb-1.5 block text-base font-semibold text-gray-800">
                  Đơn vị tính *
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {QUICK_UNITS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setFormUnit(u)}
                      className={`min-h-12 rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                        formUnit === u
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
                <Input
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  aria-label="Đơn vị tính"
                  placeholder="Nhập đơn vị tính khác..."
                  required
                />
              </div>

              <div className="mb-4 max-sm:mb-3 grid grid-cols-2 gap-3 max-sm:gap-2">
                <div>
                  <label className="mb-1.5 block text-base font-semibold text-gray-800">
                    Giá nhập (đ) *
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatMoneyInput(formCostPrice)}
                    onChange={(e) => setFormCostPrice(parseMoney(e.target.value))}
                    placeholder="10.000"
                    className="px-2 text-base font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-base font-semibold text-gray-800">
                    Giá bán (đ) *
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatMoneyInput(formSellPrice)}
                    onChange={(e) => setFormSellPrice(parseMoney(e.target.value))}
                    placeholder="13.000"
                    className="px-2 text-base font-bold text-blue-600"
                    required
                  />
                </div>
              </div>

              <div
                className={`mb-4 max-sm:mb-3 flex items-center justify-between rounded-xl border-2 p-4 max-sm:p-3 ${
                  profitPerItem >= 0
                    ? 'bg-green-50 border-green-200 text-green-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-5 w-5 ${profitPerItem >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="text-base font-medium">Lãi mỗi cái</span>
                </div>
                <div className="text-lg max-sm:text-sm font-bold">
                  {profitPerItem >= 0 ? '+' : ''}
                  {formatMoney(profitPerItem)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAdvancedOptionsOpen((open) => !open)}
                aria-expanded={isAdvancedOptionsOpen}
                aria-controls="add-product-advanced-options"
                className="flex min-h-12 w-full items-center justify-between gap-3 max-sm:gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 max-sm:px-3 py-2 text-left text-base font-semibold text-gray-800 hover:bg-gray-100"
              >
                <span>
                  <span className="block">Tùy chọn nâng cao</span>
                  <span className="mt-0.5 block text-sm font-normal text-gray-500">
                    Ảnh, hạn sử dụng, mã vạch, số lượng ban đầu...
                  </span>
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${isAdvancedOptionsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAdvancedOptionsOpen && (
                <div id="add-product-advanced-options" className="mt-4 max-sm:mt-3 space-y-4 max-sm:space-y-3">
                  <div className="grid grid-cols-1 gap-4 max-sm:gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-base font-semibold text-gray-800">
                        Còn trong kho hiện tại
                      </label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={formStock}
                        onChange={(e) => setFormStock(Number(e.target.value))}
                        className="text-base"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-base font-semibold text-gray-800">
                        Báo sắp hết khi còn dưới
                      </label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={formMinStock}
                        onChange={(e) => setFormMinStock(Number(e.target.value))}
                        className="text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-base font-semibold text-gray-800">
                      Cách tính giá khi nhập hàng mới
                    </label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setFormPriceMode('auto')}
                        className={`min-h-12 rounded-xl border-2 p-3 text-left transition-all ${
                          formPriceMode === 'auto'
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-base font-bold">Tự đề xuất giá</div>
                        <div className="mt-0.5 text-sm text-gray-500">
                          Giá nhập thay đổi thì đề xuất giá bán tương ứng
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormPriceMode('fixed')}
                        className={`min-h-12 rounded-xl border-2 p-3 text-left transition-all ${
                          formPriceMode === 'fixed'
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-base font-bold">Giữ giá cố định</div>
                        <div className="mt-0.5 text-sm text-gray-500">
                          Không đề xuất đổi giá khi nhập hàng mới
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-sm:gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-base font-semibold text-gray-800">
                        Hạn sử dụng (không bắt buộc)
                      </label>
                      <Input
                        type="date"
                        value={formExpiryDate}
                        onChange={(e) => setFormExpiryDate(e.target.value)}
                        className="text-base"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-base font-semibold text-gray-800">
                        Mã vạch (không bắt buộc)
                      </label>
                      <Input
                        value={formBarcode}
                        onChange={(e) => setFormBarcode(e.target.value)}
                        placeholder="Quét hoặc gõ mã..."
                        className="text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-base font-semibold text-gray-800">
                      Ảnh hàng hóa (không bắt buộc)
                    </label>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setFormImageFile(e.target.files?.[0] ?? null)}
                      className="h-auto min-h-12 text-base"
                    />
                    <p className="mt-1 text-sm text-gray-600">Ảnh JPG, PNG hoặc WebP, tối đa 5 MB.</p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-base font-semibold text-gray-800">
                      Mã hàng (tự sinh)
                    </label>
                    <Input
                      value={formCodePreview}
                      readOnly
                      placeholder={formCategory ? 'Đang tạo mã...' : 'Chọn nhóm hàng trước'}
                      className="bg-gray-100 font-mono font-bold text-gray-700"
                    />
                  </div>
                </div>
              )}
              </div>

              <footer className="flex shrink-0 gap-3 max-sm:gap-2 border-t border-gray-100 bg-white p-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setIsAddOpen(false)}
                  className="min-h-12 flex-1 rounded-xl px-4 max-sm:px-3 text-base"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending}
                  className="min-h-12 flex-1 rounded-xl bg-green-600 px-4 max-sm:px-3 text-base font-bold text-white shadow-md hover:bg-green-700"
                >
                  {isPending ? 'Đang lưu...' : 'Lưu món mới'}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA MÓN HÀNG */}
      {isEditOpen && activeProduct && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 max-sm:p-3 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeHistoryOrEditAndReturn()
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 border border-gray-200">
            <div className="bg-blue-600 text-white p-5 max-sm:p-3 flex justify-between items-center">
              <div>
                <h2 className="text-2xl max-sm:text-lg font-bold">Sửa món hàng</h2>
                <p className="text-blue-100 text-lg max-sm:text-sm mt-0.5">Mã hàng: {activeProduct.code}</p>
              </div>
              <button
                onClick={closeHistoryOrEditAndReturn}
                className="text-white/80 hover:text-white p-2 rounded-lg"
                aria-label="Quay lại chi tiết hàng hóa"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 max-sm:p-3 space-y-5 max-sm:space-y-3">
              {formError && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3.5 rounded-xl text-lg max-sm:text-sm flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nhóm hàng */}
              <div>
                <label className="block font-semibold text-gray-800 text-lg max-sm:text-sm mb-1.5">
                  Nhóm hàng *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full h-12 px-3 border-2 border-gray-300 rounded-xl text-lg max-sm:text-sm bg-white focus:border-blue-500"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tên món hàng */}
              <div>
                <label className="block font-semibold text-gray-800 text-lg max-sm:text-sm mb-1.5">
                  Tên món hàng *
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="text-lg max-sm:text-sm font-medium"
                  required
                />
              </div>

              {/* ĐVT */}
              <div>
                <label className="block font-semibold text-gray-800 text-lg max-sm:text-sm mb-1.5">
                  Đơn vị tính *
                </label>
                <Input
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  required
                />
              </div>

              {/* Giá nhập & Giá bán */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-sm:gap-2">
                <div>
                  <label className="block font-semibold text-gray-800 text-lg max-sm:text-sm mb-1.5">
                    Giá nhập gần nhất (đ)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatMoneyInput(formCostPrice)}
                    onChange={(e) => setFormCostPrice(parseMoney(e.target.value))}
                    className="text-lg max-sm:text-sm font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-800 text-lg max-sm:text-sm mb-1.5">
                    Giá bán đang áp dụng (đ)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatMoneyInput(formSellPrice)}
                    onChange={(e) => setFormSellPrice(parseMoney(e.target.value))}
                    className="text-lg max-sm:text-sm font-bold text-blue-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-800 text-lg max-sm:text-sm mb-1.5">
                  Ảnh hàng hóa (không bắt buộc)
                </label>
                {activeProduct.image_url && (
                  <div className="relative mb-2 h-20 w-20 overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={activeProduct.image_url}
                      alt={`Ảnh ${activeProduct.name}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFormImageFile(e.target.files?.[0] ?? null)}
                  className="h-auto min-h-[48px] text-lg max-sm:text-sm"
                />
                <p className="mt-1 text-lg max-sm:text-sm text-gray-600">Chọn ảnh mới nếu muốn thay ảnh hiện tại.</p>
              </div>

              {/* Khung lãi */}
              <div className="bg-blue-50 border border-blue-200 p-4 max-sm:p-3 rounded-xl flex justify-between items-center text-blue-900">
                <span className="font-medium text-lg max-sm:text-sm">Lãi mỗi cái hiện tại:</span>
                <span className="text-xl max-sm:text-base font-bold">{formatMoney(profitPerItem)}</span>
              </div>

              {/* Chế độ giá */}
              <div>
                <label className="block font-semibold text-gray-800 text-lg max-sm:text-sm mb-1.5">
                  Cách tính giá khi nhập hàng mới
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPriceMode('auto')}
                    className={`p-3 min-h-[48px] rounded-xl text-left border-2 transition-all ${
                      formPriceMode === 'auto'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-bold text-lg max-sm:text-sm">Tự đề xuất giá</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPriceMode('fixed')}
                    className={`p-3 min-h-[48px] rounded-xl text-left border-2 transition-all ${
                      formPriceMode === 'fixed'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-bold text-lg max-sm:text-sm">Giữ giá cố định</div>
                  </button>
                </div>
              </div>

              {/* Ngưỡng báo & HSD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-sm:gap-2">
                <div>
                  <label className="block font-semibold text-gray-800 text-lg max-sm:text-sm mb-1.5">
                    Ngưỡng báo sắp hết
                  </label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-800 text-lg max-sm:text-sm mb-1.5">
                    Hạn sử dụng
                  </label>
                  <Input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 max-sm:gap-2 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={closeHistoryOrEditAndReturn}
                  className="min-h-[48px] text-lg max-sm:text-sm px-6 max-sm:px-3 rounded-xl"
                >
                  Quay lại chi tiết
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-h-[48px] text-lg max-sm:text-sm px-8 max-sm:px-3 rounded-xl font-bold shadow-md"
                >
                  {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT HÀNG HÓA */}
      {isDetailOpen && activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 max-sm:p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="bg-gray-800 text-white p-5 max-sm:p-3 flex justify-between items-center">
              <div>
                <h2 className="text-xl max-sm:text-base sm:text-2xl font-bold">{activeProduct.name}</h2>
                <p className="text-gray-300 text-lg max-sm:text-sm mt-0.5">
                  Mã: {activeProduct.code} • Còn trong kho: {Number(activeProduct.stock)}{' '}
                  {activeProduct.unit}
                </p>
              </div>
              <button
                onClick={() => closeDetailsModal()}
                className="text-white/80 hover:text-white p-2 rounded-lg"
                aria-label="Đóng chi tiết hàng hóa"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 max-sm:space-y-3 overflow-y-auto p-4 max-sm:p-3 sm:p-5">
              {isDetailLoading && (
                <div className="text-center text-lg max-sm:text-sm text-gray-600" role="status">Đang tải chi tiết hàng hóa…</div>
              )}
              {detailError && (
                <div className="rounded-lg bg-red-50 p-4 max-sm:p-3 text-lg max-sm:text-sm text-red-800" role="alert">{detailError}</div>
              )}
              {activeProduct.image_url && (
                <div className="relative h-32 w-32 overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={activeProduct.image_url}
                    alt={`Ảnh ${activeProduct.name}`}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
              )}
              {/* Thẻ tóm tắt thông số mốc */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-sm:gap-2 bg-blue-50/60 p-4 max-sm:p-3 rounded-xl border border-blue-100 text-center">
                <div>
                  <div className="text-lg max-sm:text-sm text-gray-500">Lãi mỗi cái</div>
                  <div className={`font-bold text-lg max-sm:text-sm ${activeProduct.sell_price - activeProduct.last_cost < 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {formatMoney(activeProduct.sell_price - activeProduct.last_cost)}
                  </div>
                </div>
                <div>
                  <div className="text-lg max-sm:text-sm text-gray-500">Mốc giá nhập</div>
                  <div className="font-bold text-gray-800 text-lg max-sm:text-sm">
                    {formatMoney(activeProduct.base_cost)}
                  </div>
                </div>
                <div>
                  <div className="text-lg max-sm:text-sm text-gray-500">Mốc giá bán</div>
                  <div className="font-bold text-gray-800 text-lg max-sm:text-sm">
                    {formatMoney(activeProduct.base_price)}
                  </div>
                </div>
                <div>
                  <div className="text-lg max-sm:text-sm text-gray-500">Giá vốn trung bình</div>
                  <div className="font-bold text-gray-800 text-lg max-sm:text-sm">
                    {formatMoney(activeProduct.avg_cost)}
                  </div>
                </div>
                <div>
                  <div className="text-lg max-sm:text-sm text-gray-500">Giá bán hiện tại</div>
                  <div className="font-bold text-blue-600 text-lg max-sm:text-sm">
                    {formatMoney(activeProduct.sell_price)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 max-sm:gap-2 text-base sm:text-lg">
                <div className="rounded-xl border border-gray-200 p-4 max-sm:p-3">
                  <div className="text-gray-500">Mã hàng</div>
                  <div className="font-semibold">{activeProduct.code}</div>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 max-sm:p-3">
                  <div className="text-gray-500">Nhóm hàng</div>
                  <div className="font-semibold">{activeProduct.category?.name || 'Chưa phân nhóm'}</div>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 max-sm:p-3">
                  <div className="text-gray-500">Đơn vị tính</div>
                  <div className="font-semibold">{activeProduct.unit}</div>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 max-sm:p-3">
                  <div className="text-gray-500">Mã vạch</div>
                  <div className="font-semibold">{activeProduct.barcode || 'Chưa có'}</div>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 max-sm:p-3">
                  <div className="text-gray-500">Hạn sử dụng</div>
                  <div className="font-semibold">
                    {activeProduct.expiry_date ? formatDate(activeProduct.expiry_date) : 'Chưa khai báo'}
                  </div>
                  <div className="mt-1 text-base text-gray-500">Hiển thị hạn của lô sắp hết hạn sớm nhất</div>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 max-sm:p-3">
                  <div className="text-gray-500">Ngưỡng báo sắp hết</div>
                  <div className="font-semibold">
                    {activeProduct.min_stock} {activeProduct.unit}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 max-sm:p-3">
                  <div className="text-gray-500">Cách tính giá</div>
                  <div className="font-semibold">
                    {activeProduct.price_mode === 'auto' ? 'Tự động theo giá nhập' : 'Giá bán cố định'}
                  </div>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 bg-gray-50 p-3">
              <Button
                variant="outline"
                onClick={() => openEditModal(activeProduct)}
                className="h-auto min-h-[44px] rounded-xl px-3 py-2 text-[15px] font-medium"
              >
                Sửa thông tin
              </Button>
              <Button
                variant="outline"
                onClick={() => void openStockHistoryModal()}
                className="h-auto min-h-[44px] rounded-xl px-3 py-2 text-[15px] font-medium"
              >
                Lịch sử kho
              </Button>
              <Button
                variant="outline"
                onClick={() => void openPriceHistoryModal()}
                className="h-auto min-h-[44px] rounded-xl px-3 py-2 text-[15px] font-medium"
              >
                Lịch sử giá
              </Button>
              <Button
                variant={activeProduct.is_active ? 'outline' : 'default'}
                onClick={() => handleToggleActive(activeProduct)}
                className="h-auto min-h-[44px] rounded-xl px-3 py-2 text-[15px] font-medium"
              >
                {activeProduct.is_active ? 'Ẩn món hàng' : 'Hiện lại món hàng'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isPriceHistoryOpen && activeProduct && (
        <HistoryModalFrame
          title="Lịch sử giá"
          productName={activeProduct.name}
          isLoading={isPriceHistoryLoading}
          error={priceHistoryError}
          onClose={closeHistoryOrEditAndReturn}
        >
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-lg max-sm:text-sm font-bold text-gray-900">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Thay đổi giá nhập và giá bán
            </h3>
            {priceHistory?.length ? (
              <div className="space-y-3">
                {priceHistory.map((history) => (
                  <article key={history.id} className="rounded-xl border border-gray-200 p-4 max-sm:p-3 text-lg max-sm:text-sm">
                    <p className="font-bold text-gray-900">{formatDate(history.created_at)}</p>
                    <p className="text-gray-700">Người đổi: {history.changed_by_name || 'Chưa ghi nhận'}</p>
                    <p className="mt-2 text-gray-800">
                      Giá nhập: {formatMoney(history.old_cost)} → <strong>{formatMoney(history.new_cost)}</strong>
                    </p>
                    <p className="text-gray-800">
                      Giá bán: {formatMoney(history.old_price)} → <strong className="text-blue-700">{formatMoney(history.new_price)}</strong>
                    </p>
                  </article>
                ))}
              </div>
            ) : !isPriceHistoryLoading && !priceHistoryError ? (
              <p className="text-lg max-sm:text-sm italic text-gray-500">Chưa có thay đổi giá nào được ghi nhận.</p>
            ) : null}
          </section>
        </HistoryModalFrame>
      )}

      {isStockHistoryOpen && activeProduct && (
        <HistoryModalFrame
          title="Lịch sử kho"
          productName={activeProduct.name}
          isLoading={isStockHistoryLoading}
          error={stockHistoryError}
          onClose={closeHistoryOrEditAndReturn}
        >
          <section>
            <h3 className="mb-3 flex items-center gap-2 text-lg max-sm:text-sm font-bold text-gray-900">
              <Package className="h-5 w-5 text-green-600" />
              Nhập, bán, kiểm kho và hủy đơn
            </h3>
            {stockHistory?.length ? (
              <div className="space-y-3">
                {stockHistory.map((movement) => {
                  const typeLabel =
                    movement.type === 'sale'
                      ? 'Bán hàng'
                      : movement.type === 'purchase'
                      ? 'Nhập hàng'
                      : movement.type === 'sale_cancel'
                      ? 'Hủy bán'
                      : movement.type === 'purchase_cancel'
                      ? 'Hủy nhập'
                      : 'Kiểm kho'
                  const isPlus = movement.quantity > 0

                  return (
                    <article key={movement.id} className="rounded-xl border border-gray-200 p-4 max-sm:p-3 text-lg max-sm:text-sm">
                      <div className="flex justify-between gap-3 max-sm:gap-2">
                        <strong className="text-gray-900">{typeLabel}</strong>
                        <strong className={isPlus ? 'text-green-700' : 'text-red-700'}>
                          {isPlus ? '+' : ''}{movement.quantity}
                        </strong>
                      </div>
                      <p className="text-gray-700">{formatDate(movement.created_at)}</p>
                      <p className="text-gray-800">
                        Còn trong kho sau đó: <strong>{movement.balance_after}</strong>
                      </p>
                      {movement.note && <p className="break-words text-gray-700">Ghi chú: {movement.note}</p>}
                    </article>
                  )
                })}
              </div>
            ) : !isStockHistoryLoading && !stockHistoryError ? (
              <p className="text-lg max-sm:text-sm italic text-gray-500">Chưa có biến động kho.</p>
            ) : null}
          </section>
        </HistoryModalFrame>
      )}

      {/* MODAL THÊM / SỬA NHÓM HÀNG */}
      {isNewCatOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 max-sm:p-3 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleCategorySubmit}
            className="bg-white rounded-2xl w-full max-w-md p-6 max-sm:p-3 shadow-2xl border border-gray-200 space-y-4 max-sm:space-y-3"
          >
            <h3 className="text-xl max-sm:text-base font-bold text-gray-900">
              {editingCategoryId ? 'Sửa nhóm hàng' : 'Thêm nhóm hàng mới'}
            </h3>
            {newCatError && (
              <div className="text-red-600 text-lg max-sm:text-sm bg-red-50 p-2.5 rounded-lg" role="alert">{newCatError}</div>
            )}
            <div>
              <label className="block text-lg max-sm:text-sm font-semibold text-gray-700 mb-1">
                Tên nhóm hàng *
              </label>
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ví dụ: Đồ ăn vặt, Hóa phẩm..."
                autoFocus
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsNewCatOpen(false)
                  setEditingCategoryId(null)
                }}
                className="min-h-[48px]"
              >
                Không
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-blue-600 text-white min-h-[48px] font-semibold"
              >
                {editingCategoryId ? 'Lưu thay đổi' : 'Lưu nhóm'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL XÁC NHẬN ẨN / HIỆN HÀNG HÓA */}
      {isConfirmHideOpen && activeProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 max-sm:p-3 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-sm:p-3 shadow-2xl border border-gray-200 space-y-5 max-sm:space-y-3">
            <div className="flex items-center gap-3 max-sm:gap-2 text-amber-600">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h3 className="text-xl max-sm:text-base font-bold text-gray-900">
                {activeProduct.is_active ? 'Ẩn món hàng?' : 'Hiện lại món hàng?'}
              </h3>
            </div>
            <p className="text-lg max-sm:text-sm text-gray-600 leading-relaxed">
              {activeProduct.is_active ? (
                <>
                  Bạn có chắc muốn ẩn món{' '}
                  <strong className="text-gray-900">&quot;{activeProduct.name}&quot;</strong> khỏi màn
                  hình bán hàng? Món này vẫn giữ đầy đủ lịch sử trong sổ sách.
                </>
              ) : (
                <>
                  Bạn có chắc muốn hiện lại món{' '}
                  <strong className="text-gray-900">&quot;{activeProduct.name}&quot;</strong> để tiếp
                  tục bán hàng?
                </>
              )}
            </p>
            <div className="flex justify-end gap-3 max-sm:gap-2 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsConfirmHideOpen(false)}
                className="min-h-[48px] text-lg max-sm:text-sm px-6 max-sm:px-3 rounded-xl font-medium"
              >
                Không
              </Button>
              <Button
                size="lg"
                onClick={confirmToggleActive}
                disabled={isPending}
                className={`min-h-[48px] text-lg max-sm:text-sm px-6 max-sm:px-3 rounded-xl font-bold text-white shadow-md ${
                  activeProduct.is_active
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {activeProduct.is_active ? 'Có, ẩn' : 'Có, hiện lại'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
