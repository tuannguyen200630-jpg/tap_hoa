'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(min-width: 1024px)'

export function useIsDesktop(serverDefault: boolean) {
  return useSyncExternalStore(
    (onChange) => {
      const mediaQuery = window.matchMedia(QUERY)
      mediaQuery.addEventListener('change', onChange)
      return () => mediaQuery.removeEventListener('change', onChange)
    },
    () => window.matchMedia(QUERY).matches,
    () => serverDefault
  )
}
