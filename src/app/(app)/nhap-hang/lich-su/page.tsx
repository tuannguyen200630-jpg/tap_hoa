import { connection } from 'next/server'
import { getSuppliers } from '../actions'
import { getAllPurchaseHistory } from './actions'
import { PurchaseHistory } from './purchase-history'

export default async function PurchaseHistoryPage() {
  await connection()
  const [suppliers, initialHistory] = await Promise.all([
    getSuppliers(),
    getAllPurchaseHistory(),
  ])

  return (
    <PurchaseHistory
      suppliers={suppliers}
      initialPurchases={initialHistory.purchases}
    />
  )
}
