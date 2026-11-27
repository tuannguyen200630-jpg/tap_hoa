import { getInitialIsDesktop } from '@/lib/device'
import { ForgotPasswordForm } from './forgot-password-form'

export default async function ForgotPasswordPage() {
  const initialIsDesktop = await getInitialIsDesktop()
  return <ForgotPasswordForm initialIsDesktop={initialIsDesktop} />
}
