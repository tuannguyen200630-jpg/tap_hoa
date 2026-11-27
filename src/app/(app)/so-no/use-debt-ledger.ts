'use client'

import { useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type * as React from 'react'
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
import { formatMoneyInput, parseMoney } from '@/lib/money'
import { matchesSearch } from '@/lib/search'
import { useProgressiveList } from '@/lib/use-progressive-list'

export type DebtLedgerProps = {
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

export type DebtLedgerSentinelRef = RefObject<HTMLDivElement | null>

export function useDebtLedger({ initialCustomers, initialSuppliers, sentinelRef }: DebtLedgerProps & { sentinelRef: DebtLedgerSentinelRef }) {
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
  const { visibleCount } = useProgressiveList(filteredContacts.length, resetKey, sentinelRef)
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

  function handlePaymentAmountChange(value: string) {
    setPaymentAmount(formatMoneyInput(parseMoney(value)))
  }

  function setPaymentToFullDebt(amount: number) {
    setPaymentAmount(formatMoneyInput(amount))
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

  return {
    targetType,
    setTargetType,
    customers,
    setCustomers,
    suppliers,
    setSuppliers,
    search,
    setSearch,
    isLoading,
    setIsLoading,
    listError,
    setListError,
    notice,
    setNotice,
    isContactDialogOpen,
    setContactDialogOpen,
    editingContact,
    setEditingContact,
    contactForm,
    setContactForm,
    contactError,
    setContactError,
    isSavingContact,
    setIsSavingContact,
    paymentContact,
    setPaymentContact,
    paymentAmount,
    setPaymentAmount,
    paymentNote,
    setPaymentNote,
    paymentError,
    setPaymentError,
    isSavingPayment,
    setIsSavingPayment,
    historyContact,
    setHistoryContact,
    history,
    setHistory,
    originPage,
    setOriginPage,
    paymentPage,
    setPaymentPage,
    historyError,
    setHistoryError,
    isLoadingHistory,
    setIsLoadingHistory,
    historyRequestId,
    activeData,
    filteredContacts,
    resetKey,
    visibleCount,
    visibleContacts,
    refreshContacts,
    changeTarget,
    openNewContact,
    openEditContact,
    submitContact,
    openPayment,
    handlePaymentAmountChange,
    setPaymentToFullDebt,
    submitPayment,
    loadHistory,
    openHistory,
    closeHistory,
    paymentValue,
    sentinelRef,
    targetTitle,
  }
}
