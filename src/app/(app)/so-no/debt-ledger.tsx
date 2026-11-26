'use client'

import { useMemo, useRef, useState } from 'react'
import {
  getAllDebtContacts,
  getDebtHistoryAction,
  recordDebtPaymentAction,
  saveDebtContactAction,
  type DebtContact,
  type DebtContactPage,
  type DebtHistory,
  type DebtTarget,
} from './actions'
import { formatDateTime } from '@/lib/codes'
import { formatMoney, formatMoneyInput, parseMoney } from '@/lib/money'
import { matchesSearch } from '@/lib/search'
import { useProgressiveList } from '@/lib/use-progressive-list'

type Props = {
  initialCustomers: DebtContactPage
  initialSuppliers: DebtContactPage
}

type ContactForm = {
  name: string
  phone: string
  address: string
  note: string
}

function targetTitle(targetType: DebtTarget) {
  return targetType === 'customer' ? 'khách hàng' : 'nhà cung cấp'
}

export function DebtLedger({ initialCustomers, initialSuppliers }: Props) {
  const [targetType, setTargetType] = useState<DebtTarget>('customer')
  const [customers, setCustomers] = useState(initialCustomers)
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [notice, setNotice] = useState('')

  const [isContactDialogOpen, setContactDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<DebtContact | null>(null)
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    phone: '',
    address: '',
    note: '',
  })
  const [contactError, setContactError] = useState('')
  const [isSavingContact, setIsSavingContact] = useState(false)

  const [paymentContact, setPaymentContact] = useState<DebtContact | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [isSavingPayment, setIsSavingPayment] = useState(false)

  const [historyContact, setHistoryContact] = useState<DebtContact | null>(null)
  const [history, setHistory] = useState<DebtHistory | null>(null)
  const [originPage, setOriginPage] = useState(1)
  const [paymentPage, setPaymentPage] = useState(1)
  const [historyError, setHistoryError] = useState('')
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const historyRequestId = useRef(0)

  const activeData = targetType === 'customer' ? customers : suppliers
  const filteredContacts = useMemo(() => activeData.contacts.filter((contact) =>
    matchesSearch(search, contact.name, contact.phone, contact.address, contact.note)
  ), [activeData.contacts, search])
  const resetKey = JSON.stringify([targetType, search])
  const { sentinelRef, visibleCount } = useProgressiveList(filteredContacts.length, resetKey)
  const visibleContacts = filteredContacts.slice(0, visibleCount)

  async function refreshContacts() {
    setIsLoading(true)
    setListError('')
    try {
      const [nextCustomers, nextSuppliers] = await Promise.all([
        getAllDebtContacts({ targetType: 'customer' }),
        getAllDebtContacts({ targetType: 'supplier' }),
      ])
      setCustomers(nextCustomers)
      setSuppliers(nextSuppliers)
    } catch (error: unknown) {
      setListError(error instanceof Error ? error.message : 'Không tải được danh sách.')
    } finally {
      setIsLoading(false)
    }
  }

  function changeTarget(nextTarget: DebtTarget) {
    setTargetType(nextTarget)
    setNotice('')
  }

  function openNewContact() {
    setEditingContact(null)
    setContactForm({ name: '', phone: '', address: '', note: '' })
    setContactError('')
    setContactDialogOpen(true)
  }

  function openEditContact(contact: DebtContact) {
    setEditingContact(contact)
    setContactForm({
      name: contact.name,
      phone: contact.phone || '',
      address: contact.address || '',
      note: contact.note || '',
    })
    setContactError('')
    setContactDialogOpen(true)
  }

  async function submitContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingContact(true)
    setContactError('')

    try {
      const result = await saveDebtContactAction({
        targetType,
        id: editingContact?.id,
        ...contactForm,
      })
      if (result.error) {
        setContactError(result.error)
        return
      }

      setContactDialogOpen(false)
      setNotice(editingContact ? 'Đã lưu thông tin.' : `Đã thêm ${targetTitle(targetType)}.`)
      if (!editingContact) {
        setSearch('')
      }
      await refreshContacts()
    } catch (error: unknown) {
      setContactError(error instanceof Error ? error.message : 'Không lưu được thông tin.')
    } finally {
      setIsSavingContact(false)
    }
  }

  function openPayment(contact: DebtContact) {
    setPaymentContact(contact)
    setPaymentAmount(formatMoneyInput(contact.debt))
    setPaymentNote('')
    setPaymentError('')
  }

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!paymentContact) return
    const amount = parseMoney(paymentAmount)
    if (amount <= 0) {
      setPaymentError('Vui lòng nhập số tiền lớn hơn 0.')
      return
    }
    if (amount > paymentContact.debt) {
      setPaymentError('Số tiền không được lớn hơn khoản đang nợ.')
      return
    }

    setIsSavingPayment(true)
    setPaymentError('')
    try {
      const result = await recordDebtPaymentAction({
        targetType,
        targetId: paymentContact.id,
        amount,
        note: paymentNote || null,
      })
      if (result.error) {
        setPaymentError(result.error)
        return
      }

      setPaymentContact(null)
      setNotice(targetType === 'customer' ? 'Đã ghi nhận thu nợ.' : 'Đã ghi nhận trả nợ.')
      await refreshContacts()
    } catch (error: unknown) {
      setPaymentError(error instanceof Error ? error.message : 'Không ghi nhận được thanh toán.')
    } finally {
      setIsSavingPayment(false)
    }
  }

  async function loadHistory(
    contact: DebtContact,
    nextOriginPage: number,
    nextPaymentPage: number
  ) {
    const requestId = ++historyRequestId.current
    setIsLoadingHistory(true)
    setHistoryError('')
    try {
      const result = await getDebtHistoryAction({
        targetType,
        targetId: contact.id,
        originPage: nextOriginPage,
        paymentPage: nextPaymentPage,
      })
      if (requestId !== historyRequestId.current) return
      setHistory(result)
      setOriginPage(nextOriginPage)
      setPaymentPage(nextPaymentPage)
    } catch (error: unknown) {
      if (requestId !== historyRequestId.current) return
      setHistoryError(error instanceof Error ? error.message : 'Không tải được lịch sử.')
    } finally {
      if (requestId === historyRequestId.current) setIsLoadingHistory(false)
    }
  }

  function openHistory(contact: DebtContact) {
    setHistoryContact(contact)
    setHistory(null)
    setOriginPage(1)
    setPaymentPage(1)
    void loadHistory(contact, 1, 1)
  }

  function closeHistory() {
    historyRequestId.current += 1
    setHistoryContact(null)
    setHistory(null)
    setIsLoadingHistory(false)
  }

  const paymentValue = parseMoney(paymentAmount)

  return (
    <section className="space-y-6 max-sm:space-y-3">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
        <h1 className="min-w-0 text-lg font-bold text-gray-900 sm:text-3xl">Sổ nợ</h1>
        <button
          type="button"
          onClick={openNewContact}
          className="col-start-2 row-start-1 shrink-0 whitespace-nowrap rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 sm:px-5 sm:py-3 sm:text-base"
        >
          {targetType === 'customer' ? '+ Thêm khách hàng' : '+ Thêm nhà cung cấp'}
        </button>
        <p className="col-span-2 row-start-2 text-xs text-gray-600 sm:text-base">Theo dõi các khoản khách còn nợ và khoản cần trả nhà cung cấp.</p>
      </header>

      {notice && (
        <div role="status" className="rounded-lg border border-green-300 bg-green-50 p-4 max-sm:p-3 text-green-900">
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
              ? 'border-blue-700 bg-blue-50 text-blue-900'
              : 'border-gray-300 bg-white text-gray-800'
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
              ? 'border-blue-700 bg-blue-50 text-blue-900'
              : 'border-gray-300 bg-white text-gray-800'
          }`}
        >
          Mình nợ nhà cung cấp
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
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
        {isLoading && <p className="self-center text-gray-700" role="status">Đang tải danh sách…</p>}
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
          <p className="mt-2 text-gray-700">
            {search
              ? 'Hãy thử tên hoặc số điện thoại khác.'
              : 'Thêm thông tin liên hệ để dễ chọn khi bán hàng hoặc nhập hàng.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={openNewContact}
              className="mt-4 max-sm:mt-3 rounded-lg bg-blue-700 px-5 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-white hover:bg-blue-800"
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
                  {contact.phone && <p className="mt-1 text-xs text-gray-800 sm:text-sm">Điện thoại: {contact.phone}</p>}
                  {contact.address && <p className="mt-1 hidden break-words text-xs text-gray-700 md:block">Địa chỉ: {contact.address}</p>}
                  {contact.note && <p className="mt-1 hidden break-words text-xs text-gray-700 md:block">Ghi chú: {contact.note}</p>}
                </div>
                <div className="flex flex-col gap-3 max-sm:gap-2 sm:flex-row sm:items-center">
                  <div className="sm:min-w-48 sm:text-right">
                    <p className="text-xs text-gray-700">{targetType === 'customer' ? 'Còn nợ' : 'Cần trả'}</p>
                    <p className="whitespace-nowrap text-base font-bold text-gray-950 sm:text-2xl">
                      {contact.debt > 0 ? formatMoney(contact.debt) : 'Không có công nợ'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contact.debt > 0 && (
                      <button
                        type="button"
                        onClick={() => openPayment(contact)}
                        className="rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800"
                      >
                        {targetType === 'customer' ? 'Thu nợ' : 'Trả nợ'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openHistory(contact)}
                      className="rounded-lg border border-blue-700 px-4 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50"
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
            <div ref={sentinelRef} className="min-h-10 text-center text-lg max-sm:text-sm text-gray-600" aria-live="polite">
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
                Tên <span className="text-red-700">*</span>
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
                  className="rounded-lg bg-blue-700 px-5 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-white disabled:opacity-60"
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
            <p className="mt-2 text-gray-800">{paymentContact.name}</p>
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
                  onChange={(event) => setPaymentAmount(formatMoneyInput(parseMoney(event.target.value)))}
                  className="mt-1 min-h-14 w-full rounded-lg border border-gray-400 px-3 py-2 text-2xl max-sm:text-lg font-bold"
                />
              </label>
              <button
                type="button"
                onClick={() => setPaymentAmount(formatMoneyInput(paymentContact.debt))}
                className="rounded-lg border border-blue-700 px-4 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-blue-800 hover:bg-blue-50"
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
                  className="rounded-lg bg-green-700 px-5 max-sm:px-3 py-3 max-sm:py-2 font-semibold text-white disabled:opacity-60"
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
                <p className="mt-1 text-gray-800">
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
            {isLoadingHistory && <p role="status" className="mt-4 max-sm:mt-3 text-gray-700">Đang tải lịch sử…</p>}
            {history && !isLoadingHistory && (
              <div className="mt-5 max-sm:mt-3 space-y-6 max-sm:space-y-3">
                <section>
                  <h3 className="text-xl max-sm:text-base font-bold text-gray-950">
                    {targetType === 'customer' ? 'Nợ phát sinh từ hóa đơn bán' : 'Nợ phát sinh từ phiếu nhập'}
                  </h3>
                  {history.origins.length === 0 ? (
                    <p className="mt-2 text-gray-700">Chưa có khoản nợ phát sinh từ giao dịch.</p>
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
                    <p className="mt-2 text-gray-700">Chưa có lần thu hoặc trả nợ nào.</p>
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
                          {payment.note && <p className="mt-1 text-gray-700">Ghi chú: {payment.note}</p>}
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
      <p className="text-gray-700">Trang {page} / {pageCount}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onChange(page - 1)}
          className="rounded-lg border border-gray-400 px-4 max-sm:px-3 py-3 max-sm:py-2 font-semibold disabled:opacity-50"
        >
          Trang trước
        </button>
        <button
          type="button"
          disabled={page >= pageCount || loading}
          onClick={() => onChange(page + 1)}
          className="rounded-lg border border-gray-400 px-4 max-sm:px-3 py-3 max-sm:py-2 font-semibold disabled:opacity-50"
        >
          Trang sau
        </button>
      </div>
    </nav>
  )
}
