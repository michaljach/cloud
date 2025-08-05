import type { Metadata } from 'next'
import { SidebarInset, SidebarProvider } from '@repo/ui/components/base/sidebar'
import { PageSidebar } from '@/features/layout/page-sidebar'
import { PageHeader } from '@/features/layout/page-header'
import { SaveStatusProvider } from '@/features/notes/providers/status-provider'
import { NotesProvider } from '@/features/notes/providers/notes-provider'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Cloud dashboard'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SaveStatusProvider>
      <NotesProvider>
        <SidebarProvider>
          <PageSidebar />
          <SidebarInset>
            <PageHeader title="Notes" />
            <main className="h-[calc(100vh-4rem)] overflow-x-auto max-w-full break-all">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </NotesProvider>
    </SaveStatusProvider>
  )
}
