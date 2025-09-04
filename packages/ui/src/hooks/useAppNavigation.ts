import { useRouter } from 'next/navigation'
import { useUser } from '@repo/providers'

export interface AppNavigationConfig {
  accountAppUrl: string
  notesAppUrl: string
  filesAppUrl: string
}

export function useAppNavigation(config: AppNavigationConfig) {
  const router = useRouter()
  const { logout } = useUser()

  const handleAccountClick = () => {
    router.push(`${config.accountAppUrl}/account`)
  }

  const handleLogoutClick = async () => {
    await logout()
    router.push(`${config.accountAppUrl}/auth/signin`)
  }

  const handleAdminClick = () => {
    router.push(`${config.accountAppUrl}/admin`)
  }

  const getAppsLinks = () => [
    {
      label: 'Notes',
      href: config.notesAppUrl || '/notes',
      icon: 'FileText' as const
    },
    {
      label: 'Files',
      href: config.filesAppUrl || '/files',
      icon: 'File' as const
    },
    {
      label: 'Account',
      href: config.accountAppUrl || '/account',
      icon: 'User' as const
    }
  ]

  return {
    handleAccountClick,
    handleLogoutClick,
    handleAdminClick,
    getAppsLinks
  }
}
