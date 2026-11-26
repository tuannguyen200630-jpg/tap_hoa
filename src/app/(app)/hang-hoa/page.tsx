import {
  getAllProducts,
  getCategories,
  getExistingUnits,
  getDefaultMinStockThreshold,
} from './actions'
import { ProductList } from './product-list'

export default async function HangHoaPage() {
  const [productPage, categories, units, defaultMinStock] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getExistingUnits(),
    getDefaultMinStockThreshold(),
  ])

  return (
    <div className="max-w-7xl mx-auto p-4 max-sm:p-3 sm:p-6 lg:p-8">
      <ProductList
        initialProducts={productPage.products}
        categories={categories}
        units={units}
        defaultMinStock={defaultMinStock}
      />
    </div>
  )
}
