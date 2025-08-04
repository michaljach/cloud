'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUser } from '@repo/contexts'
import { Button } from '@repo/ui/components/base/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@repo/ui/components/base/dialog'
import { Input } from '@repo/ui/components/base/input'
import { Label } from '@repo/ui/components/base/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@repo/ui/components/base/select'
import { createWorkspaceInvite } from '@repo/api'

const inviteSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  role: z.enum(['member', 'admin', 'owner'])
})

type InviteFormData = z.infer<typeof inviteSchema>

interface WorkspaceInviteDialogProps {
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function WorkspaceInviteDialog({
  workspaceId,
  open,
  onOpenChange,
  onSuccess
}: WorkspaceInviteDialogProps) {
  const { accessToken } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      username: '',
      role: 'member'
    }
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: InviteFormData) => {
    if (!accessToken) {
      setError('No access token found')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await createWorkspaceInvite(accessToken, workspaceId, data.username, data.role)

      // Reset form and close dialog
      reset()
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
      setError(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite User to Workspace</DialogTitle>
          <DialogDescription>
            Send an invitation to join this workspace. The user will receive a notification and can
            accept or decline the invitation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter username"
              {...register('username')}
              disabled={isSubmitting}
            />
            {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value: 'member' | 'admin' | 'owner') => setValue('role', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {selectedRole === 'member' && 'Can view and edit workspace content'}
              {selectedRole === 'admin' && 'Can manage workspace members and settings'}
              {selectedRole === 'owner' && 'Full control over the workspace'}
            </p>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
