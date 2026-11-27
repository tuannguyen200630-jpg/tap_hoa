import { connection } from 'next/server'
import { getSuppliers } from '../actions'
import { getAllPurchaseHistory } from './actions'
import { PurchaseHistory } from './purchase-history'
import { getInitialIsDesktop } from '@/lib/device'

export default async function PurchaseHistoryPage() {
  await connection()
  const [suppliers, initialHistory, initialIsDesktop] = await Promise.all([
    getSuppliers(),
    getAllPurchaseHistory(),
    getInitialIsDesktop(),
  ])

  return (
    <PurchaseHistory
      suppliers={suppliers}
      initialPurchases={initialHistory.purchases}
      initialIsDesktop={initialIsDesktop}
    />
  )
}
