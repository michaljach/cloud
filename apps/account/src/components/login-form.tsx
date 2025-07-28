'use client'

import { useForm } from '@repo/ui/hooks/use-form'
import { useUser } from '@repo/auth'
import { cn } from '@repo/ui/lib/utils'
import { Button } from '@repo/ui/components/base/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@repo/ui/components/base/card'
import { Input } from '@repo/ui/components/base/input'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@repo/ui/components/base/form'
import React from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'> & { redirect?: string }) {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { login } = useUser()
  const form = useForm<{ email: string; password: string }>({
    defaultValues: { email: '', password: '' }
  })
  const {
    handleSubmit,
    formState: { isSubmitting },
    setError
  } = form

  async function onSubmit(values: { email: string; password: string }) {
    try {
      await login(values.email, values.password)
      window.location.href = redirect
    } catch (err: unknown) {
      let message = 'Login failed'
      if (err instanceof Error) message = err.message
      setError('email', { message })
      setError('password', { message })
    }
  }

  return (
    <div className={cn('flex flex-col gap-6 flex-1 max-w-sm', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="m@example.com"
                          required
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" required {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
