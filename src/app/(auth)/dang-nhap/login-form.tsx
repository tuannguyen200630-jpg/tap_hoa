'use client'

import { useIsDesktop } from '@/lib/use-is-desktop'
import { useLoginForm } from './use-login-form'
import { LoginDesktopView } from './desktop/login-desktop-view'
import { LoginMobileView } from './mobile/login-mobile-view'

export function LoginForm({ initialIsDesktop }: { initialIsDesktop: boolean }) {
  const model = useLoginForm()
  const isDesktop = useIsDesktop(initialIsDesktop)

  return isDesktop
    ? <LoginDesktopView model={model} />
    : <LoginMobileView model={model} />
}
