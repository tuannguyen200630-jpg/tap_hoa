'use client'

import { useIsDesktop } from '@/lib/use-is-desktop'
import { useForgotPasswordForm } from './use-forgot-password-form'
import { ForgotPasswordDesktopView } from './desktop/forgot-password-desktop-view'
import { ForgotPasswordMobileView } from './mobile/forgot-password-mobile-view'

export function ForgotPasswordForm({ initialIsDesktop }: { initialIsDesktop: boolean }) {
  const model = useForgotPasswordForm()
  const isDesktop = useIsDesktop(initialIsDesktop)

  return isDesktop
    ? <ForgotPasswordDesktopView model={model} />
    : <ForgotPasswordMobileView model={model} />
}
