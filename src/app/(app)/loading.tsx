export default function Loading() {
  return (
    <div role="status" aria-label="Đang tải cửa hàng" className="space-y-4 max-sm:space-y-3 p-4 max-sm:p-3">
      <p className="text-sm font-semibold leading-snug text-gray-700">Đang mở cửa hàng, vui lòng chờ một chút…</p>
      <div className="animate-pulse space-y-4 max-sm:space-y-3" aria-hidden="true">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="grid grid-cols-2 gap-4 max-sm:gap-2 mt-6 max-sm:mt-3">
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
      </div>
    </div>
  )
}
