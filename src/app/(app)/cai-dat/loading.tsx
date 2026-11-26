export default function Loading() {
  return (
    <div role="status" className="space-y-6 max-sm:space-y-3 p-2" aria-label="Đang tải cài đặt">
      <p className="text-sm font-semibold leading-snug text-gray-700">Đang tải cài đặt, vui lòng chờ…</p>
      <div className="animate-pulse space-y-6 max-sm:space-y-3" aria-hidden="true">
      <div className="h-10 w-48 rounded bg-gray-200" />
      <div className="h-64 rounded bg-gray-200" />
      <div className="h-48 rounded bg-gray-200" />
      </div>
    </div>
  )
}
