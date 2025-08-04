import type { Metadata } from 'next'
import { SidebarInset, SidebarProvider } from '@repo/ui/components/base/sidebar'
import { PageSidebar } from '@/components/layout/page-sidebar'
import { PageHeader } from '@/components/layout/page-header'
import { SaveStatusProvider } from '@/providers/save-status-context'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Cloud dashboard'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SaveStatusProvider>
      <SidebarProvider>
        <PageSidebar />
        <SidebarInset>
          <PageHeader title="Notes" />
          <main className="h-[calc(100vh-4rem)] overflow-x-auto max-w-full break-all">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SaveStatusProvider>
  )
}
