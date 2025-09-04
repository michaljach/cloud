import './globals.css'
import '@repo/ui/styles.css'
import { UserProvider, WorkspaceProvider } from '@repo/providers'
import { SidebarInset, SidebarProvider } from '@repo/ui/components/base/sidebar'
import { Toaster } from '@repo/ui/components/base/sonner'

import type { Metadata } from 'next'

import { FilesProvider } from '@/features/files/providers/files-context-provider'
import { FilesPageHeader } from '@/features/layout/page-header'
import { SearchClient } from '@/features/layout/page-search'
import { AppSidebar } from '@/features/layout/page-sidebar'

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
                <AppSidebar />
                <SidebarInset>
                  <FilesPageHeader title="Files">
                    <SearchClient placeholder="Search files..." className="w-full max-w-sm ml-4" />
                  </FilesPageHeader>
                  <main className="p-8">{children}</main>
                  <Toaster />
                </SidebarInset>
              </SidebarProvider>
            </FilesProvider>
          </WorkspaceProvider>
        </UserProvider>
      </body>
    </html>
  )
}
