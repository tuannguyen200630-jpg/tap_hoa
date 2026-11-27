'use client'

import { useRef } from 'react'
import { useIsDesktop } from '@/lib/use-is-desktop'
import type { PurchaseHistoryProps } from './use-purchase-history'
import { usePurchaseHistory } from './use-purchase-history'
import { PurchaseHistoryDesktopView } from './desktop/purchase-history-desktop-view'
import { PurchaseHistoryMobileView } from './mobile/purchase-history-mobile-view'

export function PurchaseHistory({
  suppliers,
  initialPurchases,
  initialIsDesktop,
}: PurchaseHistoryProps & { initialIsDesktop: boolean }) {
  const isDesktop = useIsDesktop(initialIsDesktop)
  const mobileSentinelRef = useRef<HTMLDivElement>(null)
  const desktopSentinelRef = useRef<HTMLDivElement>(null)
  const sentinelRef = isDesktop ? desktopSentinelRef : mobileSentinelRef
  const model = usePurchaseHistory({ suppliers, initialPurchases, sentinelRef })

  return isDesktop
    ? <PurchaseHistoryDesktopView model={model} />
    : <PurchaseHistoryMobileView model={model} />
}
