'use client'

import { useUser } from '@repo/auth'
import { UserDropdown } from '@repo/ui/components/user-dropdown'
import { Skeleton } from '@repo/ui/components/base/skeleton'
import type { User } from '@repo/types'
import { useRouter } from 'next/navigation'

export function NavUser({ user: userProp }: { user?: User | null }) {
  const { user, loading, logout } = useUser()
  const hydratedUser = userProp ?? user
  const router = useRouter()

  if (loading && !userProp) {
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

  if (!hydratedUser) {
    return null
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  function handleAccountClick() {
    router.push('/account')
  }

  return (
    <UserDropdown user={hydratedUser} onLogout={handleLogout} onAccountClick={handleAccountClick} />
  )
}
