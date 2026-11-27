'use client'

import { useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { matchesSearch } from '@/lib/search'
import { useProgressiveList } from '@/lib/use-progressive-list'
import type { Supplier } from '../actions'
import { getAllPurchaseHistory, getPurchaseDetailsAction } from './actions'

type PurchaseRow = Awaited<ReturnType<typeof getAllPurchaseHistory>>['purchases'][number]
type PurchaseDetails = Awaited<ReturnType<typeof getPurchaseDetailsAction>>

export interface PurchaseHistoryProps {
  suppliers: Supplier[]
  initialPurchases: PurchaseRow[]
}

function dateInVietnam(value: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(value)
}

export function usePurchaseHistory({
  suppliers,
  initialPurchases,
  sentinelRef,
}: PurchaseHistoryProps & { sentinelRef: RefObject<HTMLDivElement | null> }) {
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [payment, setPayment] = useState<'all' | 'paid' | 'debt'>('all')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [details, setDetails] = useState<PurchaseDetails | null>(null)
  const requestNumber = useRef(0)
  const filteredPurchases = useMemo(() => {
    const today = dateInVietnam(new Date())
    let periodFrom = ''
    let periodTo = ''
    if (period === 'today') {
      periodFrom = today
      periodTo = today
    } else if (period === 'week') {
      const start = new Date(`${today}T12:00:00Z`)
      start.setUTCDate(start.getUTCDate() - 6)
      periodFrom = start.toISOString().slice(0, 10)
      periodTo = today
    } else if (period === 'month') {
      periodFrom = `${today.slice(0, 7)}-01`
      periodTo = today
    }

    const from = fromDate || periodFrom
    const to = toDate || periodTo
    return initialPurchases.filter((purchase) => {
      const purchaseDate = dateInVietnam(purchase.created_at)
      if (from && purchaseDate < from) return false
      if (to && purchaseDate > to) return false
      if (supplierId && purchase.supplier?.id !== supplierId) return false
      if (payment === 'paid' && purchase.debt_amount > 0) return false
      if (payment === 'debt' && purchase.debt_amount <= 0) return false
      return matchesSearch(
        search,
        purchase.code,
        purchase.supplier?.name,
        ...purchase.items.map((item) => item.product_name)
      )
    })
  }, [initialPurchases, search, period, fromDate, toDate, supplierId, payment])
  const totalCount = filteredPurchases.length
  const totalAmount = filteredPurchases.reduce((sum, purchase) => sum + purchase.total_amount, 0)
  const resetKey = JSON.stringify([search, period, fromDate, toDate, supplierId, payment])
  const { visibleCount } = useProgressiveList(totalCount, resetKey, sentinelRef)
  const visiblePurchases = filteredPurchases.slice(0, visibleCount)

  const openDetails = async (id: string) => {
    const request = ++requestNumber.current
    setDetailsOpen(true)
    setDetailsLoading(true)
    setDetailsError('')
    setDetails(null)
    try {
      const result = await getPurchaseDetailsAction(id)
      if (request === requestNumber.current) setDetails(result)
    } catch {
      if (request === requestNumber.current) {
        setDetailsError('Không tải được chi tiết phiếu nhập.')
      }
    } finally {
      if (request === requestNumber.current) setDetailsLoading(false)
    }
  }

  const closeDetails = () => {
    requestNumber.current += 1
    setDetailsOpen(false)
    setDetails(null)
    setDetailsError('')
  }

  const choosePeriod = (nextPeriod: 'all' | 'today' | 'week' | 'month') => {
    setPeriod(nextPeriod)
    setFromDate('')
    setToDate('')
  }

  return {
    suppliers,
    search,
    setSearch,
    period,
    setPeriod,
    choosePeriod,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    supplierId,
    setSupplierId,
    payment,
    setPayment,
    totalCount,
    totalAmount,
    filteredPurchases,
    visiblePurchases,
    openDetails,
    sentinelRef,
    visibleCount,
    detailsOpen,
    closeDetails,
    detailsLoading,
    detailsError,
    details,
    formatDateTime,
    formatQuantity,
  }
}
