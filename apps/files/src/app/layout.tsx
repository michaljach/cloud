import './globals.css'
import '@repo/ui/styles.css'
import type { Metadata } from 'next'
import { UserProvider } from '@repo/auth'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@repo/ui/components/base/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@repo/ui/components/base/separator'
import { NavUser } from '@/components/nav-user'
import { SearchClient } from '@/components/search-client'
import { FilesProvider } from '@/components/files-context'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Cloud dashboard'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <FilesProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator
                    orientation="vertical"
                    className="mr-2 data-[orientation=vertical]:h-4"
                  />
                  <h3 className="font-medium">Files</h3>
                  <SearchClient placeholder="Search files..." className="w-full max-w-sm ml-4" />
                  <div className="flex justify-end flex-1">
                    <NavUser />
                  </div>
                </header>
                <main className="p-4">{children}</main>
              </SidebarInset>
            </SidebarProvider>
          </FilesProvider>
        </UserProvider>
      </body>
    </html>
  )
}
