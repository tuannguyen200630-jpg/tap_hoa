'use client'

import { useEffect, useState } from 'react'

export function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const updateConnection = () => setIsOffline(!navigator.onLine)

    updateConnection()
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)

    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[70] flex min-h-14 items-center justify-center bg-amber-900 px-4 max-sm:px-3 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] text-center text-lg max-sm:text-sm font-semibold text-white shadow-md"
    >
      Điện thoại đang mất kết nối internet. Vui lòng kiểm tra Wi-Fi hoặc dữ liệu di động.
    </div>
  )
}
