import './globals.css'
import '@repo/ui/styles.css'
import type { Metadata } from 'next'
import { UserProvider } from '@repo/auth'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Cloud dashboard'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  )
}
