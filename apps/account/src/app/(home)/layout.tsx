import { SidebarProvider, SidebarInset } from '@repo/ui/components/base/sidebar'

import type { Metadata } from 'next'

import { AccountPageHeader } from '@/features/layout/page-header'
import { PageSidebar } from '@/features/layout/page-sidebar'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Cloud dashboard'
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <PageSidebar />
      <SidebarInset>
        <AccountPageHeader title="Account" />
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
