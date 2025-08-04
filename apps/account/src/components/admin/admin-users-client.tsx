'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@repo/contexts'
import { getUsers, createUser, updateUser } from '@repo/api'
import { Button } from '@repo/ui/components/base/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@repo/ui/components/base/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@repo/ui/components/base/table'
import { Badge } from '@repo/ui/components/base/badge'
import { Icon } from '@repo/ui/components/base/icons'
import { UserCreateDialog } from '@/components/dialogs/user-create-dialog'
import { UserEditDialog } from '@/components/dialogs/user-edit-dialog'
import { UserResetPasswordDialog } from '@/components/dialogs/user-reset-password-dialog'
import { formatFileSize } from '@repo/utils'
import type { User } from '@repo/types'

// Utility functions for user permissions
const SYSTEM_ADMIN_WORKSPACE_ID = 'system-admin-workspace'

function isRootAdmin(user: User | null): boolean {
  if (!user || !user.workspaces) return false
  return (
    user.workspaces.some(
      (uw) => uw.role === 'owner' && uw.workspace.id === SYSTEM_ADMIN_WORKSPACE_ID
    ) ?? false
  )
}

function isAdmin(user: User | null): boolean {
  if (!user || !user.workspaces) return false
  return user.workspaces.some((uw) => uw.role === 'admin' || uw.role === 'owner') ?? false
}

export function AdminUsersClient() {
  const { user, accessToken } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshUsers = useCallback(async () => {
    if (!accessToken) return

    setIsLoading(true)
    setError(null)

    try {
      const fetchedUsers = await getUsers(accessToken)
      setUsers(fetchedUsers)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false)
    refreshUsers()
  }

  const handleEditUser = (user: User) => {
    setEditUser(user)
  }

  const handleUpdateSuccess = () => {
    refreshUsers()
    setEditUser(null)
  }

  const handleResetPassword = (user: User) => {
    setResetPasswordUser(user)
  }

  const handleResetPasswordSuccess = () => {
    refreshUsers()
    setResetPasswordUser(null)
  }

  useEffect(() => {
    if (!user || !accessToken) return
    if (!isRootAdmin(user)) {
      setError('Forbidden')
      return
    }
    refreshUsers()
  }, [user, accessToken, refreshUsers])

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
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">A list of all users in the system.</p>
        </div>
        {isRootAdmin(user) && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Icon.Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage users and their workspace memberships</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Workspaces & Roles</TableHead>
                <TableHead>Storage Limit</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u, i) => (
                <TableRow key={u.id} className={i % 2 === 1 ? 'bg-muted/40' : ''}>
                  <TableCell className="font-mono text-xs text-muted-foreground max-w-[8rem] truncate">
                    {u.id}
                  </TableCell>
                  <TableCell className="font-medium max-w-[10rem] truncate">{u.username}</TableCell>
                  <TableCell className="max-w-[14rem] truncate">{u.fullName || '-'}</TableCell>
                  <TableCell className="max-w-[20rem]">
                    {u.workspaces && u.workspaces.length > 0 ? (
                      <div className="space-y-1">
                        {u.workspaces.map((uw) => (
                          <div key={uw.id} className="flex items-center gap-2">
                            <Badge
                              variant={
                                uw.role === 'owner'
                                  ? 'default'
                                  : uw.role === 'admin'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {uw.role}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {uw.workspace.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No workspaces</span>
                    )}
                  </TableCell>
                  <TableCell>{formatFileSize(u.storageLimit * 1024 * 1024)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(u)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(u)}
                        title="Reset password"
                      >
                        <Icon.Key className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {editUser && (
        <UserEditDialog
          user={editUser}
          open={!!editUser}
          onOpenChange={(open) => !open && setEditUser(null)}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {resetPasswordUser && (
        <UserResetPasswordDialog
          user={resetPasswordUser}
          open={!!resetPasswordUser}
          onOpenChange={(open) => !open && setResetPasswordUser(null)}
          onSuccess={handleResetPasswordSuccess}
        />
      )}
    </div>
  )
}
