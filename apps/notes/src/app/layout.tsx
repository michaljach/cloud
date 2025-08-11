import './globals.css'
import '@repo/ui/styles.css'
import { UserProvider, WorkspaceProvider } from '@repo/providers'
import { Toaster } from '@repo/ui/components/base/sonner'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Cloud dashboard'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </UserProvider>
        <Toaster />
      </body>
    </html>
  )
}
