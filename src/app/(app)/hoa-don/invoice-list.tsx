'use client'

import { useRef } from 'react'
import { useIsDesktop } from '@/lib/use-is-desktop'
import { InvoiceDesktopView } from './desktop/invoice-desktop-view'
import { InvoiceMobileView } from './mobile/invoice-mobile-view'
import { useInvoiceList, type InvoiceListProps } from './use-invoice-list'

export function InvoiceList({ initialDate, initialSales, initialIsDesktop }: InvoiceListProps & { initialIsDesktop: boolean }) {
  const isDesktop = useIsDesktop(initialIsDesktop)
  const mobileSentinelRef = useRef<HTMLDivElement>(null)
  const desktopSentinelRef = useRef<HTMLDivElement>(null)
  const sentinelRef = isDesktop ? desktopSentinelRef : mobileSentinelRef
  const model = useInvoiceList({ initialDate, initialSales, sentinelRef })

  return isDesktop
    ? <InvoiceDesktopView model={model} />
    : <InvoiceMobileView model={model} />
}
