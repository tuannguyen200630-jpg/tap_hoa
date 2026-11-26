'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-5 max-sm:px-3 py-10 text-center">
      <h2 className="mb-4 max-sm:mb-3 text-2xl max-sm:text-lg font-bold text-red-700">Trang chưa mở được</h2>
      <p className="mb-6 max-sm:mb-3 max-w-lg text-lg max-sm:text-sm">
        Có sự cố khi tải trang. Vui lòng thử lại; nếu vẫn chưa được, hãy kiểm tra kết nối internet.
      </p>
      <button
        onClick={reset}
        className="min-h-12 cursor-pointer rounded-lg bg-blue-700 px-6 max-sm:px-3 py-3 max-sm:py-2 text-lg max-sm:text-sm font-semibold text-white"
      >
        Tải lại trang
      </button>
    </div>
  )
}
