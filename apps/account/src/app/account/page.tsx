import { DetailsForm } from '@/components/details-form'

export const metadata = {
  title: 'Account | Cloud',
  description: 'Manage your account details and settings.'
}

export default function AccountPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-2">Account settings</h1>
      <p className="text-muted-foreground mb-8">
        Update your personal information and account preferences.
      </p>
      <DetailsForm />
    </div>
  )
}
