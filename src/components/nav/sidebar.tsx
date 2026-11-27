'use client'

import { useIsDesktop } from '@/lib/use-is-desktop'
import { SidebarDesktopView } from './desktop/sidebar-desktop-view'
import { SidebarMobileView } from './mobile/sidebar-mobile-view'
import { useSidebar, type SidebarProps } from './use-sidebar'

export function Sidebar({
  user,
  storeName,
  initialIsDesktop,
}: SidebarProps & { initialIsDesktop: boolean }) {
  const model = useSidebar({ user, storeName })
  const isDesktop = useIsDesktop(initialIsDesktop)

  return isDesktop
    ? <SidebarDesktopView model={model} />
    : <SidebarMobileView model={model} />
}
