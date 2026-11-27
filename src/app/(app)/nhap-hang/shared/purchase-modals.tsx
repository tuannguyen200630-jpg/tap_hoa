import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatMoney, formatMoneyInput, parseMoney } from '@/lib/money'
import { isPriceBelowOrEqualCost } from '@/lib/pricing'
import type { usePurchaseForm } from '../use-purchase-form'

export function PurchaseModals({ model }: { model: ReturnType<typeof usePurchaseForm> }) {
  const { showPriceModal, priceChanges, priceConfirmValues, setPriceConfirmValues, lossConfirmations, setLossConfirmations, isPending, handleConfirmPrice, handleKeepOldPrice, showQuickAdd, setShowQuickAdd, handleQuickAddSubmit, qaError, qaName, setQaName, qaCategory, setQaCategory, categories, qaUnit, setQaUnit, qaCost, setQaCost, qaSell, setQaSell } = model

  return (
    <>
      {/* ————————————————————————————————————
          MODAL XÁC NHẬN ĐỔI GIÁ SAU NHẬP HÀNG
         ———————————————————————————————————— */}
      {showPriceModal && priceChanges.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 max-sm:p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 border border-gray-300">
            <div className="bg-amber-900 text-white p-5 max-sm:p-3">
              <h2 className="text-2xl max-sm:text-lg font-bold flex items-center gap-3 max-sm:gap-2">
                <AlertTriangle className="w-7 h-7" />
                Giá nhập thay đổi — Xác nhận giá bán mới
              </h2>
              <p className="text-amber-100 text-sm mt-1">
                Có {priceChanges.length} món cần xem xét. Hãy kiểm tra và chọn giá bán cho từng món.
              </p>
            </div>

            <div className="p-6 max-sm:p-3 space-y-6 max-sm:space-y-3 max-h-[70vh] overflow-y-auto">
              {priceChanges.map((pc) => {
                const costDiff = pc.new_cost - pc.old_cost
                const isIncrease = costDiff > 0
                const confirmedPrice = priceConfirmValues[pc.product_id] ?? pc.suggested_price
                const isBelowCost = isPriceBelowOrEqualCost(confirmedPrice, pc.new_cost)
                const oldPriceIsBelowCost = isPriceBelowOrEqualCost(pc.old_price, pc.new_cost)
                const needsLossConfirmation = isBelowCost || oldPriceIsBelowCost
                const lossConfirmed = lossConfirmations[pc.product_id] === true

                return (
                  <div
                    key={pc.product_id}
                    className="border-2 border-gray-300 rounded-2xl p-5 max-sm:p-3 space-y-4 max-sm:space-y-3"
                  >
                    <div className="flex items-start gap-3 max-sm:gap-2">
                      {isIncrease ? (
                        <ArrowUpCircle className="w-8 h-8 text-red-800 shrink-0 mt-0.5" />
                      ) : (
                        <ArrowDownCircle className="w-8 h-8 text-green-900 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl max-sm:text-base font-bold text-gray-900">{pc.product_name}</h3>
                        <div
                          className={`text-lg max-sm:text-sm font-semibold mt-1 ${
                            isIncrease ? 'text-red-800' : 'text-green-900'
                          }`}
                        >
                          Giá nhập {isIncrease ? 'TĂNG' : 'GIẢM'}{' '}
                          {formatMoney(Math.abs(costDiff))}
                          <span className="text-gray-900 font-normal text-base ml-2">
                            ({formatMoney(pc.old_cost)} → {formatMoney(pc.new_cost)})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Giá đề xuất */}
                    <div className="bg-blue-50 border border-blue-700 rounded-xl p-4 max-sm:p-3">
                      <div className="text-sm text-blue-950 font-medium">Giá bán đề xuất mới:</div>
                      <div className="whitespace-nowrap text-base font-bold text-blue-950 sm:text-lg">
                        {formatMoney(pc.suggested_price)}
                        <span className="text-base font-normal text-gray-900 ml-2">
                          (hiện tại: {formatMoney(pc.old_price)})
                        </span>
                      </div>
                    </div>

                    {/* Ô sửa giá */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1">
                        Giá bán mới (đ) — có thể sửa:
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatMoneyInput(confirmedPrice)}
                        onChange={(e) =>
                          {
                            setPriceConfirmValues((prev) => ({
                              ...prev,
                              [pc.product_id]: parseMoney(e.target.value),
                            }))
                            setLossConfirmations((prev) => ({
                              ...prev,
                              [pc.product_id]: false,
                            }))
                          }
                        }
                        className="text-xl max-sm:text-base font-bold h-14 text-blue-950"
                      />
                    </div>

                    {/* Cảnh báo bán lỗ */}
                    {needsLossConfirmation && (
                      <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 max-sm:p-3 flex items-start gap-3 max-sm:gap-2">
                        <ShieldAlert className="w-7 h-7 text-red-800 shrink-0" />
                        <div>
                          <div className="text-red-800 font-bold text-xl max-sm:text-base">
                            ⚠️ CẢNH BÁO: Giá bán thấp hơn hoặc bằng giá nhập!
                          </div>
                          <div className="text-red-800 text-base mt-1">
                          {isBelowCost && <>Giá bán đang chọn {formatMoney(confirmedPrice)} không cao hơn giá nhập {formatMoney(pc.new_cost)}.</>}
                          {isBelowCost && oldPriceIsBelowCost && ' '}
                          {oldPriceIsBelowCost && <>Giữ giá cũ {formatMoney(pc.old_price)} cũng không cao hơn giá nhập mới.</>}
                          {' '}Hãy xác nhận riêng nếu vẫn muốn áp dụng.
                          </div>
                          <label className="mt-3 flex items-center gap-3 max-sm:gap-2 text-red-900 font-bold text-base">
                            <input
                              type="checkbox"
                              checked={lossConfirmed}
                              onChange={(e) =>
                                setLossConfirmations((prev) => ({
                                  ...prev,
                                  [pc.product_id]: e.target.checked,
                                }))
                              }
                              className="w-6 h-6 accent-red-700"
                            />
                            Tôi đã hiểu lựa chọn giá không cao hơn giá nhập
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Nút hành động */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <Button
                        onClick={() => handleConfirmPrice(pc, confirmedPrice)}
                        disabled={isPending || (needsLossConfirmation && !lossConfirmed)}
                        className="flex-1 h-14 text-lg max-sm:text-sm font-bold bg-blue-800 hover:bg-blue-900 text-white rounded-xl"
                      >
                        {isPending ? 'Đang lưu...' : 'Đồng ý đổi giá'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleKeepOldPrice(pc)}
                        disabled={isPending || (needsLossConfirmation && !lossConfirmed)}
                        className="flex-1 h-14 text-lg max-sm:text-sm font-medium rounded-xl border-2"
                      >
                        Giữ giá cũ ({formatMoney(pc.old_price)})
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ————————————————————————————————————
          MODAL TẠO NHANH HÀNG MỚI
         ———————————————————————————————————— */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90dvh] sm:max-w-lg sm:rounded-2xl">
            <header className="flex shrink-0 items-center justify-between bg-green-800 p-4 max-sm:p-3 text-white">
              <div>
                <h2 className="text-xl max-sm:text-base font-bold">Tạo nhanh hàng hóa</h2>
                <p className="text-green-100 text-sm mt-0.5">Tạo xong sẽ tự thêm vào phiếu nhập</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-white hover:bg-white/10 hover:text-white"
                aria-label="Đóng cửa sổ tạo nhanh hàng hóa"
              >
                <X className="h-6 w-6" />
              </button>
            </header>

            <form onSubmit={handleQuickAddSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 max-sm:space-y-3 overflow-y-auto overscroll-contain scroll-smooth p-4 max-sm:p-3">
              {qaError && (
                <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-xl text-sm">
                  {qaError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Tên món hàng *
                </label>
                <Input
                  value={qaName}
                  onChange={(e) => setQaName(e.target.value)}
                  placeholder="Ví dụ: Nước ngọt Pepsi 330ml"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Nhóm hàng *
                </label>
                <select
                  value={qaCategory}
                  onChange={(e) => setQaCategory(e.target.value)}
                  className="w-full h-12 px-3 border-2 border-gray-300 rounded-xl text-base bg-white focus:border-blue-700"
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

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Đơn vị tính
                </label>
                <Input
                  value={qaUnit}
                  onChange={(e) => setQaUnit(e.target.value)}
                  placeholder="cái, lon, chai, kg..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3 max-sm:gap-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Giá nhập (đ)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatMoneyInput(qaCost)}
                    onChange={(e) => setQaCost(parseMoney(e.target.value))}
                    className="font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Giá bán (đ)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatMoneyInput(qaSell)}
                    onChange={(e) => setQaSell(parseMoney(e.target.value))}
                    className="font-bold text-blue-950"
                  />
                </div>
              </div>

              {qaSell > 0 && qaCost > 0 && (
                <div
                  className={`p-3 rounded-xl text-center font-medium ${
                    qaSell > qaCost
                      ? 'bg-emerald-100 border border-emerald-400 text-green-900'
                      : 'bg-red-50 border border-red-300 text-red-800'
                  }`}
                >
                  Lãi mỗi {qaUnit}: {formatMoney(qaSell - qaCost)}
                </div>
              )}

              </div>
              <footer className="flex shrink-0 gap-2 border-t border-gray-300 bg-white p-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuickAdd(false)}
                  className="min-h-12 flex-1"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="min-h-12 flex-1 bg-green-800 px-4 max-sm:px-3 font-bold text-white hover:bg-green-900"
                >
                  {isPending ? 'Đang tạo...' : 'Tạo và thêm vào phiếu'}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
