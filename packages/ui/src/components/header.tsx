import { AppWindow, GripHorizontal } from 'lucide-react'
import * as React from 'react'

import { cn } from '../lib/utils'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from './base/dropdown-menu'
import { Separator } from './base/separator'
import { SidebarTrigger } from './base/sidebar'
import { Skeleton } from './base/skeleton'
import { UserDropdown } from './user-dropdown'

import type { User } from '@repo/types'


interface HeaderProps {
  title: React.ReactNode
  children?: React.ReactNode // For things like search bar
  user: User | null
  onLogout?: () => void
  onAccountClick?: () => void
  className?: string
  loading?: boolean
  appsLinks?: Array<{
    label: string
    href: string
    icon?: React.ReactNode
  }>
}

export function Header({
  title,
  children,
  user,
  onLogout,
  onAccountClick,
  className,
  loading,
  appsLinks = []
}: HeaderProps) {
  return (
    <header className={cn('flex h-16 shrink-0 items-center gap-2 border-b px-4', className)}>
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <h3 className="font-medium">{title}</h3>
      {children}
      <div className="flex justify-end flex-1 items-center gap-2">
        {appsLinks.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent focus:outline-none focus:ring-2 focus:ring-accent"
                aria-label="Open apps menu"
                type="button"
              >
                <GripHorizontal />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4} className="min-w-40">
              {appsLinks.map((link) => (
                <DropdownMenuItem asChild key={link.href}>
                  <a href={link.href} className="flex items-center gap-2">
                    {link.icon}
                    {link.label}
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
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
