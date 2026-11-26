export default function Loading() {
  return (
    <div role="status" className="space-y-6 max-sm:space-y-3 p-2" aria-label="Đang tải báo cáo">
      <p className="text-sm font-semibold leading-snug text-gray-700">Đang tải báo cáo, vui lòng chờ…</p>
      <div className="animate-pulse space-y-6 max-sm:space-y-3" aria-hidden="true">
      <div className="h-10 w-48 rounded bg-gray-200" />
      <div className="h-14 w-full max-w-3xl rounded bg-gray-200" />
      <div className="grid gap-4 max-sm:gap-2 sm:grid-cols-3">
        <div className="h-28 rounded bg-gray-200" />
        <div className="h-28 rounded bg-gray-200" />
        <div className="h-28 rounded bg-gray-200" />
      </div>
      <div className="h-72 rounded bg-gray-200" />
      <div className="h-56 rounded bg-gray-200" />
      </div>
    </div>
  )
}
