'use client'

import { useUser } from '@repo/auth'
import { UserDropdown } from '@repo/ui/components/user-dropdown'
import { Skeleton } from '@repo/ui/components/base/skeleton'

export function NavUser() {
  const { user, loading, logout } = useUser()

  if (loading) {
    return (
      <div className="flex items-center gap-3 min-w-48">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <Skeleton className="h-4 w-4 rounded ml-auto" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <UserDropdown user={user} onLogout={logout} />
}
