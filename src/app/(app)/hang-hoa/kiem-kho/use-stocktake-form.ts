'use client'

import { useEffect, useRef, useState } from 'react'
import type * as React from 'react'
import { useRouter } from 'next/navigation'
import type { ProductCatalogItem } from '../actions'
import { getProducts } from '../actions'
import { adjustStockAction } from './actions'

const PAGE_SIZE = 30

function formatQuantity(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value)
}

function toInputQuantity(value: number) {
  return String(value).replace('.', ',')
}

export interface StocktakeFormProps {
  initialProducts: ProductCatalogItem[]
  initialTotalCount: number
}

export function useStocktakeForm({ initialProducts, initialTotalCount }: StocktakeFormProps) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null)
  const [actualStock, setActualStock] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const skipFirstLoad = useRef(true)
  const requestId = useRef(0)
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (skipFirstLoad.current) {
      skipFirstLoad.current = false
      return
    }

    const request = ++requestId.current
    let active = true
    setIsLoading(true)
    getProducts({ search: debouncedSearch, filter: 'all', page, pageSize: PAGE_SIZE })
      .then((result) => {
        if (!active || request !== requestId.current) return
        setProducts(result.products)
        setTotalCount(result.totalCount)
        setError('')
      })
      .catch((caught: unknown) => {
        if (active && request === requestId.current) {
          setError(caught instanceof Error ? caught.message : 'Không tải được danh sách hàng hóa.')
        }
      })
      .finally(() => {
        if (active && request === requestId.current) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [debouncedSearch, page])

  function chooseProduct(product: ProductCatalogItem) {
    setSelectedProduct(product)
    setActualStock(toInputQuantity(product.stock))
    setError('')
    setNotice('')
  }

  async function saveActualStock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedProduct) return
    const parsedStock = Number(actualStock.replace(',', '.'))
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      setError('Vui lòng nhập số lượng thực tế bằng 0 hoặc lớn hơn.')
      return
    }

    setIsSaving(true)
    setError('')
    setNotice('')
    try {
      const result = await adjustStockAction({
        productId: selectedProduct.id,
        actualStock: parsedStock,
      })
      if (result.error) {
        setError(result.error)
        return
      }

      const change = result.difference ?? 0
      setSelectedProduct({ ...selectedProduct, stock: parsedStock })
      setActualStock(toInputQuantity(parsedStock))
      setNotice(change === 0
        ? 'Số lượng thực tế đã khớp. Không có chênh lệch.'
        : change > 0
          ? `Đã ghi nhận tăng ${formatQuantity(change)} ${selectedProduct.unit}.`
          : `Đã ghi nhận giảm ${formatQuantity(Math.abs(change))} ${selectedProduct.unit}.`)
      setProducts((current) => current.map((product) =>
        product.id === selectedProduct.id ? { ...product, stock: parsedStock } : product
      ))
      router.refresh()
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không lưu được số lượng kiểm kho.')
    } finally {
      setIsSaving(false)
    }
  }

  return {
    router,
    products,
    setProducts,
    totalCount,
    setTotalCount,
    search,
    setSearch,
    debouncedSearch,
    setDebouncedSearch,
    page,
    setPage,
    selectedProduct,
    setSelectedProduct,
    actualStock,
    setActualStock,
    isLoading,
    setIsLoading,
    isSaving,
    setIsSaving,
    error,
    setError,
    notice,
    setNotice,
    skipFirstLoad,
    requestId,
    pageCount,
    chooseProduct,
    saveActualStock,
    PAGE_SIZE,
    formatQuantity,
  }
}
