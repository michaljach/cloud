'use client'

import React, { useEffect, useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@repo/ui/components/base/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@repo/ui/components/base/select'
import { useUser } from '@repo/auth'
import { updateUser } from '@repo/api'
import type { User } from '@repo/types'

interface UserEditModalProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UserEditModal({ user, open, onOpenChange, onSuccess }: UserEditModalProps) {
  const { accessToken } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<{
    fullName: string
    role: string
    workspaceId: string
    storageLimitMB: number
  }>({
    defaultValues: {
      fullName: '',
      role: 'user',
      workspaceId: '',
      storageLimitMB: 1024 // Default 1GB
    }
  })

  const {
    handleSubmit,
    formState: { isSubmitting: formSubmitting },
    setError: setFormError,
    reset,
    watch
  } = form

  const currentUser = useUser().user
  const canEditRole = currentUser?.role === 'root_admin'
  const canEditWorkspace = currentUser?.role === 'root_admin'

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || '',
        role: user.role,
        workspaceId: user.workspaceId || '',
        storageLimitMB: user.storageLimit || 1024
      })
    }
  }, [user, reset])

  async function handleFormSubmit(values: {
    fullName: string
    role: string
    workspaceId: string
    storageLimitMB: number
  }) {
    if (!accessToken || !user) return

    setIsSubmitting(true)
    setError(null)

    try {
      const updateData: {
        fullName?: string
        role?: string
        workspaceId?: string
        storageLimitMB?: number
      } = {}

      // Only include fields that have changed
      if (values.fullName !== user.fullName) {
        updateData.fullName = values.fullName
      }

      if (canEditRole && values.role !== user.role) {
        updateData.role = values.role
      }

      if (canEditWorkspace && values.workspaceId !== user.workspaceId) {
        updateData.workspaceId = values.workspaceId || undefined
      }

      if (values.storageLimitMB !== user.storageLimit) {
        updateData.storageLimitMB = values.storageLimitMB
      }

      // Only make the API call if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateUser(accessToken, user.id, updateData)
        onSuccess()
        onOpenChange(false)
      } else {
        onOpenChange(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. Only root admins can change roles and workspace assignments.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter full name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canEditRole && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="root_admin">Root Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {canEditWorkspace && (
              <FormField
                control={form.control}
                name="workspaceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workspace ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter workspace ID (optional)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="storageLimitMB"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Limit</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select storage limit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1024">1 GB</SelectItem>
                      <SelectItem value="5120">5 GB</SelectItem>
                      <SelectItem value="10240">10 GB</SelectItem>
                      <SelectItem value="102400">100 GB</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
