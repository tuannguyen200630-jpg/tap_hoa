'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { formatMoney, parseMoney, formatMoneyInput } from '@/lib/money'
import { formatDate } from '@/lib/codes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Package, AlertTriangle, Edit, X, TrendingUp, FolderPlus, ChevronDown, ChevronUp } from 'lucide-react'
import type { ProductListModel } from '../use-product-list'

const QUICK_UNITS = ['cái', 'lon', 'chai', 'gói', 'hộp', 'kg', 'vỉ', 'túi']

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
      <div className="my-8 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gray-800 p-5 max-sm:p-3 text-white">
          <div>
            <h2 className="text-xl max-sm:text-base font-bold sm:text-2xl">{title}</h2>
            <p className="mt-0.5 text-lg max-sm:text-sm text-gray-900">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white hover:text-white"
            aria-label="Quay lại chi tiết hàng hóa"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-5 max-sm:space-y-3 overflow-y-auto p-5 max-sm:p-3 sm:p-6">
          {isLoading && <div className="text-center text-lg max-sm:text-sm text-gray-900" role="status">Đang tải lịch sử...</div>}
          {error && <div className="rounded-lg bg-red-50 p-4 max-sm:p-3 text-lg max-sm:text-sm text-red-800" role="alert">{error}</div>}
          {children}
        </div>

        <div className="flex justify-end border-t border-gray-300 bg-gray-100 p-4 max-sm:p-3">
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

export function ProductMobileView({ model }: { model: ProductListModel }) {
  const { products, categories, search, setSearch, selectedCategory, setSelectedCategory, filterType, setFilterType, priceModeFilter, setPriceModeFilter, sortBy, setSortBy, isFilterExpanded, setIsFilterExpanded, listError, isAddOpen, setIsAddOpen, isAdvancedOptionsOpen, setIsAdvancedOptionsOpen, isEditOpen, isDetailOpen, isPriceHistoryOpen, isStockHistoryOpen, isNewCatOpen, setIsNewCatOpen, editingCategoryId, setEditingCategoryId, isConfirmHideOpen, setIsConfirmHideOpen, activeProduct, priceHistory, stockHistory, priceHistoryError, stockHistoryError, isPriceHistoryLoading, isStockHistoryLoading, formName, setFormName, formCategory, setFormCategory, formCodePreview, formUnit, setFormUnit, formCostPrice, setFormCostPrice, formSellPrice, setFormSellPrice, formStock, setFormStock, formMinStock, setFormMinStock, formPriceMode, setFormPriceMode, formBarcode, setFormBarcode, formExpiryDate, setFormExpiryDate, setFormImageFile, formError, addModalBodyRef, newCatName, setNewCatName, newCatError, detailError, isDetailLoading, isPending, profitPerItem, totalCount, visibleCount, visibleProducts, refreshProductList, activeFilterCount, clearFilters, openAddModal, handleCategoryChange, handleAddSubmit, openEditModal, handleEditSubmit, handleToggleActive, confirmToggleActive, closeDetailsModal, startLongPress, moveLongPress, clearLongPress, openPriceHistoryModal, openStockHistoryModal, closeHistoryOrEditAndReturn, openEditCategory, openNewCategory, handleCategorySubmit, sentinelRef } = model
  const { units, isEditAdvancedOpen, setIsEditAdvancedOpen, isEditCustomUnit, setIsEditCustomUnit } = model

  return (
    <div className="space-y-6 max-sm:space-y-3 pb-20">
      {/* Header & Quick Action */}
      <div className="flex min-w-0 flex-col gap-3 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Danh sách hàng hóa</h1>
          <p className="mt-0.5 text-xs text-gray-900 sm:text-sm">
            Tổng cộng: <strong className="text-blue-950 font-semibold">{totalCount}</strong> món hàng
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Link
            href="/hang-hoa/kiem-kho"
            className="inline-flex w-full min-w-0 items-center justify-center whitespace-nowrap rounded-xl border border-blue-700 px-2 py-2 text-xs font-semibold text-blue-950 hover:bg-blue-50 sm:w-auto sm:px-3 sm:text-sm"
          >
            Kiểm kho
          </Link>
          <Button
            size="sm"
            className="h-12 w-full min-w-0 justify-center whitespace-nowrap rounded-xl bg-green-800 px-2 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-900 sm:w-auto sm:px-3 sm:text-sm"
            onClick={openAddModal}
          >
            <Plus className="h-4 w-4 shrink-0" />
            Thêm món
          </Button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="min-w-0 space-y-3 rounded-2xl border border-gray-300 bg-white p-3 shadow-sm sm:space-y-4 sm:p-5">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
              }}
              placeholder="Tìm tên món, mã..."
              className="h-12 min-w-0 flex-1 rounded-xl border-2 border-gray-300 px-3 py-2 pr-9 text-sm focus:border-blue-700"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('')
                }}
                aria-label="Xóa nội dung tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-900 hover:text-gray-900"
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
                ? 'border-blue-700 bg-blue-50 text-blue-950'
                : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-100'
            }`}
          >
            {isFilterExpanded ? 'Thu gọn' : `Thêm lọc${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
            {isFilterExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          {activeFilterCount > 0 && !isFilterExpanded && (
            <button
              type="button"
              onClick={clearFilters}
              className="hidden min-h-12 shrink-0 items-center rounded-xl px-2 text-base font-semibold text-blue-950 hover:bg-blue-50 sm:inline-flex"
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
              className="min-h-12 rounded-xl px-2 text-base font-semibold text-blue-950 hover:bg-blue-50"
            >
              Xóa lọc
            </button>
          </div>
        )}

        {isFilterExpanded && (
          <div id="product-filters" className="space-y-4 max-sm:space-y-3">
            <div className="grid grid-cols-1 gap-3 max-sm:gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1">
                <span className="block text-base font-semibold text-gray-900">Trạng thái hàng hóa</span>
                <select
                  value={filterType}
                  onChange={(event) => {
                    setFilterType(event.target.value as typeof filterType)
                  }}
                  className="h-[50px] w-full rounded-xl border-2 border-gray-300 bg-white px-4 max-sm:px-3 text-lg max-sm:text-sm text-gray-900 outline-none focus:border-blue-700"
                >
                  <option value="all">Tất cả đang bán</option>
                  <option value="low_stock">Sắp hết hàng</option>
                  <option value="near_expiry">Sắp hết hạn</option>
                  <option value="inactive">Đã ẩn</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="block text-base font-semibold text-gray-900">Nhóm hàng</span>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(event) => {
                      setSelectedCategory(event.target.value)
                    }}
                    className="h-[50px] min-w-0 flex-1 rounded-xl border-2 border-gray-300 bg-white px-4 max-sm:px-3 text-lg max-sm:text-sm text-gray-900 outline-none focus:border-blue-700"
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
                    className="h-[50px] w-[50px] shrink-0 rounded-xl border-2 border-blue-700 text-blue-950 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-900"
                  >
                    <Edit className="mx-auto h-5 w-5" />
                  </button>
                </div>
              </label>

              <label className="space-y-1">
                <span className="block text-base font-semibold text-gray-900">Cách tính giá</span>
                <select
                  value={priceModeFilter}
                  onChange={(event) => {
                    setPriceModeFilter(event.target.value as typeof priceModeFilter)
                  }}
                  className="h-[50px] w-full rounded-xl border-2 border-gray-300 bg-white px-4 max-sm:px-3 text-lg max-sm:text-sm text-gray-900 outline-none focus:border-blue-700"
                >
                  <option value="all">Tất cả cách tính giá</option>
                  <option value="auto">Tự động theo giá nhập</option>
                  <option value="fixed">Giá bán cố định</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="block text-base font-semibold text-gray-900">Sắp xếp theo</span>
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value as typeof sortBy)
                  }}
                  className="h-[50px] w-full rounded-xl border-2 border-gray-300 bg-white px-4 max-sm:px-3 text-lg max-sm:text-sm text-gray-900 outline-none focus:border-blue-700"
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
      {listError && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 max-sm:p-3 text-lg max-sm:text-sm text-red-800" role="alert">
          {listError}
          <Button className="ml-3 min-h-[48px]" onClick={refreshProductList}>Tải lại danh sách</Button>
        </div>
      )}
      {!listError && (products.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-300 shadow-sm">
          <Package className="w-16 h-16 text-gray-900 mx-auto mb-4 max-sm:mb-3" />
          <h3 className="text-xl max-sm:text-base font-bold text-gray-900 mb-2">
            {totalCount === 0 && !search && selectedCategory === 'all' && filterType === 'all'
              ? 'Chưa có món hàng nào'
              : 'Không tìm thấy món hàng nào'}
          </h3>
          <p className="text-gray-900 text-lg max-sm:text-sm max-w-md mx-auto mb-6 max-sm:mb-3">
            {totalCount === 0 && !search && selectedCategory === 'all' && filterType === 'all'
              ? 'Bấm “Thêm món mới” để bắt đầu tạo danh sách hàng hóa cho cửa hàng.'
              : 'Thử đổi từ khóa hoặc bộ lọc. Bạn cũng có thể bấm “Thêm món mới” để tạo hàng hóa.'}
          </p>
          <Button
            size="lg"
            className="bg-green-800 hover:bg-green-900 text-white font-medium text-lg max-sm:text-sm px-8 max-sm:px-3 rounded-xl min-h-[48px]"
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
                <tr className="bg-gray-100 text-gray-900 font-semibold border-b border-gray-300 text-lg max-sm:text-sm">
                  <th className="py-4 max-sm:py-2 px-5 max-sm:px-3">Tên món hàng</th>
                  <th className="py-4 max-sm:py-2 px-4 max-sm:px-3">Nhóm</th>
                  <th className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-center">Còn trong kho</th>
                  <th className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-right">Giá nhập</th>
                  <th className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-right">Giá bán</th>
                  <th className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-right">Lãi mỗi cái</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 text-lg max-sm:text-sm">
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
                        !p.is_active ? 'bg-gray-100/80 opacity-75' : ''
                      }`}
                    >
                      <td className="py-4 max-sm:py-2 px-5 max-sm:px-3">
                        <div className="font-bold text-gray-900 text-lg max-sm:text-sm">{p.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gray-900 text-lg max-sm:text-sm">ĐVT: {p.unit}</span>
                          {p.expiry_date && (
                            <span className="text-purple-900 text-lg max-sm:text-sm bg-purple-50 px-2 py-0.5 rounded">
                              HSD: {formatDate(p.expiry_date)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-gray-900">
                        {p.category?.name || 'Chưa phân nhóm'}
                      </td>
                      <td className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-center">
                        <div
                          className={`inline-block font-bold px-3 py-1 rounded-full text-lg max-sm:text-sm ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-900'
                              : isLow
                              ? 'bg-amber-100 text-amber-950'
                              : 'bg-emerald-100 text-green-900'
                          }`}
                        >
                          {Number(p.stock)} {p.unit}
                        </div>
                        {isLow && !isOutOfStock && (
                          <div className="text-amber-950 text-lg max-sm:text-sm mt-0.5">Sắp hết hàng</div>
                        )}
                        {isOutOfStock && (
                          <div className="text-red-800 text-lg max-sm:text-sm mt-0.5 font-semibold">Hết hàng</div>
                        )}
                      </td>
                      <td className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-right text-gray-900 font-medium">
                        {formatMoney(p.last_cost)}
                      </td>
                      <td className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-right font-bold text-gray-900 text-lg max-sm:text-sm">
                        {formatMoney(p.sell_price)}
                      </td>
                      <td className="py-4 max-sm:py-2 px-4 max-sm:px-3 text-right">
                        <span
                          className={`font-semibold ${
                            profit < 0 ? 'text-red-800' : 'text-green-900'
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
                          <span className="text-xs text-slate-700">{p.category?.name || 'Chưa phân nhóm'}</span>
                          {p.expiry_date && (
                            <span className="inline-flex items-center whitespace-nowrap rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-900">
                              HSD: {formatDate(p.expiry_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold ${
                          isOutOfStock
                            ? 'bg-red-100 text-red-900'
                            : isLow
                            ? 'bg-amber-100 text-amber-950'
                            : 'bg-emerald-100 text-green-900'
                        }`}
                      >
                        {Number(p.stock)} {p.unit}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-3 divide-x divide-slate-400 rounded-lg bg-slate-50 px-2 py-1.5 text-center">
                    <div className="min-w-0">
                      <div className="text-[12px] text-slate-700">Giá nhập</div>
                      <div className="whitespace-nowrap text-xs font-semibold text-slate-700">{formatMoney(p.last_cost)}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] text-slate-700">Giá bán</div>
                      <div className="whitespace-nowrap text-sm font-bold text-blue-950">{formatMoney(p.sell_price)}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] text-slate-700">Lãi</div>
                      <div
                        className={`whitespace-nowrap text-xs font-semibold ${
                          profit < 0 ? 'text-red-800' : 'text-emerald-900'
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
        <div ref={sentinelRef} className="min-h-10 rounded-xl bg-white p-4 max-sm:p-3 text-center text-lg max-sm:text-sm text-gray-900" aria-live="polite">
          Cuộn để xem thêm hàng hóa...
        </div>
      )}

      {/* MODAL THÊM HÀNG MỚI */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90dvh] sm:max-w-lg sm:rounded-2xl">
            <header className="flex shrink-0 items-center justify-between bg-blue-800 p-4 max-sm:p-3 text-white">
              <div>
                <h2 className="text-xl max-sm:text-base font-bold">Thêm món mới</h2>
                <p className="mt-0.5 text-sm text-blue-100">Điền thông tin để đưa vào bán hàng</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-white hover:bg-white/10 hover:text-white"
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
                <div className="mb-4 max-sm:mb-3 flex items-center gap-2 rounded-xl border-2 border-red-300 bg-red-50 p-3.5 text-base text-red-800" role="alert">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-800" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="mb-4 max-sm:mb-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label className="text-base font-semibold text-gray-900">Nhóm hàng *</label>
                    <button
                      type="button"
                      onClick={openNewCategory}
                      className="flex min-h-12 items-center gap-1 rounded-lg px-2 text-base font-semibold text-blue-950 hover:bg-blue-50 hover:text-blue-950"
                    >
                      <FolderPlus className="h-4 w-4" />
                      + Thêm nhóm
                    </button>
                  </div>
                  <select
                    value={formCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="h-12 w-full rounded-xl border-2 border-gray-300 bg-white px-3 text-base focus:border-blue-700"
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
                <label className="mb-1.5 block text-base font-semibold text-gray-900">
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
                <label className="mb-1.5 block text-base font-semibold text-gray-900">
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
                          ? 'bg-blue-800 text-white'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
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
                  <label className="mb-1.5 block text-base font-semibold text-gray-900">
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
                  <label className="mb-1.5 block text-base font-semibold text-gray-900">
                    Giá bán (đ) *
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatMoneyInput(formSellPrice)}
                    onChange={(e) => setFormSellPrice(parseMoney(e.target.value))}
                    placeholder="13.000"
                    className="px-2 text-base font-bold text-blue-950"
                    required
                  />
                </div>
              </div>

              <div
                className={`mb-4 max-sm:mb-3 flex items-center justify-between rounded-xl border-2 p-4 max-sm:p-3 ${
                  profitPerItem >= 0
                    ? 'bg-emerald-100 border-emerald-400 text-green-900'
                    : 'bg-red-50 border-red-300 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className={`h-5 w-5 ${profitPerItem >= 0 ? 'text-green-900' : 'text-red-800'}`} />
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
                className="flex min-h-12 w-full items-center justify-between gap-3 max-sm:gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-100 px-4 max-sm:px-3 py-2 text-left text-base font-semibold text-gray-900 hover:bg-gray-100"
              >
                <span>
                  <span className="block">Tùy chọn nâng cao</span>
                  <span className="mt-0.5 block text-sm font-normal text-gray-900">
                    Ảnh, hạn sử dụng, mã vạch, số lượng ban đầu...
                  </span>
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${isAdvancedOptionsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAdvancedOptionsOpen && (
                <div id="add-product-advanced-options" className="mt-4 max-sm:mt-3 space-y-4 max-sm:space-y-3">
                  <div className="grid grid-cols-1 gap-4 max-sm:gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-base font-semibold text-gray-900">
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
                      <label className="mb-1.5 block text-base font-semibold text-gray-900">
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
                    <label className="mb-1.5 block text-base font-semibold text-gray-900">
                      Cách tính giá khi nhập hàng mới
                    </label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setFormPriceMode('auto')}
                        className={`min-h-12 rounded-xl border-2 p-3 text-left transition-all ${
                          formPriceMode === 'auto'
                            ? 'border-blue-700 bg-blue-100 text-blue-950'
                            : 'border-gray-300 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-base font-bold">Tự đề xuất giá</div>
                        <div className="mt-0.5 text-sm text-gray-900">
                          Giá nhập thay đổi thì đề xuất giá bán tương ứng
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormPriceMode('fixed')}
                        className={`min-h-12 rounded-xl border-2 p-3 text-left transition-all ${
                          formPriceMode === 'fixed'
                            ? 'border-blue-700 bg-blue-100 text-blue-950'
                            : 'border-gray-300 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-base font-bold">Giữ giá cố định</div>
                        <div className="mt-0.5 text-sm text-gray-900">
                          Không đề xuất đổi giá khi nhập hàng mới
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-sm:gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-base font-semibold text-gray-900">
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
                      <label className="mb-1.5 block text-base font-semibold text-gray-900">
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
                    <label className="mb-1.5 block text-base font-semibold text-gray-900">
                      Ảnh hàng hóa (không bắt buộc)
                    </label>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => setFormImageFile(e.target.files?.[0] ?? null)}
                      className="h-auto min-h-12 text-base"
                    />
                    <p className="mt-1 text-sm text-gray-900">Ảnh JPG, PNG hoặc WebP, tối đa 5 MB.</p>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-base font-semibold text-gray-900">
                      Mã hàng (tự sinh)
                    </label>
                    <Input
                      value={formCodePreview}
                      readOnly
                      placeholder={formCategory ? 'Đang tạo mã...' : 'Chọn nhóm hàng trước'}
                      className="bg-gray-100 font-mono font-bold text-gray-900"
                    />
                  </div>
                </div>
              )}
              </div>

              <footer className="flex shrink-0 gap-3 max-sm:gap-2 border-t border-gray-300 bg-white p-3">
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
                  className="min-h-12 flex-1 rounded-xl bg-green-800 px-4 max-sm:px-3 text-base font-bold text-white shadow-md hover:bg-green-900"
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
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-hidden bg-black/60 p-3 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeHistoryOrEditAndReturn()
          }}
        >
          <div className="flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-2xl">
            <header className="flex shrink-0 items-center justify-between bg-blue-800 p-5 text-white max-sm:p-3">
              <div>
                <h2 className="text-2xl max-sm:text-lg font-bold">Sửa món hàng</h2>
                <p className="text-blue-100 text-lg max-sm:text-sm mt-0.5">Mã hàng: {activeProduct.code}</p>
              </div>
              <button
                type="button"
                onClick={closeHistoryOrEditAndReturn}
                className="text-white hover:text-white p-2 rounded-lg"
                aria-label="Quay lại chi tiết hàng hóa"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            <form onSubmit={handleEditSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-6 max-sm:space-y-3 max-sm:p-3">
              {formError && (
                <div className="bg-red-50 border-2 border-red-300 text-red-800 p-3.5 rounded-xl text-lg max-sm:text-sm flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-800" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nhóm hàng */}
              <div>
                <label className="block font-semibold text-gray-900 text-lg max-sm:text-sm mb-1.5">
                  Nhóm hàng *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full h-12 px-3 border-2 border-gray-300 rounded-xl text-lg max-sm:text-sm bg-white focus:border-blue-700"
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
                <label className="block font-semibold text-gray-900 text-lg max-sm:text-sm mb-1.5">
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
                <label className="block font-semibold text-gray-900 text-lg max-sm:text-sm mb-1.5">
                  Đơn vị tính *
                </label>
                <select
                  value={isEditCustomUnit ? '__edit_custom_unit__' : formUnit}
                  onChange={(e) => {
                    if (e.target.value === '__edit_custom_unit__') {
                      setFormUnit('')
                      setIsEditCustomUnit(true)
                    } else {
                      setFormUnit(e.target.value)
                      setIsEditCustomUnit(false)
                    }
                  }}
                  aria-label="Đơn vị tính"
                  className="w-full h-12 px-3 border-2 border-gray-300 rounded-xl text-lg max-sm:text-sm bg-white focus:border-blue-700"
                  required
                >
                  {Array.from(new Set([...QUICK_UNITS, ...units])).map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                  {activeProduct.unit && !units.includes(activeProduct.unit) && !QUICK_UNITS.includes(activeProduct.unit) && (
                    <option value={activeProduct.unit}>{activeProduct.unit}</option>
                  )}
                  <option value="__edit_custom_unit__">Khác (nhập đơn vị)</option>
                </select>
                {isEditCustomUnit && (
                  <Input
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="mt-2 text-lg max-sm:text-sm"
                    placeholder="Nhập đơn vị tính khác..."
                    aria-label="Nhập đơn vị tính khác"
                    required
                  />
                )}
              </div>

              {/* Giá nhập & Giá bán */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-sm:gap-2">
                <div>
                  <label className="block font-semibold text-gray-900 text-lg max-sm:text-sm mb-1.5">
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
                  <label className="block font-semibold text-gray-900 text-lg max-sm:text-sm mb-1.5">
                    Giá bán đang áp dụng (đ)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatMoneyInput(formSellPrice)}
                    onChange={(e) => setFormSellPrice(parseMoney(e.target.value))}
                    className="text-lg max-sm:text-sm font-bold text-blue-950"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-700 p-4 max-sm:p-3 rounded-xl flex justify-between items-center text-blue-950">
                <span className="font-medium text-lg max-sm:text-sm">Lãi mỗi {formUnit || 'đơn vị'} hiện tại:</span>
                <span className="text-xl max-sm:text-base font-bold">{formatMoney(profitPerItem)}</span>
              </div>

              <button
                type="button"
                onClick={() => setIsEditAdvancedOpen((open) => !open)}
                aria-expanded={isEditAdvancedOpen}
                aria-controls="edit-product-advanced-options"
                className="flex min-h-12 w-full items-center justify-between rounded-xl border border-dashed border-gray-300 bg-gray-100 px-4 py-2 text-left text-base font-semibold text-gray-900 hover:bg-gray-100 max-sm:px-3"
              >
                <span>Nâng cao</span>
                <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${isEditAdvancedOpen ? 'rotate-180' : ''}`} />
              </button>

              {isEditAdvancedOpen && (
                <div id="edit-product-advanced-options" className="space-y-4 max-sm:space-y-3">
                  <div>
                    <label className="block font-semibold text-gray-900 text-lg max-sm:text-sm mb-1.5">
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
                    <p className="mt-1 text-lg max-sm:text-sm text-gray-900">Chọn ảnh mới nếu muốn thay ảnh hiện tại.</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-900 text-lg max-sm:text-sm mb-1.5">
                      Cách tính giá khi nhập hàng mới
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormPriceMode('auto')}
                        className={`p-3 min-h-[48px] rounded-xl text-left border-2 transition-all ${
                          formPriceMode === 'auto'
                            ? 'border-blue-700 bg-blue-100 text-blue-950'
                            : 'border-gray-300 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-bold text-lg max-sm:text-sm">Tự đề xuất giá</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormPriceMode('fixed')}
                        className={`p-3 min-h-[48px] rounded-xl text-left border-2 transition-all ${
                          formPriceMode === 'fixed'
                            ? 'border-blue-700 bg-blue-100 text-blue-950'
                            : 'border-gray-300 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-bold text-lg max-sm:text-sm">Giữ giá cố định</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-900 text-lg max-sm:text-sm mb-1.5">
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
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-900 text-lg max-sm:text-sm mb-1.5">
                  Hạn sử dụng
                </label>
                <Input type="date" value={formExpiryDate} onChange={(e) => setFormExpiryDate(e.target.value)} />
              </div>
              </div>

              <footer className="flex shrink-0 justify-end gap-3 border-t border-gray-300 p-4 max-sm:gap-2 max-sm:p-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={closeHistoryOrEditAndReturn}
                  className="min-h-[48px] flex-1 rounded-xl px-3 text-sm sm:flex-none sm:px-6 sm:text-lg"
                >
                  Quay lại chi tiết
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isPending}
                  className="min-h-[48px] flex-1 rounded-xl bg-blue-800 px-3 text-sm font-bold text-white shadow-md hover:bg-blue-900 sm:flex-none sm:px-8 sm:text-lg"
                >
                  {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT HÀNG HÓA */}
      {isDetailOpen && activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 max-sm:p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-2xl">
            <div className="bg-gray-800 text-white p-5 max-sm:p-3 flex justify-between items-center">
              <div>
                <h2 className="text-xl max-sm:text-base sm:text-2xl font-bold">{activeProduct.name}</h2>
                <p className="text-gray-900 text-lg max-sm:text-sm mt-0.5">
                  Mã: {activeProduct.code} • Còn trong kho: {Number(activeProduct.stock)}{' '}
                  {activeProduct.unit}
                </p>
              </div>
              <button
                onClick={() => closeDetailsModal()}
                className="text-white hover:text-white p-2 rounded-lg"
                aria-label="Đóng chi tiết hàng hóa"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 max-sm:space-y-3 overflow-y-auto p-4 max-sm:p-3 sm:p-5">
              {isDetailLoading && (
                <div className="text-center text-lg max-sm:text-sm text-gray-900" role="status">Đang tải chi tiết hàng hóa…</div>
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
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-sm:gap-2 bg-blue-50/60 p-4 max-sm:p-3 rounded-xl border border-blue-700 text-center">
                <div>
                  <div className="text-lg max-sm:text-sm text-gray-900">Lãi mỗi cái</div>
                  <div className={`font-bold text-lg max-sm:text-sm ${activeProduct.sell_price - activeProduct.last_cost < 0 ? 'text-red-800' : 'text-green-900'}`}>
                    {formatMoney(activeProduct.sell_price - activeProduct.last_cost)}
                  </div>
                </div>
                <div>
                  <div className="text-lg max-sm:text-sm text-gray-900">Mốc giá nhập</div>
                  <div className="font-bold text-gray-900 text-lg max-sm:text-sm">
                    {formatMoney(activeProduct.base_cost)}
                  </div>
                </div>
                <div>
                  <div className="text-lg max-sm:text-sm text-gray-900">Mốc giá bán</div>
                  <div className="font-bold text-gray-900 text-lg max-sm:text-sm">
                    {formatMoney(activeProduct.base_price)}
                  </div>
                </div>
                <div>
                  <div className="text-lg max-sm:text-sm text-gray-900">Giá vốn trung bình</div>
                  <div className="font-bold text-gray-900 text-lg max-sm:text-sm">
                    {formatMoney(activeProduct.avg_cost)}
                  </div>
                </div>
                <div>
                  <div className="text-lg max-sm:text-sm text-gray-900">Giá bán hiện tại</div>
                  <div className="font-bold text-blue-950 text-lg max-sm:text-sm">
                    {formatMoney(activeProduct.sell_price)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 max-sm:gap-2 text-base sm:text-lg">
                <div className="rounded-xl border border-gray-300 p-4 max-sm:p-3">
                  <div className="text-gray-900">Mã hàng</div>
                  <div className="font-semibold">{activeProduct.code}</div>
                </div>
                <div className="rounded-xl border border-gray-300 p-4 max-sm:p-3">
                  <div className="text-gray-900">Nhóm hàng</div>
                  <div className="font-semibold">{activeProduct.category?.name || 'Chưa phân nhóm'}</div>
                </div>
                <div className="rounded-xl border border-gray-300 p-4 max-sm:p-3">
                  <div className="text-gray-900">Đơn vị tính</div>
                  <div className="font-semibold">{activeProduct.unit}</div>
                </div>
                <div className="rounded-xl border border-gray-300 p-4 max-sm:p-3">
                  <div className="text-gray-900">Mã vạch</div>
                  <div className="font-semibold">{activeProduct.barcode || 'Chưa có'}</div>
                </div>
                <div className="rounded-xl border border-gray-300 p-4 max-sm:p-3">
                  <div className="text-gray-900">Hạn sử dụng</div>
                  <div className="font-semibold">
                    {activeProduct.expiry_date ? formatDate(activeProduct.expiry_date) : 'Chưa khai báo'}
                  </div>
                  <div className="mt-1 text-base text-gray-900">Hiển thị hạn của lô sắp hết hạn sớm nhất</div>
                </div>
                <div className="rounded-xl border border-gray-300 p-4 max-sm:p-3">
                  <div className="text-gray-900">Ngưỡng báo sắp hết</div>
                  <div className="font-semibold">
                    {activeProduct.min_stock} {activeProduct.unit}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-300 p-4 max-sm:p-3">
                  <div className="text-gray-900">Cách tính giá</div>
                  <div className="font-semibold">
                    {activeProduct.price_mode === 'auto' ? 'Tự động theo giá nhập' : 'Giá bán cố định'}
                  </div>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-gray-300 bg-gray-100 p-3">
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
              <TrendingUp className="h-5 w-5 text-blue-950" />
              Thay đổi giá nhập và giá bán
            </h3>
            {priceHistory?.length ? (
              <div className="space-y-3">
                {priceHistory.map((history) => (
                  <article key={history.id} className="rounded-xl border border-gray-300 p-4 max-sm:p-3 text-lg max-sm:text-sm">
                    <p className="font-bold text-gray-900">{formatDate(history.created_at)}</p>
                    <p className="text-gray-900">Người đổi: {history.changed_by_name || 'Chưa ghi nhận'}</p>
                    <p className="mt-2 text-gray-900">
                      Giá nhập: {formatMoney(history.old_cost)} → <strong>{formatMoney(history.new_cost)}</strong>
                    </p>
                    <p className="text-gray-900">
                      Giá bán: {formatMoney(history.old_price)} → <strong className="text-blue-950">{formatMoney(history.new_price)}</strong>
                    </p>
                  </article>
                ))}
              </div>
            ) : !isPriceHistoryLoading && !priceHistoryError ? (
              <p className="text-lg max-sm:text-sm italic text-gray-900">Chưa có thay đổi giá nào được ghi nhận.</p>
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
              <Package className="h-5 w-5 text-green-900" />
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
                    <article key={movement.id} className="rounded-xl border border-gray-300 p-4 max-sm:p-3 text-lg max-sm:text-sm">
                      <div className="flex justify-between gap-3 max-sm:gap-2">
                        <strong className="text-gray-900">{typeLabel}</strong>
                        <strong className={isPlus ? 'text-green-900' : 'text-red-800'}>
                          {isPlus ? '+' : ''}{movement.quantity}
                        </strong>
                      </div>
                      <p className="text-gray-900">{formatDate(movement.created_at)}</p>
                      <p className="text-gray-900">
                        Còn trong kho sau đó: <strong>{movement.balance_after}</strong>
                      </p>
                      {movement.note && <p className="break-words text-gray-900">Ghi chú: {movement.note}</p>}
                    </article>
                  )
                })}
              </div>
            ) : !isStockHistoryLoading && !stockHistoryError ? (
              <p className="text-lg max-sm:text-sm italic text-gray-900">Chưa có biến động kho.</p>
            ) : null}
          </section>
        </HistoryModalFrame>
      )}

      {/* MODAL THÊM / SỬA NHÓM HÀNG */}
      {isNewCatOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 max-sm:p-3 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleCategorySubmit}
            className="bg-white rounded-2xl w-full max-w-md p-6 max-sm:p-3 shadow-2xl border border-gray-300 space-y-4 max-sm:space-y-3"
          >
            <h3 className="text-xl max-sm:text-base font-bold text-gray-900">
              {editingCategoryId ? 'Sửa nhóm hàng' : 'Thêm nhóm hàng mới'}
            </h3>
            {newCatError && (
              <div className="text-red-800 text-lg max-sm:text-sm bg-red-50 p-2.5 rounded-lg" role="alert">{newCatError}</div>
            )}
            <div>
              <label className="block text-lg max-sm:text-sm font-semibold text-gray-900 mb-1">
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
                className="bg-blue-800 text-white min-h-[48px] font-semibold"
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
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-sm:p-3 shadow-2xl border border-gray-300 space-y-5 max-sm:space-y-3">
            <div className="flex items-center gap-3 max-sm:gap-2 text-amber-950">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h3 className="text-xl max-sm:text-base font-bold text-gray-900">
                {activeProduct.is_active ? 'Ẩn món hàng?' : 'Hiện lại món hàng?'}
              </h3>
            </div>
            <p className="text-lg max-sm:text-sm text-gray-900 leading-relaxed">
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
                    ? 'bg-red-800 hover:bg-red-900'
                    : 'bg-green-800 hover:bg-green-900'
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
