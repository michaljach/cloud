import { Suspense } from 'react'

import { SignupForm } from '@/features/auth/components/signup-form'

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
