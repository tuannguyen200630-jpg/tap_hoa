import { getCategories } from '../hang-hoa/actions'
import {
  getAllSaleProducts,
  getFavoriteProducts,
  getSaleCustomers,
  getSellOutSetting,
} from './actions'
import { SalesTerminal } from './sales-terminal'
import { getInitialIsDesktop } from '@/lib/device'

export default async function BanHangPage() {
  const [products, categories, favorites, customers, allowSellOut, initialIsDesktop] = await Promise.all([
    getAllSaleProducts(),
    getCategories(),
    getFavoriteProducts(),
    getSaleCustomers(),
    getSellOutSetting(),
    getInitialIsDesktop(),
  ])
  const initialProducts = products.products.map((product) => ({
    id: product.id,
    code: product.code,
    name: product.name,
    barcode: product.barcode,
    category_id: product.category_id,
    unit: product.unit,
    sell_price: product.sell_price,
    stock: Number(product.stock),
    category: product.category,
  }))

  return (
    <SalesTerminal
      categories={categories.map(({ id, name }) => ({ id, name }))}
      initialProducts={initialProducts}
      favoriteProducts={favorites}
      initialCustomers={customers}
      allowSellOut={allowSellOut}
      initialIsDesktop={initialIsDesktop}
    />
  )
}
