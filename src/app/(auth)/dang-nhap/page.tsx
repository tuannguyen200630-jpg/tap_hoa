import { getInitialIsDesktop } from '@/lib/device'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  const initialIsDesktop = await getInitialIsDesktop()
  return <LoginForm initialIsDesktop={initialIsDesktop} />
}
