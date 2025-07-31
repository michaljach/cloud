import type { Metadata } from 'next'
import { SidebarInset, SidebarProvider } from '@repo/ui/components/base/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { HeaderUserProvider } from '@/components/header-user-provider'
import { SaveStatusProvider } from '@/components/save-status-context'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Cloud dashboard'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SaveStatusProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <HeaderUserProvider title="Notes" />
          <main className="h-[calc(100vh-4rem)] overflow-x-auto max-w-full break-all">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SaveStatusProvider>
  )
}
