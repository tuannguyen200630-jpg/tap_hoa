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
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold text-red-600 mb-4">Đã xảy ra lỗi</h2>
      <p className="text-lg mb-6">Có sự cố khi tải trang. Vui lòng thử lại.</p>
      <button
        onClick={reset}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg min-h-[48px] cursor-pointer"
      >
        Thử lại
      </button>
    </div>
  )
}
