export interface AppConfig {
  accountAppUrl: string
  notesAppUrl: string
  filesAppUrl: string
}

export function getAppConfig(): AppConfig {
  return {
    accountAppUrl: process.env.NEXT_PUBLIC_ACCOUNT_APP_URL || '/account',
    notesAppUrl: process.env.NEXT_PUBLIC_NOTES_APP_URL || '/notes',
    filesAppUrl: process.env.NEXT_PUBLIC_FILES_APP_URL || '/files'
  }
}

export function getAppConfigForApp(appName: 'account' | 'notes' | 'files'): AppConfig {
  const baseConfig = getAppConfig()

  // For each app, ensure the current app URL is set correctly
  switch (appName) {
    case 'account':
      return {
        ...baseConfig,
        accountAppUrl: '/account' // Current app
      }
    case 'notes':
      return {
        ...baseConfig,
        notesAppUrl: '/notes' // Current app
      }
    case 'files':
      return {
        ...baseConfig,
        filesAppUrl: '/files' // Current app
      }
    default:
      return baseConfig
  }
}
