'use client'

import { useState } from 'react'
import type * as React from 'react'
import { useRouter } from 'next/navigation'
import { changePasswordAction, saveStoreSettingsAction, type StoreSettings } from './actions'

export interface SettingsFormProps { initialSettings: StoreSettings }

export function useSettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter()
  const [settings, setSettings] = useState(initialSettings)
  const [settingsError, setSettingsError] = useState('')
  const [settingsNotice, setSettingsNotice] = useState('')
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordNotice, setPasswordNotice] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  async function submitSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSettingsError('')
    setSettingsNotice('')
    setIsSavingSettings(true)

    try {
      const result = await saveStoreSettingsAction(settings)
      if (result.error) {
        setSettingsError(result.error)
        return
      }
      document.documentElement.dataset.fontSize = settings.font_size
      setSettingsNotice('Đã lưu cài đặt.')
      router.refresh()
    } catch (error: unknown) {
      setSettingsError(error instanceof Error ? error.message : 'Không lưu được cài đặt.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError('')
    setPasswordNotice('')
    setIsSavingPassword(true)

    try {
      const result = await changePasswordAction({ password, confirmPassword })
      if (result.error) {
        setPasswordError(result.error)
        return
      }
      setPassword('')
      setConfirmPassword('')
      setPasswordNotice('Đã đổi mật khẩu.')
    } catch (error: unknown) {
      setPasswordError(error instanceof Error ? error.message : 'Không đổi được mật khẩu.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  return {
    router,
    settings,
    setSettings,
    settingsError,
    setSettingsError,
    settingsNotice,
    setSettingsNotice,
    isSavingSettings,
    setIsSavingSettings,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    setPasswordError,
    passwordNotice,
    setPasswordNotice,
    isSavingPassword,
    setIsSavingPassword,
    submitSettings,
    submitPassword,
  }
}

export type SettingsFormModel = ReturnType<typeof useSettingsForm>
