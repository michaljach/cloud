'use client'

import { useEffect, useState } from 'react'
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
import { UserCreateModal } from '../../../../components/user-create-modal'
import { UserEditModal } from '../../../../components/user-edit-modal'
import { formatFileSize } from '@repo/utils'
import type { User } from '@repo/types'

// Utility functions for user permissions
const SYSTEM_ADMIN_WORKSPACE_ID = 'system-admin-workspace'

function isRootAdmin(user: User): boolean {
  return (
    user.workspaces?.some(
      (uw) => uw.role === 'owner' && uw.workspace.id === SYSTEM_ADMIN_WORKSPACE_ID
    ) ?? false
  )
}

function isAdmin(user: User): boolean {
  return user.workspaces?.some((uw) => uw.role === 'admin' || uw.role === 'owner') ?? false
}

export default function UsersPage() {
  const { user, accessToken } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)

  const refreshUsers = async () => {
    if (!accessToken) return
    try {
      setLoading(true)
      const fetchedUsers = await getUsers(accessToken)
      setUsers(fetchedUsers)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSuccess = () => {
    refreshUsers()
    setCreateModalOpen(false)
  }

  const handleEditUser = (user: User) => {
    setEditUser(user)
  }

  const handleUpdateSuccess = () => {
    refreshUsers()
    setEditUser(null)
  }

  useEffect(() => {
    if (!user || !accessToken) return
    if (!isRootAdmin(user)) {
      setError('Forbidden')
      return
    }
    refreshUsers()
  }, [user, accessToken])

  if (loading) {
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">A list of all users in the system.</p>
        </div>
        {isRootAdmin(user!) && (
          <Button onClick={() => setCreateModalOpen(true)}>
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
                    <Button variant="outline" size="sm" onClick={() => handleEditUser(u)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      {editUser && (
        <UserEditModal
          user={editUser}
          open={!!editUser}
          onOpenChange={(open) => !open && setEditUser(null)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  )
}
