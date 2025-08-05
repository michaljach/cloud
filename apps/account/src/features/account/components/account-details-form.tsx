'use client'

import { DetailsForm } from './details-form'
import { User } from '@repo/types'

interface AccountDetailsFormProps {
  user: User
}

export function AccountDetailsForm({ user }: AccountDetailsFormProps) {
  return <DetailsForm user={user} />
}
