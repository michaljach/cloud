import { useRouter } from 'next/navigation'

// Navigation helpers for account app
export function useLogoutAndRedirect(logout: () => Promise<void>) {
  const router = useRouter()
  return async function handleLogout() {
    await logout()
    router.push('/login')
  }
}

export function useAccountRedirect() {
  const router = useRouter()
  return function handleAccountClick() {
    router.push('/account')
  }
}
