import { formatMoney } from '@/lib/money'
import type { ReceiptData } from '../use-sales-terminal'
import { formatDateTime, formatQuantity, paymentLabels } from './sales-format'

export function ReceiptPrint({ receipt }: { receipt: ReceiptData }) {
  return (
        <article className="receipt-print mx-auto w-full max-w-[80mm] bg-white p-3 text-black">
          <header className="mb-3 border-b border-dashed border-black pb-2 text-center">
            <h1 className="text-xl max-sm:text-base font-bold">HÓA ĐƠN BÁN HÀNG</h1>
            <p className="text-lg max-sm:text-sm font-semibold">{receipt.code}</p>
            <p className="text-lg max-sm:text-sm">{formatDateTime(receipt.createdAt)}</p>
            {receipt.customerName && <p className="text-lg max-sm:text-sm">Khách hàng: {receipt.customerName}</p>}
          </header>
          <div className="space-y-2">
            {receipt.lines.map((line, index) => (
              <div key={`${line.code}-${index}`} className="border-b border-dotted border-gray-500 pb-1">
                <p className="text-lg max-sm:text-sm font-semibold">{line.name}</p>
                <div className="flex justify-between gap-2 text-lg max-sm:text-sm">
                  <span>{formatQuantity(line.quantity)} {line.unit} × {formatMoney(line.unitPrice)}</span>
                  <span>{formatMoney(line.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-b border-dashed border-black pb-3 text-lg max-sm:text-sm">
            <div className="flex justify-between text-xl max-sm:text-base font-bold"><span>Khách cần trả</span><span>{formatMoney(receipt.total)}</span></div>
            <div className="flex justify-between"><span>Thanh toán</span><span>{paymentLabels[receipt.paymentMethod]}</span></div>
            {receipt.paymentMethod === 'debt' && (
              <div className="flex justify-between"><span>Khách còn nợ</span><span>{formatMoney(receipt.total)}</span></div>
            )}
          </div>
          <p className="mt-3 text-center text-lg max-sm:text-sm">Cảm ơn quý khách và hẹn gặp lại!</p>
        </article>
  )
}
