import * as React from 'react'
import { SidebarTrigger } from './base/sidebar'
import { Separator } from './base/separator'
import { cn } from '../lib/utils'
import { UserDropdown } from './user-dropdown'
import { Skeleton } from './base/skeleton'
import type { User } from '@repo/types'

interface HeaderProps {
  title: React.ReactNode
  children?: React.ReactNode // For things like search bar
  user: User | null
  onLogout?: () => void
  onAccountClick?: () => void
  className?: string
  loading?: boolean
}

export function Header({
  title,
  children,
  user,
  onLogout,
  onAccountClick,
  className,
  loading
}: HeaderProps) {
  return (
    <header className={cn('flex h-16 shrink-0 items-center gap-2 border-b px-4', className)}>
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <h3 className="font-medium">{title}</h3>
      {children}
      <div className="flex justify-end flex-1">
        {loading ? (
          <div className="flex items-center gap-3 min-w-48">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <Skeleton className="h-4 w-4 rounded ml-auto" />
          </div>
        ) : (
          <UserDropdown user={user} onLogout={onLogout} onAccountClick={onAccountClick} />
        )}
      </div>
    </header>
  )
}

export default Header
