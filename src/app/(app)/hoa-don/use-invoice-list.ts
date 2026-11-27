'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type * as React from 'react'
import { matchesSearch } from '@/lib/search'
import { useProgressiveList } from '@/lib/use-progressive-list'
import { cancelSaleAction, getSaleDetailsAction, getSalesForDate } from './actions'

type InvoiceRow = Awaited<ReturnType<typeof getSalesForDate>>['sales'][number]
type InvoiceDetails = Awaited<ReturnType<typeof getSaleDetailsAction>>

const paymentLabels = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  debt: 'Ghi nợ',
} as const

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export interface InvoiceListProps {
  initialDate: string
  initialSales: InvoiceRow[]
}

export type InvoiceListSentinelRef = RefObject<HTMLDivElement | null>

export function useInvoiceList({ initialDate, initialSales, sentinelRef }: InvoiceListProps & { sentinelRef: InvoiceListSentinelRef }) {
  const [date, setDate] = useState(initialDate)
  const [search, setSearch] = useState('')
  const [sales, setSales] = useState(initialSales)
  const [totalCount, setTotalCount] = useState(initialSales.length)
  const [revision, setRevision] = useState(0)
  const [listError, setListError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const detailRequestNumber = useRef(0)
  const skipFirstRequest = useRef(true)

  useEffect(() => {
    if (skipFirstRequest.current) {
      skipFirstRequest.current = false
      return
    }

    let isCurrent = true
    setIsLoading(true)
    void getSalesForDate({ date })
      .then((result) => {
        if (!isCurrent) return
        setSales(result.sales)
        setTotalCount(result.totalCount)
        setListError('')
      })
      .catch(() => {
        if (isCurrent) setListError('Không tải được hóa đơn. Vui lòng thử lại.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [date, revision])

  const filteredSales = useMemo(() => sales.filter((sale) =>
    matchesSearch(search, sale.code, sale.customer_name, sale.customer_phone)
  ), [sales, search])
  const resetKey = JSON.stringify([date, search])
  const { visibleCount } = useProgressiveList(filteredSales.length, resetKey, sentinelRef)
  const visibleSales = filteredSales.slice(0, visibleCount)

  const loadInvoicesAgain = () => setRevision((value) => value + 1)

  const openInvoice = async (id: string) => {
    const request = ++detailRequestNumber.current
    setIsDetailsOpen(true)
    setIsDetailsLoading(true)
    setDetailsError('')
    setInvoiceDetails(null)
    setIsCancelOpen(false)
    try {
      const details = await getSaleDetailsAction(id)
      if (request === detailRequestNumber.current) setInvoiceDetails(details)
    } catch {
      if (request === detailRequestNumber.current) {
        setDetailsError('Không tải được chi tiết hóa đơn. Vui lòng đóng và thử lại.')
      }
    } finally {
      if (request === detailRequestNumber.current) setIsDetailsLoading(false)
    }
  }

  const closeDetails = () => {
    detailRequestNumber.current += 1
    setIsDetailsOpen(false)
    setIsCancelOpen(false)
    setInvoiceDetails(null)
    setDetailsError('')
  }

  const confirmCancellation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!invoiceDetails) return
    setCancelError('')
    if (cancelReason.trim().length < 3) {
      setCancelError('Vui lòng nhập lý do hủy hóa đơn, ít nhất 3 ký tự.')
      return
    }

    setIsCancelling(true)
    try {
      const result = await cancelSaleAction(invoiceDetails.id, cancelReason)
      if (result.error) {
        setCancelError(result.error)
        return
      }

      setInvoiceDetails((current) => current ? {
        ...current,
        status: 'cancelled',
        cancel_reason: cancelReason.trim(),
      } : current)
      setIsCancelOpen(false)
      setCancelReason('')
      setSuccessMessage(`Đã hủy hóa đơn ${result.code || invoiceDetails.code}.`)
      setRevision((value) => value + 1)
    } catch {
      setCancelError('Không hủy được hóa đơn. Vui lòng tải lại và thử lại.')
    } finally {
      setIsCancelling(false)
    }
  }

  return {
    date,
    setDate,
    search,
    setSearch,
    sales,
    setSales,
    totalCount,
    setTotalCount,
    revision,
    setRevision,
    listError,
    setListError,
    isLoading,
    setIsLoading,
    invoiceDetails,
    setInvoiceDetails,
    isDetailsOpen,
    setIsDetailsOpen,
    isDetailsLoading,
    setIsDetailsLoading,
    detailsError,
    setDetailsError,
    isCancelOpen,
    setIsCancelOpen,
    cancelReason,
    setCancelReason,
    cancelError,
    setCancelError,
    isCancelling,
    setIsCancelling,
    successMessage,
    setSuccessMessage,
    detailRequestNumber,
    skipFirstRequest,
    filteredSales,
    resetKey,
    visibleCount,
    visibleSales,
    loadInvoicesAgain,
    openInvoice,
    closeDetails,
    confirmCancellation,
    sentinelRef,
    paymentLabels,
    formatDateTime,
  }
}
