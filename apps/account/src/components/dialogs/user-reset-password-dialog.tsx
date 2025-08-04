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
import { Icon } from '@repo/ui/components/base/icons'
import { useUser } from '@repo/contexts'
import { resetUserPassword } from '@repo/api'
import type { User } from '@repo/types'

// Function to generate a secure password
function generateSecurePassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  const allChars = lowercase + uppercase + numbers + symbols
  let password = ''

  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest with random characters
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

interface UserResetPasswordDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UserResetPasswordDialog({
  user,
  open,
  onOpenChange,
  onSuccess
}: UserResetPasswordDialogProps) {
  const { accessToken } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: ''
    }
  })

  const { handleSubmit, reset, setValue } = form

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword()
    setValue('password', newPassword)
  }

  // Reset form when dialog opens/closes and generate password on open
  useEffect(() => {
    if (!open) {
      reset()
      setError(null)
    } else if (user) {
      // Generate a password when dialog opens
      const newPassword = generateSecurePassword()
      setValue('password', newPassword)
    }
  }, [open, reset, setValue, user])

  async function handleFormSubmit(values: ResetPasswordFormData) {
    if (!accessToken || !user) return

    setIsSubmitting(true)
    setError(null)

    try {
      await resetUserPassword(accessToken, user.id, values.password)
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Reset password for user <strong>{user.username}</strong>. The new password will be
            generated automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input {...field} type="text" placeholder="Enter password" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGeneratePassword}
                        title="Generate new secure password"
                      >
                        <Icon.RefreshCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
                    <Icon.AlertTriangle className="h-4 w-4 inline mr-1" />
                    <strong>Important:</strong> Save this generated password securely. It cannot be
                    recovered later.
                  </div>
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
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
