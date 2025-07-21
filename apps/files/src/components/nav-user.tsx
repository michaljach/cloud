'use client'

import { useUser } from '@repo/auth'
import { UserDropdown } from '@repo/ui/components/user-dropdown'
import { useRouter } from 'next/navigation'

const accountUrl = process.env.NEXT_PUBLIC_ACCOUNT_APP_URL

export function NavUser() {
  const { user, logout } = useUser()
  const router = useRouter()

  function handleAccountClick() {
    if (accountUrl) {
      router.push(`${accountUrl}/account`)
    } else {
      router.push('/account')
    }
  }

  return <UserDropdown user={user} onLogout={logout} onAccountClick={handleAccountClick} />
}
