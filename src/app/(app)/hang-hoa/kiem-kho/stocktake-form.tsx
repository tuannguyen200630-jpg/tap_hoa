'use client'

import { useIsDesktop } from '@/lib/use-is-desktop'
import { useStocktakeForm, type StocktakeFormProps } from './use-stocktake-form'
import { StocktakeDesktopView } from './desktop/stocktake-desktop-view'
import { StocktakeMobileView } from './mobile/stocktake-mobile-view'

export function StocktakeForm({ initialProducts, initialTotalCount, initialIsDesktop }: StocktakeFormProps & { initialIsDesktop: boolean }) {
  const model = useStocktakeForm({ initialProducts, initialTotalCount })
  const isDesktop = useIsDesktop(initialIsDesktop)

  return isDesktop
    ? <StocktakeDesktopView model={model} />
    : <StocktakeMobileView model={model} />
}
