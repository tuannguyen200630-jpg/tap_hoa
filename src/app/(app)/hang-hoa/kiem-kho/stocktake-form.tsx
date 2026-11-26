'use client'

import { useEffect, useRef, useState } from 'react'
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

export function StocktakeForm({
  initialProducts,
  initialTotalCount,
}: {
  initialProducts: ProductCatalogItem[]
  initialTotalCount: number
}) {
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

  return (
    <section className="space-y-6 max-sm:space-y-3">
      <header>
        <h1 className="text-3xl max-sm:text-lg font-bold text-gray-950">Kiểm kho</h1>
        <p className="mt-1 text-gray-700">Đếm hàng thực tế rồi ghi lại số lượng đang có trong kho.</p>
      </header>

      <label className="block font-semibold text-gray-900">
        Tìm mặt hàng theo tên, mã hàng hoặc mã vạch
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Ví dụ: Cà phê hoặc NGK001"
          className="mt-1 min-h-11 w-full rounded-lg border border-gray-400 bg-white px-3 py-2 text-sm font-normal"
        />
      </label>

      {isLoading && <p role="status" className="text-gray-700">Đang tìm hàng hóa…</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 max-sm:p-3 text-red-900">{error}</p>}

      {!isLoading && products.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 max-sm:p-3 text-center">
          <h2 className="text-xl max-sm:text-base font-semibold text-gray-950">Không tìm thấy mặt hàng</h2>
          <p className="mt-2 text-gray-700">Thử tìm bằng tên, mã hàng hoặc mã vạch khác.</p>
        </div>
      )}

      {products.length > 0 && (
        <div className="space-y-3">
          <ul className="space-y-2">
            {products.map((product) => (
              <li
                key={product.id}
                className={`flex flex-col gap-3 max-sm:gap-2 rounded-xl border bg-white p-4 max-sm:p-3 sm:flex-row sm:items-center sm:justify-between ${
                  selectedProduct?.id === product.id ? 'border-blue-700 ring-2 ring-blue-200' : 'border-gray-300'
                }`}
              >
                <div>
                  <p className="font-bold text-gray-950">{product.name} <span className="font-normal text-gray-700">({product.code})</span></p>
                  <p className="mt-1 text-gray-700">
                    Còn trong kho: {formatQuantity(product.stock)} {product.unit}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => chooseProduct(product)}
                  className="rounded-lg border border-blue-700 px-5 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-blue-800 hover:bg-blue-50"
                >
                  {selectedProduct?.id === product.id ? 'Đang chọn' : 'Chọn mặt hàng'}
                </button>
              </li>
            ))}
          </ul>

          {totalCount > PAGE_SIZE && (
            <nav className="flex flex-wrap items-center justify-between gap-3 max-sm:gap-2" aria-label="Chuyển trang hàng hóa">
              <p className="text-gray-700">Trang {page} / {pageCount}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-gray-400 px-4 max-sm:px-3 py-3 max-sm:py-2 font-semibold disabled:opacity-50"
                >
                  Trang trước
                </button>
                <button
                  type="button"
                  disabled={page >= pageCount || isLoading}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-gray-400 px-4 max-sm:px-3 py-3 max-sm:py-2 font-semibold disabled:opacity-50"
                >
                  Trang sau
                </button>
              </div>
            </nav>
          )}
        </div>
      )}

      {selectedProduct && (
        <form onSubmit={saveActualStock} className="space-y-4 max-sm:space-y-3 rounded-xl border border-blue-300 bg-blue-50 p-5 max-sm:p-3">
          <h2 className="text-2xl max-sm:text-lg font-bold text-gray-950">
            Đếm thực tế: {selectedProduct.name}
          </h2>
          <p className="text-gray-800">
            Số lượng trên hệ thống: <strong>{formatQuantity(selectedProduct.stock)} {selectedProduct.unit}</strong>
          </p>
          <label className="block font-semibold text-gray-900">
            Số lượng đếm được
            <input
              required
              inputMode="decimal"
              value={actualStock}
              onChange={(event) => setActualStock(event.target.value.replace(/[^\d.,]/g, ''))}
              placeholder="Ví dụ: 12 hoặc 1,5"
              className="mt-1 min-h-14 w-full rounded-lg border border-gray-400 bg-white px-4 max-sm:px-3 py-3 max-sm:py-2 text-2xl max-sm:text-lg font-bold sm:max-w-sm"
            />
            <span className="mt-1 block font-normal text-gray-700">
              Có thể nhập số lẻ, tối đa 3 chữ số thập phân.
            </span>
          </label>
          {notice && <p role="status" className="text-green-900">{notice}</p>}
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-blue-700 px-5 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? 'Đang lưu…' : 'Lưu kết quả kiểm kho'}
          </button>
        </form>
      )}
    </section>
  )
}
