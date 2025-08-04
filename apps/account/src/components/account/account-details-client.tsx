'use client'

import { DetailsForm } from '@/components/forms/details-form'
import { User } from '@repo/types'

interface AccountDetailsClientProps {
  user: User
}

export function AccountDetailsClient({ user }: AccountDetailsClientProps) {
  return <DetailsForm user={user} />
}
