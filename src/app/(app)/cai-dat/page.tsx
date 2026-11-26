import { getStoreSettings } from './actions'
import { SettingsForm } from './settings-form'

export default async function CaiDatPage() {
  const settings = await getStoreSettings()
  return <SettingsForm initialSettings={settings} />
}
