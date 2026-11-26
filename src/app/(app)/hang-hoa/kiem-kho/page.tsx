import { getProducts } from '../actions'
import { StocktakeForm } from './stocktake-form'

export default async function KiemKhoPage() {
  const result = await getProducts({ filter: 'all', page: 1, pageSize: 30 })
  return (
    <StocktakeForm
      initialProducts={result.products}
      initialTotalCount={result.totalCount}
    />
  )
}
