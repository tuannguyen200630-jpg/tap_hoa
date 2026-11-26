export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 max-sm:space-y-3 p-4 max-sm:p-3 sm:p-6 lg:p-8" aria-busy="true">
      <div className="h-12 w-52 animate-pulse rounded-xl bg-gray-200" />
      <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
      <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
    </div>
  )
}
