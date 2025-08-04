import { UserEditDialog } from './user-edit-dialog'
import type { User } from '@repo/types'

interface UsersEditDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UsersEditDialog({ user, open, onOpenChange, onSuccess }: UsersEditDialogProps) {
  return (
    <UserEditDialog user={user} open={open} onOpenChange={onOpenChange} onSuccess={onSuccess} />
  )
}
