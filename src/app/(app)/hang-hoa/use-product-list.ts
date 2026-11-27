'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { PointerEvent, RefObject } from 'react'
import type * as React from 'react'
import { formatMoney } from '@/lib/money'
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
import { matchesSearch } from '@/lib/search'
import { useProgressiveList } from '@/lib/use-progressive-list'

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

export interface ProductListProps {
  initialProducts: Product[]
  categories: Category[]
  units: string[]
  defaultMinStock: number
}

export type ProductListSentinelRef = RefObject<HTMLDivElement | null>

export function useProductList({ initialProducts, categories: initialCategories, units: initialUnits, defaultMinStock, sentinelRef }: ProductListProps & { sentinelRef: ProductListSentinelRef }) {
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
  const { visibleCount } = useProgressiveList(totalCount, resetKey, sentinelRef)
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

  return {
    products,
    setProducts,
    categories,
    setCategories,
    units,
    setUnits,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    filterType,
    setFilterType,
    priceModeFilter,
    setPriceModeFilter,
    sortBy,
    setSortBy,
    isFilterExpanded,
    setIsFilterExpanded,
    listRevision,
    setListRevision,
    listError,
    setListError,
    codeRequestNumber,
    isAddOpen,
    setIsAddOpen,
    isAdvancedOptionsOpen,
    setIsAdvancedOptionsOpen,
    isEditOpen,
    setIsEditOpen,
    isDetailOpen,
    setIsDetailOpen,
    isPriceHistoryOpen,
    setIsPriceHistoryOpen,
    isStockHistoryOpen,
    setIsStockHistoryOpen,
    isNewCatOpen,
    setIsNewCatOpen,
    editingCategoryId,
    setEditingCategoryId,
    isConfirmHideOpen,
    setIsConfirmHideOpen,
    returnToDetailProductId,
    setReturnToDetailProductId,
    longPressTimer,
    longPressOrigin,
    detailRequestNumber,
    priceHistoryRequestNumber,
    stockHistoryRequestNumber,
    childModalCloseHandler,
    activeProduct,
    setActiveProduct,
    priceHistory,
    setPriceHistory,
    stockHistory,
    setStockHistory,
    priceHistoryError,
    setPriceHistoryError,
    stockHistoryError,
    setStockHistoryError,
    isPriceHistoryLoading,
    setIsPriceHistoryLoading,
    isStockHistoryLoading,
    setIsStockHistoryLoading,
    formName,
    setFormName,
    formCategory,
    setFormCategory,
    formCodePreview,
    setFormCodePreview,
    formUnit,
    setFormUnit,
    formCostPrice,
    setFormCostPrice,
    formSellPrice,
    setFormSellPrice,
    formStock,
    setFormStock,
    formMinStock,
    setFormMinStock,
    formPriceMode,
    setFormPriceMode,
    formBarcode,
    setFormBarcode,
    formExpiryDate,
    setFormExpiryDate,
    formImageFile,
    setFormImageFile,
    formError,
    setFormError,
    addModalBodyRef,
    newCatName,
    setNewCatName,
    newCatError,
    setNewCatError,
    detailError,
    setDetailError,
    isDetailLoading,
    setIsDetailLoading,
    isPending,
    startTransition,
    profitPerItem,
    filteredProducts,
    totalCount,
    resetKey,
    visibleCount,
    visibleProducts,
    refreshProductList,
    activeFilterCount,
    clearFilters,
    loadCodePreview,
    openAddModal,
    handleCategoryChange,
    handleAddSubmit,
    openEditModal,
    handleEditSubmit,
    handleToggleActive,
    confirmToggleActive,
    loadProductDetails,
    loadProductDetailsHandler,
    openDetailsModal,
    closeDetailsModal,
    startLongPress,
    moveLongPress,
    clearLongPress,
    returnToDetails,
    openPriceHistoryModal,
    openStockHistoryModal,
    closeHistoryOrEditAndReturn,
    openEditCategory,
    openNewCategory,
    handleCategorySubmit,
    sentinelRef,
  }
}

export type ProductListModel = ReturnType<typeof useProductList>
