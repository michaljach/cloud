'use client'

import { registerUser } from '@repo/api'
import { useUser } from '@repo/providers'
import { Button } from '@repo/ui/components/base/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@repo/ui/components/base/card'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@repo/ui/components/base/form'
import { Input } from '@repo/ui/components/base/input'
import { useForm } from '@repo/ui/hooks/use-form'
import { cn } from '@repo/ui/lib/utils'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React from 'react'

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<'div'> & { redirect?: string }) {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const { login } = useUser()
  const form = useForm<{
    username: string
    password: string
    confirmPassword: string
  }>({
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: ''
    }
  })
  const {
    handleSubmit,
    formState: { isSubmitting },
    setError
  } = form

  async function onSubmit(values: { username: string; password: string; confirmPassword: string }) {
    // Validate password confirmation
    if (values.password !== values.confirmPassword) {
      setError('confirmPassword', { message: 'Passwords do not match' })
      return
    }

    try {
      // Register the user
      await registerUser(values.username, values.password)

      // Automatically log in the user after successful registration
      await login(values.username, values.password)

      window.location.href = redirect
    } catch (err: unknown) {
      let message = 'Registration failed'
      if (err instanceof Error) message = err.message
      setError('username', { message })
      setError('password', { message })
    }
  }

  return (
    <div className={cn('flex flex-col gap-6 flex-1 max-w-sm', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Enter your details below to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="johndoe"
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" required {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating account...' : 'Create account'}
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/auth/signin" className="underline underline-offset-4">
                  Login
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
