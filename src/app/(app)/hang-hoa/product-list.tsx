'use client'

import { useRef } from 'react'
import { useIsDesktop } from '@/lib/use-is-desktop'
import { useProductList, type ProductListProps } from './use-product-list'
import { ProductDesktopView } from './desktop/product-desktop-view'
import { ProductMobileView } from './mobile/product-mobile-view'

export function ProductList({
  initialProducts,
  categories,
  units,
  defaultMinStock,
  initialIsDesktop,
}: ProductListProps & { initialIsDesktop: boolean }) {
  const isDesktop = useIsDesktop(initialIsDesktop)
  const mobileSentinelRef = useRef<HTMLDivElement>(null)
  const desktopSentinelRef = useRef<HTMLDivElement>(null)
  const sentinelRef = isDesktop ? desktopSentinelRef : mobileSentinelRef
  const model = useProductList({ initialProducts, categories, units, defaultMinStock, sentinelRef })

  return isDesktop
    ? <ProductDesktopView model={model} />
    : <ProductMobileView model={model} />
}
