import './globals.css'
import '@repo/ui/styles.css'
import type { Metadata } from 'next'
import { UserProvider, WorkspaceProvider } from '@repo/contexts'
import { SidebarInset, SidebarProvider } from '@repo/ui/components/base/sidebar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { PageSearch } from '@/components/header/page-search'
import { FilesProvider } from '@/components/providers/files-context'
import { PageHeader } from '@/components/header/page-header'
import { Toaster } from '@repo/ui/components/base/sonner'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Cloud dashboard'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <WorkspaceProvider>
            <FilesProvider>
              <SidebarProvider>
                <div className="flex h-screen">
                  <AppSidebar />
                  <SidebarInset>
                    <PageHeader title="Files">
                      <PageSearch />
                    </PageHeader>
                    <main className="flex-1 overflow-auto">{children}</main>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            </FilesProvider>
          </WorkspaceProvider>
        </UserProvider>
        <Toaster />
      </body>
    </html>
  )
}
