import { getServerUser } from '@repo/contexts'
import { cookies } from 'next/headers'
import { DetailsForm } from '@/components/details-form'

export default async function AccountPage() {
  const cookiesStore = await cookies()
  const user = await getServerUser({ cookies: () => cookiesStore })

  if (!user) {
    return <div>Not authenticated</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <DetailsForm user={user} />
    </div>
  )
}
