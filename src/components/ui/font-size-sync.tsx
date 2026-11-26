'use client'

import { useEffect } from 'react'

type FontSize = 'medium' | 'large' | 'xlarge'

export function FontSizeSync({
  fontSize,
  children,
}: {
  fontSize: FontSize
  children: React.ReactNode
}) {
  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize
  }, [fontSize])

  return (
    <div data-font-size={fontSize} className="contents">
      {children}
    </div>
  )
}
