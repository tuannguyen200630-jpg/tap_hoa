import {
  getAllProducts,
  getCategories,
  getExistingUnits,
  getDefaultMinStockThreshold,
} from './actions'
import { ProductList } from './product-list'
import { getInitialIsDesktop } from '@/lib/device'

export default async function HangHoaPage() {
  const [productPage, categories, units, defaultMinStock, initialIsDesktop] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getExistingUnits(),
    getDefaultMinStockThreshold(),
    getInitialIsDesktop(),
  ])

  return (
    <div className="max-w-7xl mx-auto sm:p-6 lg:p-8">
      <ProductList
        initialProducts={productPage.products}
        categories={categories}
        units={units}
        defaultMinStock={defaultMinStock}
        initialIsDesktop={initialIsDesktop}
      />
    </div>
  )
}
