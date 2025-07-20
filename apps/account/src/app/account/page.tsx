import { DetailsForm } from '@/components/details-form'
import { getServerUser } from '@repo/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Account | Cloud',
  description: 'Manage your account details and settings.'
}

export default async function AccountPage() {
  const cookiesStore = await cookies()
  const user = await getServerUser({ cookies: () => cookiesStore })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-2">Account settings</h1>
      <p className="text-muted-foreground mb-8">
        Update your personal information and account preferences.
      </p>
      <DetailsForm user={user} />
    </div>
  )
}
