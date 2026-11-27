'use client'

import Link from 'next/link'
import { ArrowLeft, KeyRound } from 'lucide-react'
import type { ForgotPasswordFormModel } from '../use-forgot-password-form'

export function ForgotPasswordMobileView({ model }: { model: ForgotPasswordFormModel }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-300 p-8 max-sm:p-3 sm:p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-950 mb-4 max-sm:mb-3 shadow-inner">
          <KeyRound className="w-9 h-9" />
        </div>
        <h1 className="text-2xl max-sm:text-lg sm:text-3xl font-bold text-gray-900 tracking-tight mb-4 max-sm:mb-3">
          Quên mật khẩu?
        </h1>
        <p className="mb-6 max-sm:mb-3 text-sm leading-snug text-gray-900">
          Vui lòng liên hệ chủ cửa hàng hoặc người quản trị hệ thống để được hỗ trợ cấp lại mật khẩu mới.
        </p>

        <div className="pt-2">
          <Link
            href={model.backHref}
            className="w-full min-h-[52px] px-6 max-sm:px-3 py-3 max-sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-lg max-sm:text-sm font-bold rounded-xl transition inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại trang đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
