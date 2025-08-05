'use client'

import { useState } from 'react'
import { useUser } from '@repo/providers'
import { UsersCreateDialog } from '@/features/admin/dialogs/users-create-dialog'
import { UsersEditDialog } from '@/features/admin/dialogs/users-edit-dialog'
import { UsersResetPasswordDialog } from '@/features/admin/dialogs/users-reset-password-dialog'
import { UsersTable } from '@/features/admin/tables/users-table'
import { Button } from '@repo/ui/components/base/button'
import { Icon } from '@repo/ui/components/base/icons'
import { AdminUsersProvider, useAdminUsers } from '@/features/admin/providers/admin-users-provider'
import type { User } from '@repo/types'

export function AdminUsersContent() {
  const { user } = useUser()
  const { isLoading, error, refreshUsers } = useAdminUsers()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false)
    refreshUsers()
  }

  const handleUpdateSuccess = () => {
    refreshUsers()
    setEditUser(null)
  }

  const handleResetPasswordSuccess = () => {
    refreshUsers()
    setResetPasswordUser(null)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600">Loading user data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        {(user.workspaces?.some(
          (uw) => uw.role === 'owner' && uw.workspace.id === 'system-admin-workspace'
        ) ??
          false) && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Icon.Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        )}
      </div>

      <UsersTable onEditUser={setEditUser} onResetPassword={setResetPasswordUser} />

      <UsersCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {editUser && (
        <UsersEditDialog
          user={editUser}
          open={!!editUser}
          onOpenChange={(open: boolean) => !open && setEditUser(null)}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {resetPasswordUser && (
        <UsersResetPasswordDialog
          user={resetPasswordUser}
          open={!!resetPasswordUser}
          onOpenChange={(open: boolean) => !open && setResetPasswordUser(null)}
          onSuccess={handleResetPasswordSuccess}
        />
      )}
    </div>
  )
}
