import { getServerUser } from '@repo/contexts'
import { cookies } from 'next/headers'
import { PasswordChangeForm } from '@/components/forms/password-change-form'

export default async function PasswordChangePage() {
  const cookiesStore = await cookies()
  const user = await getServerUser({ cookies: () => cookiesStore })

  if (!user) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Change Password</h1>
          <p className="text-muted-foreground">
            Update your account password to keep your account secure
          </p>
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
        <h1 className="text-2xl font-bold">Change Password</h1>
        <p className="text-muted-foreground">
          Update your account password to keep your account secure
        </p>
      </div>

      <PasswordChangeForm />
    </div>
  )
}
