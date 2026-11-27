'use client'

import { useRef } from 'react'
import { useIsDesktop } from '@/lib/use-is-desktop'
import { DebtDesktopView } from './desktop/debt-desktop-view'
import { DebtMobileView } from './mobile/debt-mobile-view'
import { useDebtLedger, type DebtLedgerProps } from './use-debt-ledger'

export function DebtLedger({ initialCustomers, initialSuppliers, initialIsDesktop }: DebtLedgerProps & { initialIsDesktop: boolean }) {
  const isDesktop = useIsDesktop(initialIsDesktop)
  const mobileSentinelRef = useRef<HTMLDivElement>(null)
  const desktopSentinelRef = useRef<HTMLDivElement>(null)
  const sentinelRef = isDesktop ? desktopSentinelRef : mobileSentinelRef
  const model = useDebtLedger({ initialCustomers, initialSuppliers, sentinelRef })

  return isDesktop
    ? <DebtDesktopView model={model} />
    : <DebtMobileView model={model} />
}
