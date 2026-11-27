'use client'

import { formatDateTime } from '@/lib/codes'
import { formatMoney } from '@/lib/money'
import type { useDebtLedger } from '../use-debt-ledger'

export function DebtMobileView({ model }: { model: ReturnType<typeof useDebtLedger> }) {
  const { targetType, search, setSearch, isLoading, listError, notice, isContactDialogOpen, setContactDialogOpen, editingContact, contactForm, setContactForm, contactError, isSavingContact, paymentContact, setPaymentContact, paymentAmount, paymentNote, setPaymentNote, paymentError, isSavingPayment, historyContact, history, originPage, paymentPage, historyError, isLoadingHistory, activeData, filteredContacts, visibleCount, visibleContacts, refreshContacts, changeTarget, openNewContact, openEditContact, submitContact, openPayment, handlePaymentAmountChange, setPaymentToFullDebt, submitPayment, loadHistory, openHistory, closeHistory, paymentValue, sentinelRef, targetTitle } = model

  return (
    <section className="space-y-6 max-sm:space-y-3">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
        <h1 className="min-w-0 text-lg font-bold text-gray-900 sm:text-3xl">Sổ nợ</h1>
        <button
          type="button"
          onClick={openNewContact}
          className="col-start-2 row-start-1 shrink-0 whitespace-nowrap rounded-lg bg-blue-800 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-900 sm:px-5 sm:py-3 sm:text-base"
        >
          {targetType === 'customer' ? '+ Thêm khách hàng' : '+ Thêm nhà cung cấp'}
        </button>
        <p className="col-span-2 row-start-2 text-xs text-gray-900 sm:text-base">Theo dõi các khoản khách còn nợ và khoản cần trả nhà cung cấp.</p>
      </header>

      {notice && (
        <div role="status" className="rounded-lg border border-emerald-400 bg-emerald-100 p-4 max-sm:p-3 text-green-900">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Chọn sổ công nợ">
        <button
          type="button"
          role="tab"
          aria-selected={targetType === 'customer'}
          onClick={() => changeTarget('customer')}
          className={`whitespace-nowrap rounded-lg border-2 px-2 py-2 text-center text-xs font-semibold ${
            targetType === 'customer'
              ? 'border-blue-700 bg-blue-50 text-blue-950'
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        >
          Khách nợ mình
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={targetType === 'supplier'}
          onClick={() => changeTarget('supplier')}
          className={`whitespace-nowrap rounded-lg border-2 px-2 py-2 text-center text-xs font-semibold ${
            targetType === 'supplier'
              ? 'border-blue-700 bg-blue-50 text-blue-950'
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        >
          Mình nợ nhà cung cấp
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-700 bg-blue-50 p-3">
        <p className="text-xs font-medium text-blue-950">
          {targetType === 'customer' ? 'Tổng khách hàng đang nợ' : 'Tổng tiền cần trả nhà cung cấp'}
        </p>
        <p className="shrink-0 whitespace-nowrap text-base font-bold text-blue-950">{formatMoney(activeData.totalDebt)}</p>
      </div>

      <div className="flex flex-col gap-3 max-sm:gap-2 sm:flex-row">
        <label htmlFor="debt-search" className="sr-only">Tìm khách hàng hoặc nhà cung cấp</label>
        <input
          id="debt-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm tên, số điện thoại, địa chỉ hoặc ghi chú"
          className="min-h-12 w-full rounded-lg border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900"
        />
        {isLoading && <p className="self-center text-gray-900" role="status">Đang tải danh sách…</p>}
      </div>

      {listError && (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 max-sm:p-3 text-red-900">
          <p>{listError}</p>
          <button
            type="button"
            className="mt-2 font-semibold underline"
            onClick={() => void refreshContacts()}
          >
            Thử tải lại
          </button>
        </div>
      )}

      {!listError && filteredContacts.length === 0 && !isLoading && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 max-sm:p-3 text-center">
          <h2 className="text-xl max-sm:text-base font-semibold text-gray-900">
            {search ? 'Không tìm thấy người phù hợp' : `Chưa có ${targetTitle(targetType)} nào`}
          </h2>
          <p className="mt-2 text-gray-900">
            {search
              ? 'Hãy thử tên hoặc số điện thoại khác.'
              : 'Thêm thông tin liên hệ để dễ chọn khi bán hàng hoặc nhập hàng.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={openNewContact}
              className="mt-4 max-sm:mt-3 rounded-lg bg-blue-800 px-5 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-white hover:bg-blue-900"
            >
              {targetType === 'customer' ? 'Thêm khách hàng đầu tiên' : 'Thêm nhà cung cấp đầu tiên'}
            </button>
          )}
        </div>
      )}

      {filteredContacts.length > 0 && (
        <div className="space-y-3">
          {visibleContacts.map((contact) => (
            <article key={contact.id} className="rounded-xl border border-gray-300 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-4 max-sm:gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2 className="break-words text-sm font-bold text-gray-950 sm:text-base">{contact.name}</h2>
                  {contact.phone && <p className="mt-1 text-xs text-gray-900 sm:text-sm">Điện thoại: {contact.phone}</p>}
                  {contact.address && <p className="mt-1 hidden break-words text-xs text-gray-900 md:block">Địa chỉ: {contact.address}</p>}
                  {contact.note && <p className="mt-1 hidden break-words text-xs text-gray-900 md:block">Ghi chú: {contact.note}</p>}
                </div>
                <div className="flex flex-col gap-3 max-sm:gap-2 sm:flex-row sm:items-center">
                  <div className="sm:min-w-48 sm:text-right">
                    <p className="text-xs text-gray-900">{targetType === 'customer' ? 'Còn nợ' : 'Cần trả'}</p>
                    <p className="whitespace-nowrap text-base font-bold text-gray-950 sm:text-2xl">
                      {contact.debt > 0 ? formatMoney(contact.debt) : 'Không có công nợ'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contact.debt > 0 && (
                      <button
                        type="button"
                        onClick={() => openPayment(contact)}
                        className="rounded-lg bg-green-800 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800"
                      >
                        {targetType === 'customer' ? 'Thu nợ' : 'Trả nợ'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openHistory(contact)}
                      className="rounded-lg border border-blue-700 px-4 py-2 text-xs font-semibold text-blue-950 hover:bg-blue-50"
                    >
                      Xem lịch sử
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditContact(contact)}
                      className="rounded-lg border border-gray-500 px-4 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-100"
                    >
                      Sửa thông tin
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {filteredContacts.length > visibleCount && (
            <div ref={sentinelRef} className="min-h-10 text-center text-lg max-sm:text-sm text-gray-900" aria-live="polite">
              Cuộn để xem thêm liên hệ...
            </div>
          )}
        </div>
      )}

      {isContactDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 max-sm:p-3">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-dialog-title"
            className="my-auto w-full max-w-xl rounded-xl bg-white p-5 max-sm:p-3 shadow-xl"
          >
            <h2 id="contact-dialog-title" className="text-2xl max-sm:text-lg font-bold text-gray-950">
              {editingContact ? 'Sửa thông tin' : `Thêm ${targetTitle(targetType)}`}
            </h2>
            <form className="mt-4 max-sm:mt-3 space-y-4 max-sm:space-y-3" onSubmit={submitContact}>
              <label className="block font-semibold text-gray-900">
                Tên <span className="text-red-800">*</span>
                <input
                  required
                  maxLength={150}
                  autoFocus
                  value={contactForm.name}
                  onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
                  className="mt-1 min-h-12 w-full rounded-lg border border-gray-400 px-3 py-2 font-normal"
                />
              </label>
              <label className="block font-semibold text-gray-900">
                Số điện thoại
                <input
                  type="tel"
                  maxLength={30}
                  value={contactForm.phone}
                  onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })}
                  className="mt-1 min-h-12 w-full rounded-lg border border-gray-400 px-3 py-2 font-normal"
                />
              </label>
              <label className="block font-semibold text-gray-900">
                Địa chỉ
                <input
                  maxLength={300}
                  value={contactForm.address}
                  onChange={(event) => setContactForm({ ...contactForm, address: event.target.value })}
                  className="mt-1 min-h-12 w-full rounded-lg border border-gray-400 px-3 py-2 font-normal"
                />
              </label>
              <label className="block font-semibold text-gray-900">
                Ghi chú
                <textarea
                  maxLength={1000}
                  rows={3}
                  value={contactForm.note}
                  onChange={(event) => setContactForm({ ...contactForm, note: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-400 px-3 py-2 font-normal"
                />
              </label>
              {contactError && <p role="alert" className="text-red-800">{contactError}</p>}
              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setContactDialogOpen(false)}
                  className="rounded-lg border border-gray-500 px-5 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-gray-900"
                >
                  Không
                </button>
                <button
                  type="submit"
                  disabled={isSavingContact}
                  className="rounded-lg bg-blue-800 px-5 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-white disabled:opacity-100 disabled:bg-gray-200 disabled:text-gray-900 disabled:border-gray-400"
                >
                  {isSavingContact ? 'Đang lưu…' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {paymentContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 max-sm:p-3">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-dialog-title"
            className="my-auto w-full max-w-xl rounded-xl bg-white p-5 max-sm:p-3 shadow-xl"
          >
            <h2 id="payment-dialog-title" className="text-2xl max-sm:text-lg font-bold text-gray-950">
              {targetType === 'customer' ? 'Thu nợ khách hàng' : 'Trả nợ nhà cung cấp'}
            </h2>
            <p className="mt-2 text-gray-900">{paymentContact.name}</p>
            <p className="font-semibold text-gray-950">
              Số nợ hiện tại: {formatMoney(paymentContact.debt)}
            </p>
            <form className="mt-4 max-sm:mt-3 space-y-4 max-sm:space-y-3" onSubmit={submitPayment}>
              <label className="block font-semibold text-gray-900">
                Số tiền
                <input
                  required
                  inputMode="numeric"
                  value={paymentAmount}
                  onChange={(event) => handlePaymentAmountChange(event.target.value)}
                  className="mt-1 min-h-14 w-full rounded-lg border border-gray-400 px-3 py-2 text-2xl max-sm:text-lg font-bold"
                />
              </label>
              <button
                type="button"
                onClick={() => setPaymentToFullDebt(paymentContact.debt)}
                className="rounded-lg border border-blue-700 px-4 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-blue-950 hover:bg-blue-50"
              >
                Trả toàn bộ {formatMoney(paymentContact.debt)}
              </button>
              <label className="block font-semibold text-gray-900">
                Ghi chú (không bắt buộc)
                <textarea
                  maxLength={500}
                  rows={2}
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-400 px-3 py-2 font-normal"
                />
              </label>
              {paymentValue > paymentContact.debt && (
                <p className="font-semibold text-red-800">Số tiền không được lớn hơn khoản đang nợ.</p>
              )}
              {paymentError && <p role="alert" className="text-red-800">{paymentError}</p>}
              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setPaymentContact(null)}
                  className="rounded-lg border border-gray-500 px-5 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-gray-900"
                >
                  Không
                </button>
                <button
                  type="submit"
                  disabled={isSavingPayment || paymentValue <= 0 || paymentValue > paymentContact.debt}
                  className="rounded-lg bg-green-800 px-5 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-white disabled:opacity-100 disabled:bg-gray-200 disabled:text-gray-900 disabled:border-gray-400"
                >
                  {isSavingPayment ? 'Đang ghi nhận…' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {historyContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 max-sm:p-3">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-dialog-title"
            className="my-auto max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-5 max-sm:p-3 shadow-xl"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="history-dialog-title" className="text-2xl max-sm:text-lg font-bold text-gray-950">
                  Lịch sử của {historyContact.name}
                </h2>
                <p className="mt-1 text-gray-900">
                  {targetType === 'customer' ? 'Khách còn nợ' : 'Còn cần trả'}: {formatMoney(historyContact.debt)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeHistory}
                className="self-start rounded-lg border border-gray-500 px-4 max-sm:px-3 py-3 max-sm:py-2 font-semibold"
              >
                Đóng
              </button>
            </div>

            {historyError && <p role="alert" className="mt-4 max-sm:mt-3 text-red-800">{historyError}</p>}
            {isLoadingHistory && <p role="status" className="mt-4 max-sm:mt-3 text-gray-900">Đang tải lịch sử…</p>}
            {history && !isLoadingHistory && (
              <div className="mt-5 max-sm:mt-3 space-y-6 max-sm:space-y-3">
                <section>
                  <h3 className="text-xl max-sm:text-base font-bold text-gray-950">
                    {targetType === 'customer' ? 'Nợ phát sinh từ hóa đơn bán' : 'Nợ phát sinh từ phiếu nhập'}
                  </h3>
                  {history.origins.length === 0 ? (
                    <p className="mt-2 text-gray-900">Chưa có khoản nợ phát sinh từ giao dịch.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {history.origins.map((origin) => (
                        <li key={origin.id} className="rounded-lg border border-gray-300 p-4 max-sm:p-3">
                          <div className="flex flex-wrap justify-between gap-2">
                            <strong>{origin.code}</strong>
                            <span>{formatDateTime(origin.createdAt)}</span>
                          </div>
                          <p className="mt-1">
                            Số nợ phát sinh: <strong>{formatMoney(origin.amount)}</strong>
                            {' · '}Giá trị giao dịch: {formatMoney(origin.totalAmount)}
                          </p>
                          <p className="mt-1">
                            Tình trạng: {origin.status === 'cancelled' ? 'Đã hủy' : 'Hoàn tất'}
                          </p>
                          {origin.cancelReason && <p className="mt-1">Lý do hủy: {origin.cancelReason}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {history.originCount > 20 && (
                    <HistoryPagination
                      page={originPage}
                      count={history.originCount}
                      loading={isLoadingHistory}
                      onChange={(nextPage) => void loadHistory(historyContact, nextPage, paymentPage)}
                    />
                  )}
                </section>

                <section>
                  <h3 className="text-xl max-sm:text-base font-bold text-gray-950">Lịch sử thu, trả và điều chỉnh nợ</h3>
                  {history.payments.length === 0 ? (
                    <p className="mt-2 text-gray-900">Chưa có lần thu hoặc trả nợ nào.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {history.payments.map((payment) => (
                        <li key={payment.id} className="rounded-lg border border-gray-300 p-4 max-sm:p-3">
                          <div className="flex flex-wrap justify-between gap-2">
                            <strong>
                              {payment.paymentType === 'pay_debt'
                                ? targetType === 'customer' ? 'Đã thu nợ' : 'Đã trả nợ'
                                : 'Ghi nhận phát sinh nợ'}
                            </strong>
                            <span>{formatDateTime(payment.createdAt)}</span>
                          </div>
                          <p className="mt-1 font-semibold">{formatMoney(payment.amount)}</p>
                          {payment.note && <p className="mt-1 text-gray-900">Ghi chú: {payment.note}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {history.paymentCount > 20 && (
                    <HistoryPagination
                      page={paymentPage}
                      count={history.paymentCount}
                      loading={isLoadingHistory}
                      onChange={(nextPage) => void loadHistory(historyContact, originPage, nextPage)}
                    />
                  )}
                </section>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}

function HistoryPagination({
  page,
  count,
  loading,
  onChange,
}: {
  page: number
  count: number
  loading: boolean
  onChange: (page: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(count / 20))
  return (
    <nav className="mt-3 flex flex-wrap items-center justify-between gap-3 max-sm:gap-2" aria-label="Chuyển trang lịch sử">
      <p className="text-gray-900">Trang {page} / {pageCount}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onChange(page - 1)}
          className="rounded-lg border border-gray-400 px-4 max-sm:px-3 py-3 max-sm:py-2 font-semibold disabled:opacity-100 disabled:bg-gray-200 disabled:text-gray-900 disabled:border-gray-400"
        >
          Trang trước
        </button>
        <button
          type="button"
          disabled={page >= pageCount || loading}
          onClick={() => onChange(page + 1)}
          className="rounded-lg border border-gray-400 px-4 max-sm:px-3 py-3 max-sm:py-2 font-semibold disabled:opacity-100 disabled:bg-gray-200 disabled:text-gray-900 disabled:border-gray-400"
        >
          Trang sau
        </button>
      </div>
    </nav>
  )
}
