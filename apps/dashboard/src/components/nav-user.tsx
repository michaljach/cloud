'use client'

import { useUser } from '@repo/auth'
import { UserDropdown } from '@repo/ui/components/user-dropdown'

export function NavUser() {
  const { user, logout } = useUser()

  console.log(user)

  return <UserDropdown user={user} onLogout={logout} />
}
