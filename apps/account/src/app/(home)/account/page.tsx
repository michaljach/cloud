import { getServerUser } from '@repo/providers'
import { cookies } from 'next/headers'

import { AccountDetailsForm } from '@/features/account/components/account-details-form'

export default async function AccountPage() {
  const cookiesStore = await cookies()
  const user = await getServerUser({ cookies: () => cookiesStore })

  if (!user) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Not authenticated</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <AccountDetailsForm user={user} />
    </div>
  )
}
