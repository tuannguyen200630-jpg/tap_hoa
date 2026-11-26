import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-5 max-sm:px-3 py-10 text-center">
      <h2 className="mb-4 max-sm:mb-3 text-2xl max-sm:text-lg font-bold">Không tìm thấy trang</h2>
      <p className="mb-6 max-sm:mb-3 max-w-lg text-lg max-sm:text-sm">
        Trang này không có hoặc đã được chuyển đi. Hãy quay lại màn hình bán hàng.
      </p>
      <Link
        href="/ban-hang"
        className="inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-700 px-6 max-sm:px-3 py-3 max-sm:py-2 text-lg max-sm:text-sm font-semibold text-white"
      >
        Về màn hình bán hàng
      </Link>
    </div>
  )
}
