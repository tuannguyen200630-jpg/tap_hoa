'use client'

import Link from 'next/link'
import { Store, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import type { LoginFormModel } from '../use-login-form'

export function LoginDesktopView({ model }: { model: LoginFormModel }) {
  const { error, showPassword, setShowPassword, isPending, storeName, handleSubmit } = model

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-300 p-8 max-sm:p-3 sm:p-10">
        {/* Tên cửa hàng & Tiêu đề */}
        <div className="text-center mb-8 max-sm:mb-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-950 mb-4 max-sm:mb-3 shadow-inner">
            <Store className="w-9 h-9" />
          </div>
          <h1 className="text-2xl max-sm:text-lg sm:text-3xl font-bold text-gray-900 tracking-tight">
            {storeName}
          </h1>
          <p className="mt-2 text-sm leading-snug text-gray-900">
            Đăng nhập để vào phần mềm bán hàng
          </p>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div
            role="alert"
            className="mb-6 max-sm:mb-3 p-4 max-sm:p-3 rounded-xl bg-red-50 border-2 border-red-300 flex items-start gap-3 max-sm:gap-2 text-red-800"
          >
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-800" />
            <div className="text-lg max-sm:text-sm font-medium leading-relaxed">
              {error}
            </div>
          </div>
        )}

        {/* Biểu mẫu đăng nhập */}
        <form onSubmit={handleSubmit} className="space-y-6 max-sm:space-y-3" noValidate>
          {/* Ô nhập Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-lg max-sm:text-sm font-semibold text-gray-900 mb-2"
            >
              Địa chỉ email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-900">
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
                className="w-full pl-12 pr-4 py-3 max-sm:py-2.5 min-h-[52px] text-lg max-sm:text-sm text-gray-900 bg-white border-2 border-gray-300 rounded-xl placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-600/30 disabled:bg-gray-200 disabled:text-gray-900 transition"
              />
            </div>
          </div>

          {/* Ô nhập Mật khẩu */}
          <div>
            <label
              htmlFor="password"
              className="block text-lg max-sm:text-sm font-semibold text-gray-900 mb-2"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-900">
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
                className="w-full pl-12 pr-14 py-3 max-sm:py-2.5 min-h-[52px] text-lg max-sm:text-sm text-gray-900 bg-white border-2 border-gray-300 rounded-xl placeholder-gray-600 focus:outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-600/30 disabled:bg-gray-200 disabled:text-gray-900 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-900 hover:text-gray-900 focus:outline-none focus:text-blue-950"
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
            className="w-full min-h-[56px] px-6 max-sm:px-3 py-3 max-sm:py-2.5 bg-blue-800 hover:bg-blue-900 active:bg-blue-900 text-white text-xl max-sm:text-base font-bold rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-600/30 disabled:bg-gray-200 disabled:cursor-not-allowed transition flex items-center justify-center gap-3 max-sm:gap-2 cursor-pointer"
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
              className="inline-flex items-center justify-center min-h-[48px] px-4 max-sm:px-3 text-lg max-sm:text-sm font-semibold text-blue-950 hover:text-blue-950 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-lg transition"
            >
              Quên mật khẩu?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
