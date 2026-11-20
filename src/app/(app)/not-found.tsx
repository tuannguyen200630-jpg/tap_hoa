import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold mb-4">Không tìm thấy trang</h2>
      <p className="text-lg mb-6">Trang bạn tìm không tồn tại.</p>
      <Link
        href="/ban-hang"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg min-h-[48px] inline-flex items-center justify-center font-medium"
      >
        Về trang chính
      </Link>
    </div>
  )
}
