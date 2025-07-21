'use client'

import { useSearchParams } from 'next/navigation'
import { LoginForm } from '@/components/login-form'

export function LoginRedirectProp() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  return <LoginForm redirect={redirect} />
}
