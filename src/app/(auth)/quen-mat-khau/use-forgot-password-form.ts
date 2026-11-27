'use client'

export function useForgotPasswordForm() {
  return { backHref: '/dang-nhap' }
}

export type ForgotPasswordFormModel = ReturnType<typeof useForgotPasswordForm>
