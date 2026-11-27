'use client'

import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

const INITIAL_VISIBLE_COUNT = 24
const VISIBLE_COUNT_INCREMENT = 24

export function useProgressiveList(
  itemCount: number,
  resetKey: string,
  externalSentinelRef?: RefObject<HTMLDivElement | null>
) {
  const [progress, setProgress] = useState({ key: resetKey, count: INITIAL_VISIBLE_COUNT })
  const internalSentinelRef = useRef<HTMLDivElement>(null)
  const sentinelRef = externalSentinelRef ?? internalSentinelRef
  const visibleCount = progress.key === resetKey ? progress.count : INITIAL_VISIBLE_COUNT

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || visibleCount >= itemCount) return

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return
      setProgress((current) => {
        const currentCount = current.key === resetKey ? current.count : INITIAL_VISIBLE_COUNT
        return {
          key: resetKey,
          count: Math.min(currentCount + VISIBLE_COUNT_INCREMENT, itemCount),
        }
      })
    }, { rootMargin: '240px' })

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [itemCount, resetKey, sentinelRef, visibleCount])

  return { sentinelRef, visibleCount }
}
