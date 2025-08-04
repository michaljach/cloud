import type { Metadata } from 'next'
import { SidebarProvider, SidebarInset } from '@repo/ui/components/base/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { PageHeader } from '@/components/header/page-header'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Cloud dashboard'
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <PageHeader title="Account" />
          <main className="flex-1 overflow-auto">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
