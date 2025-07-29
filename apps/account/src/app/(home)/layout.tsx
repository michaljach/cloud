import type { Metadata } from 'next'
import { SidebarInset, SidebarProvider } from '@repo/ui/components/base/sidebar'
import { AppSidebarClient } from '@/components/app-sidebar-client'
import { HeaderUserProvider } from '@/components/header-user-provider'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Cloud dashboard'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebarClient />
      <SidebarInset>
        <HeaderUserProvider title="Account" />
        <main className="p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
