'use client'

import { formatMoney } from '@/lib/money'
import type { useInvoiceList } from '../use-invoice-list'

export function ReceiptPrint({ model }: { model: ReturnType<typeof useInvoiceList> }) {
  const { invoiceDetails, formatDateTime, paymentLabels } = model

  return (
    <>
      {invoiceDetails && (
        <article className="receipt-print mx-auto w-full max-w-[80mm] bg-white p-3 text-black">
          <header className="mb-3 border-b border-dashed border-black pb-2 text-center">
            <h1 className="text-xl max-sm:text-base font-bold">HÓA ĐƠN BÁN HÀNG</h1>
            <p className="text-lg max-sm:text-sm font-semibold">{invoiceDetails.code}</p>
            <p className="text-lg max-sm:text-sm">{formatDateTime(invoiceDetails.created_at)}</p>
            <p className="text-lg max-sm:text-sm">{invoiceDetails.customer?.name || 'Khách lẻ'}</p>
            {invoiceDetails.status === 'cancelled' && <p className="text-xl max-sm:text-base font-bold">ĐÃ HỦY</p>}
          </header>
          <div className="space-y-2">
            {invoiceDetails.items.map((item) => (
              <div key={item.id} className="border-b border-dotted border-gray-500 pb-1">
                <p className="text-lg max-sm:text-sm font-semibold">{item.product_name}</p>
                <div className="flex justify-between gap-2 text-lg max-sm:text-sm">
                  <span>{item.quantity} {item.unit} × {formatMoney(item.sell_price)}</span>
                  <span>{formatMoney(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-b border-dashed border-black pb-3 text-lg max-sm:text-sm">
            <div className="flex justify-between"><span>Tổng tiền hàng</span><span>{formatMoney(invoiceDetails.total_amount)}</span></div>
            {invoiceDetails.discount_amount > 0 && (
              <div className="flex justify-between"><span>Giảm giá</span><span>−{formatMoney(invoiceDetails.discount_amount)}</span></div>
            )}
            <div className="flex justify-between text-xl max-sm:text-base font-bold"><span>Khách cần trả</span><span>{formatMoney(invoiceDetails.final_amount)}</span></div>
            <div className="flex justify-between"><span>Thanh toán</span><span>{paymentLabels[invoiceDetails.payment_method]}</span></div>
            {invoiceDetails.customer_paid > 0 && (
              <div className="flex justify-between"><span>Khách đã đưa</span><span>{formatMoney(invoiceDetails.customer_paid)}</span></div>
            )}
            {invoiceDetails.change_amount > 0 && (
              <div className="flex justify-between"><span>Tiền thối</span><span>{formatMoney(invoiceDetails.change_amount)}</span></div>
            )}
            {invoiceDetails.debt_amount > 0 && (
              <div className="flex justify-between"><span>Còn ghi nợ</span><span>{formatMoney(invoiceDetails.debt_amount)}</span></div>
            )}
          </div>
          {invoiceDetails.cancel_reason && <p className="mt-2 text-lg max-sm:text-sm">Lý do hủy: {invoiceDetails.cancel_reason}</p>}
          {invoiceDetails.note && <p className="mt-2 text-lg max-sm:text-sm">Ghi chú: {invoiceDetails.note}</p>}
          <p className="mt-3 text-center text-lg max-sm:text-sm">Cảm ơn quý khách và hẹn gặp lại!</p>
        </article>
      )}
    </>
  )
}
