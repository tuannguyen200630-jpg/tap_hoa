import 'server-only'

import { headers } from 'next/headers'

export async function getInitialIsDesktop() {
  const requestHeaders = await headers()
  const isMobileHint = requestHeaders.get('sec-ch-ua-mobile') === '?1'
  const userAgent = requestHeaders.get('user-agent') ?? ''

  return !isMobileHint && !/Mobi|Android|iPhone|iPad/i.test(userAgent)
}
