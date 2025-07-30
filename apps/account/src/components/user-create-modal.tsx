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
import { useUser } from '@repo/contexts'
import { createUser } from '@repo/api'

const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
  storageLimitMB: z
    .number()
    .min(1, 'Storage limit must be at least 1 MB')
    .max(1000000, 'Storage limit cannot exceed 1000GB')
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface UserCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UserCreateModal({ open, onOpenChange, onSuccess }: UserCreateModalProps) {
  const { accessToken } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      password: '',
      fullName: '',
      storageLimitMB: 1024 // Default 1GB
    }
  })

  const {
    handleSubmit,
    formState: { isSubmitting: formSubmitting },
    reset
  } = form

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      reset()
      setError(null)
    }
  }, [open, reset])

  async function handleFormSubmit(values: CreateUserFormData) {
    if (!accessToken) return

    setIsSubmitting(true)
    setError(null)

    try {
      await createUser(accessToken, {
        username: values.username,
        password: values.password,
        fullName: values.fullName || undefined,
        storageLimitMB: values.storageLimitMB
      })

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
            Create a new user account. Workspace assignment can be done later through the workspace
            management.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter username" />
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
                    <Input {...field} type="password" placeholder="Enter password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name (Optional)</FormLabel>
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
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
