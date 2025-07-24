import type { Metadata } from 'next'
import { SidebarInset, SidebarProvider } from '@repo/ui/components/base/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { HeaderUserProvider } from '@/components/header-user-provider'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Cloud dashboard'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderUserProvider title="Account" />
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
