import { UserResetPasswordDialog } from './user-reset-password-dialog'

import type { User } from '@repo/types'

interface UsersResetPasswordDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UsersResetPasswordDialog({
  user,
  open,
  onOpenChange,
  onSuccess
}: UsersResetPasswordDialogProps) {
  return (
    <UserResetPasswordDialog
      user={user}
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
    />
  )
}
