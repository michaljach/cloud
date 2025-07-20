import type { Metadata } from 'next'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@repo/ui/components/base/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@repo/ui/components/base/separator'
import { NavUser } from '@/components/nav-user'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Cloud dashboard'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <h3 className="font-medium">Notes</h3>
          <div className="flex justify-end flex-1">
            <NavUser />
          </div>
        </header>
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
