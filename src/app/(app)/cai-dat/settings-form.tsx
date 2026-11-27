'use client'

import { useIsDesktop } from '@/lib/use-is-desktop'
import { useSettingsForm, type SettingsFormProps } from './use-settings-form'
import { SettingsDesktopView } from './desktop/settings-desktop-view'
import { SettingsMobileView } from './mobile/settings-mobile-view'

export function SettingsForm({ initialSettings, initialIsDesktop }: SettingsFormProps & { initialIsDesktop: boolean }) {
  const model = useSettingsForm({ initialSettings })
  const isDesktop = useIsDesktop(initialIsDesktop)

  return isDesktop
    ? <SettingsDesktopView model={model} />
    : <SettingsMobileView model={model} />
}
