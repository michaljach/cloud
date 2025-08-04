import { UserCreateDialog } from './user-create-dialog'

interface UsersCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UsersCreateDialog({ open, onOpenChange, onSuccess }: UsersCreateDialogProps) {
  return <UserCreateDialog open={open} onOpenChange={onOpenChange} onSuccess={onSuccess} />
}
