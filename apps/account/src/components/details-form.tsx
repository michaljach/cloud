'use client'

import React, { useEffect } from 'react'
import { useForm } from '@repo/ui/hooks/use-form'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@repo/ui/components/base/form'
import { Input } from '@repo/ui/components/base/input'
import { Button } from '@repo/ui/components/base/button'
import { useUser } from '@repo/auth'
import { updateCurrentUser } from '@repo/api'
import type { User } from '@repo/types'

export function DetailsForm({ user }: { user: User }) {
  const { accessToken, updateUser } = useUser()
  const form = useForm<{ fullName: string }>({
    defaultValues: { fullName: user?.fullName ?? '' }
  })
  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    setError,
    reset
  } = form
  const [success, setSuccess] = React.useState(false)

  useEffect(() => {
    reset({ fullName: user?.fullName ?? '' })
  }, [user, reset])

  async function handleFormSubmit(values: { fullName: string }) {
    setSuccess(false)
    if (!values.fullName.trim()) {
      setError('fullName', { message: 'Full name is required' })
      return
    }
    try {
      if (!accessToken) throw new Error('Not authenticated')
      const updatedUser = await updateCurrentUser(accessToken, values.fullName.trim())
      setSuccess(true)
      updateUser(updatedUser)
    } catch (err) {
      setError('fullName', {
        message: err instanceof Error ? err.message : 'Failed to update name'
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4 max-w-sm">
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <Input value={user?.username ?? ''} disabled />
          </FormControl>
        </FormItem>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter your full name" disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {success && <div className="text-green-600 text-sm">Name updated!</div>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </Form>
  )
}
