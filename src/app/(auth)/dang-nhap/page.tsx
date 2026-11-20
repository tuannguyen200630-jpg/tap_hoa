'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Store, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { login } from './actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Cửa hàng tạp hóa'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        const result = await login(formData)
        if (result?.error) {
          setError(result.error)
        }
      } catch (err: unknown) {
        // Nếu Next.js redirect ném ra lỗi điều hướng, bỏ qua để Next.js xử lý chuyển trang
        if (err && typeof err === 'object' && 'digest' in err) {
          const digest = String((err as { digest?: string }).digest || '')
          if (digest.startsWith('NEXT_REDIRECT')) {
            return
          }
        }
        setError('Đã có lỗi xảy ra. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.')
      }
    })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-10">
        {/* Tên cửa hàng & Tiêu đề */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-inner">
            <Store className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {storeName}
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Đăng nhập để vào phần mềm bán hàng
          </p>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-300 flex items-start gap-3 text-red-800"
          >
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-600" />
            <div className="text-lg font-medium leading-relaxed">
              {error}
            </div>
          </div>
        )}

        {/* Biểu mẫu đăng nhập */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Ô nhập Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-lg font-semibold text-gray-800 mb-2"
            >
              Địa chỉ email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-6 h-6" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
                placeholder="vidu@email.com"
                className="w-full pl-12 pr-4 py-3.5 min-h-[52px] text-lg text-gray-900 bg-white border-2 border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500 transition"
              />
            </div>
          </div>

          {/* Ô nhập Mật khẩu */}
          <div>
            <label
              htmlFor="password"
              className="block text-lg font-semibold text-gray-800 mb-2"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-6 h-6" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={isPending}
                placeholder="Nhập mật khẩu"
                className="w-full pl-12 pr-14 py-3.5 min-h-[52px] text-lg text-gray-900 bg-white border-2 border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:text-blue-600"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff className="w-6 h-6" />
                ) : (
                  <Eye className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Nút bấm Đăng nhập */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full min-h-[56px] px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xl font-bold rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:bg-blue-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-3 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <span>Đăng nhập</span>
            )}
          </button>

          {/* Đường dẫn Quên mật khẩu */}
          <div className="text-center pt-2">
            <Link
              href="/quen-mat-khau"
              className="inline-flex items-center justify-center min-h-[48px] px-4 text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition"
            >
              Quên mật khẩu?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
