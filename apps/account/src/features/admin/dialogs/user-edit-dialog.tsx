'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@repo/ui/components/base/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@repo/ui/components/base/form'
import { Input } from '@repo/ui/components/base/input'
import { Button } from '@repo/ui/components/base/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@repo/ui/components/base/select'
import { useUser } from '@repo/providers'
import { updateUser } from '@repo/api'
import type { User } from '@repo/types'

interface UserEditDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const updateUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  storageLimitMB: z
    .number()
    .min(1, 'Storage limit must be at least 1 MB')
    .max(1000000, 'Storage limit cannot exceed 1000GB')
})

type UpdateUserFormData = z.infer<typeof updateUserSchema>

export function UserEditDialog({ user, open, onOpenChange, onSuccess }: UserEditDialogProps) {
  const { accessToken } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      fullName: '',
      storageLimitMB: 1024 // Default 1GB
    }
  })

  const {
    handleSubmit,
    formState: { isSubmitting: formSubmitting },
    setError: setFormError,
    reset
  } = form

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || '',
        storageLimitMB: user.storageLimit || 1024
      })
    }
  }, [user, reset])

  async function handleFormSubmit(values: UpdateUserFormData) {
    if (!accessToken || !user) return

    setIsSubmitting(true)
    setError(null)

    try {
      const updateData: {
        fullName?: string
        storageLimitMB?: number
      } = {}

      // Only include fields that have changed
      if (values.fullName !== user.fullName) {
        updateData.fullName = values.fullName
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. Workspace management is handled separately.
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
