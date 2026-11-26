import { getAllDebtContacts } from './actions'
import { DebtLedger } from './debt-ledger'

export default async function SoNoPage() {
  const [customers, suppliers] = await Promise.all([
    getAllDebtContacts({ targetType: 'customer' }),
    getAllDebtContacts({ targetType: 'supplier' }),
  ])

  return <DebtLedger initialCustomers={customers} initialSuppliers={suppliers} />
}
