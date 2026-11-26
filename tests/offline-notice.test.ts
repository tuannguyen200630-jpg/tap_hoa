import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { OfflineNotice } from '@/components/ui/offline-notice'

describe('Thông báo mất kết nối', () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('hiện lời nhắc tiếng Việt khi mở ứng dụng lúc đang ngoại tuyến', () => {
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false })

    render(createElement(OfflineNotice))

    expect(screen.getByRole('status').textContent).toContain(
      'Điện thoại đang mất kết nối internet.'
    )
  })

  it('ẩn lời nhắc khi có mạng trở lại', () => {
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false })
    render(createElement(OfflineNotice))

    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true })
    fireEvent(window, new Event('online'))

    expect(screen.queryByRole('status')).toBeNull()
  })
})
