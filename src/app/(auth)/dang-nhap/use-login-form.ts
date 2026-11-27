'use client'

import { useState, useTransition } from 'react'
import type * as React from 'react'
import { createClient } from '@/lib/supabase/client'

export function useLoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || 'Cửa hàng tạp hóa'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      setError('Vui lòng nhập email và mật khẩu.')
      return
    }

    startTransition(async () => {
      let supabase
      try {
        supabase = createClient()
      } catch (err: unknown) {
        console.error('Unable to initialize browser auth client:', err)
        setError('Không thể khởi tạo đăng nhập. Vui lòng tải lại trang và thử lại.')
        return
      }

      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          if (signInError.code === 'invalid_credentials' || signInError.status === 400) {
            setError('Email hoặc mật khẩu không đúng. Vui lòng thử lại.')
          } else if (
            signInError.name === 'AuthRetryableFetchError' ||
            signInError.status === 0 ||
            (signInError.status !== undefined && signInError.status >= 500)
          ) {
            setError('Không thể kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.')
          } else {
            setError('Không thể đăng nhập lúc này. Vui lòng thử lại.')
          }
          return
        }

        window.location.assign('/ban-hang')
      } catch (err: unknown) {
        console.error('Login request failed:', err)
        setError('Không thể kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.')
      }
    })
  }

  return {
    error,
    setError,
    showPassword,
    setShowPassword,
    isPending,
    startTransition,
    storeName,
    handleSubmit,
  }
}

export type LoginFormModel = ReturnType<typeof useLoginForm>
