import { getProducts } from '../actions'
import { getInitialIsDesktop } from '@/lib/device'
import { StocktakeForm } from './stocktake-form'

export default async function KiemKhoPage() {
  const result = await getProducts({ filter: 'all', page: 1, pageSize: 30 })
  const initialIsDesktop = await getInitialIsDesktop()
  return (
    <StocktakeForm
      initialProducts={result.products}
      initialTotalCount={result.totalCount}
      initialIsDesktop={initialIsDesktop}
    />
  )
}
