import { getCategories } from '../hang-hoa/actions'
import { getActiveProducts, getSuppliers } from './actions'
import { PurchaseForm } from './purchase-form'
import { getInitialIsDesktop } from '@/lib/device'

export default async function NhapHangPage() {
  const [products, suppliers, categories, initialIsDesktop] = await Promise.all([
    getActiveProducts(),
    getSuppliers(),
    getCategories(),
    getInitialIsDesktop(),
  ])

  return (
    <div className="max-w-7xl mx-auto sm:p-6 lg:p-8">
      <PurchaseForm
        products={products}
        suppliers={suppliers}
        categories={categories}
        initialIsDesktop={initialIsDesktop}
      />
    </div>
  )
}
