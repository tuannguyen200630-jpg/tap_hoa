'use client'

import { useRef } from 'react'
import type { SaleCustomer, SaleProduct } from './actions'
import { useIsDesktop } from '@/lib/use-is-desktop'
import { SalesDesktopView } from './desktop/sales-desktop-view'
import { SalesMobileView } from './mobile/sales-mobile-view'
import { useSalesTerminal, type Category, type SaleDisplayProduct } from './use-sales-terminal'

export function SalesTerminal({
  categories,
  initialProducts,
  favoriteProducts,
  initialCustomers,
  allowSellOut,
  initialIsDesktop,
}: {
  categories: Category[]
  initialProducts: SaleDisplayProduct[]
  favoriteProducts: SaleProduct[]
  initialCustomers: SaleCustomer[]
  allowSellOut: boolean
  initialIsDesktop: boolean
}) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isDesktop = useIsDesktop(initialIsDesktop)
  const model = useSalesTerminal({
    categories,
    initialProducts,
    favoriteProducts,
    initialCustomers,
    allowSellOut,
    searchInputRef,
    sentinelRef,
  })

  return isDesktop
    ? <SalesDesktopView model={model} searchInputRef={searchInputRef} sentinelRef={sentinelRef} />
    : <SalesMobileView model={model} searchInputRef={searchInputRef} sentinelRef={sentinelRef} />
}
