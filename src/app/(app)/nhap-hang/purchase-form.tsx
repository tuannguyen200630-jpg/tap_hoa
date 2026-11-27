'use client'

import { useRef } from 'react'
import { useIsDesktop } from '@/lib/use-is-desktop'
import { PurchaseDesktopView } from './desktop/purchase-desktop-view'
import { PurchaseMobileView } from './mobile/purchase-mobile-view'
import { usePurchaseForm, type PurchaseFormProps } from './use-purchase-form'

export function PurchaseForm({
  products,
  suppliers,
  categories,
  initialIsDesktop,
}: PurchaseFormProps & { initialIsDesktop: boolean }) {
  const isDesktop = useIsDesktop(initialIsDesktop)
  const mobileSearchRef = useRef<HTMLInputElement>(null)
  const desktopSearchRef = useRef<HTMLInputElement>(null)
  const mobileAllProductsSentinelRef = useRef<HTMLDivElement>(null)
  const desktopAllProductsSentinelRef = useRef<HTMLDivElement>(null)
  const mobileLowStockSentinelRef = useRef<HTMLDivElement>(null)
  const desktopLowStockSentinelRef = useRef<HTMLDivElement>(null)
  const refs = isDesktop
    ? {
        searchRef: desktopSearchRef,
        allProductsSentinelRef: desktopAllProductsSentinelRef,
        lowStockSentinelRef: desktopLowStockSentinelRef,
      }
    : {
        searchRef: mobileSearchRef,
        allProductsSentinelRef: mobileAllProductsSentinelRef,
        lowStockSentinelRef: mobileLowStockSentinelRef,
      }
  const model = usePurchaseForm({
    products,
    suppliers,
    categories,
    ...refs,
  })

  return isDesktop
    ? <PurchaseDesktopView model={model} {...refs} />
    : <PurchaseMobileView model={model} {...refs} />
}
