import { getInitialIsDesktop } from '@/lib/device'
import { getStoreSettings } from './actions'
import { SettingsForm } from './settings-form'

export default async function CaiDatPage() {
  const settings = await getStoreSettings()
  const initialIsDesktop = await getInitialIsDesktop()
  return <SettingsForm initialSettings={settings} initialIsDesktop={initialIsDesktop} />
}
