'use client'

import { User } from '@repo/types'

import { DetailsForm } from './details-form'

interface AccountDetailsFormProps {
  user: User
}

export function AccountDetailsForm({ user }: AccountDetailsFormProps) {
  return <DetailsForm user={user} />
}
