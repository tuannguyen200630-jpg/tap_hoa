import { getCategories } from '../hang-hoa/actions'
import { getActiveProducts, getSuppliers } from './actions'
import { PurchaseForm } from './purchase-form'

export default async function NhapHangPage() {
  const [products, suppliers, categories] = await Promise.all([
    getActiveProducts(),
    getSuppliers(),
    getCategories(),
  ])

  return (
    <div className="max-w-7xl mx-auto p-4 max-sm:p-3 sm:p-6 lg:p-8">
      <PurchaseForm products={products} suppliers={suppliers} categories={categories} />
    </div>
  )
}
