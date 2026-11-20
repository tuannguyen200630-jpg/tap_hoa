import Link from 'next/link'
import { ArrowLeft, KeyRound } from 'lucide-react'

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 sm:p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4 shadow-inner">
          <KeyRound className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-4">
          Quên mật khẩu?
        </h1>
        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          Vui lòng liên hệ chủ cửa hàng hoặc người quản trị hệ thống để được hỗ trợ cấp lại mật khẩu mới.
        </p>

        <div className="pt-2">
          <Link
            href="/dang-nhap"
            className="w-full min-h-[52px] px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-lg font-bold rounded-xl transition inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại trang đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
