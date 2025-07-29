import './globals.css'
import '@repo/ui/styles.css'
import type { Metadata } from 'next'
import { UserProvider, WorkspaceProvider } from '@repo/auth'
import { SidebarInset, SidebarProvider } from '@repo/ui/components/base/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { SearchClient } from '@/components/search-client'
import { FilesProvider } from '@/components/files-context'
import { HeaderUserProvider } from '@/components/header-user-provider'
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
                <AppSidebar />
                <SidebarInset>
                  <HeaderUserProvider title="Files">
                    <SearchClient placeholder="Search files..." className="w-full max-w-sm ml-4" />
                  </HeaderUserProvider>
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
