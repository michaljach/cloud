import './globals.css'
import '@repo/ui/styles.css'
import type { Metadata } from 'next'
import { UserProvider, WorkspaceProvider } from '@repo/auth'

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
      </body>
    </html>
  )
}
