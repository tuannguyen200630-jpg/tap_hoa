import { getAllDebtContacts } from './actions'
import { DebtLedger } from './debt-ledger'
import { getInitialIsDesktop } from '@/lib/device'

export default async function SoNoPage() {
  const [customers, suppliers, initialIsDesktop] = await Promise.all([
    getAllDebtContacts({ targetType: 'customer' }),
    getAllDebtContacts({ targetType: 'supplier' }),
    getInitialIsDesktop(),
  ])

  return <DebtLedger initialCustomers={customers} initialSuppliers={suppliers} initialIsDesktop={initialIsDesktop} />
}
