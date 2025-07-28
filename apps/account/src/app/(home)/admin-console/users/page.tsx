'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@repo/ui/components/base/table'
import { useUser } from '@repo/auth'
import { getUsers } from '@repo/api'
import { Badge } from '@repo/ui/components/base/badge'
import { Button } from '@repo/ui/components/base/button'
import { Icon } from '@repo/ui/components/base/icons'
import { UserEditModal } from '@/components/user-edit-modal'
import { formatFileSize } from '@repo/utils'
import type { User } from '@repo/types'

export default function AdminConsolePage() {
  const { user, loading, accessToken } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const refreshUsers = async () => {
    if (!accessToken) return
    try {
      const fetchedUsers = await getUsers(accessToken)
      setUsers(fetchedUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    }
  }

  useEffect(() => {
    if (!user || !accessToken) return
    if (user.role !== 'admin' && user.role !== 'root_admin') {
      setError('Forbidden')
      return
    }
    refreshUsers()
  }, [user, accessToken])

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    refreshUsers()
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Users</h1>
      <p className="text-muted-foreground mb-8">A list of all users in the system.</p>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Workspace</TableHead>
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
                <TableCell>
                  <span className="flex items-center gap-2">
                    {u.role === 'root_admin' && (
                      <Icon.ShieldUser className="w-4 h-4 text-red-500" />
                    )}
                    {u.role === 'admin' && <Icon.User className="w-4 h-4 text-blue-500" />}
                    {u.role === 'user' && <Icon.User className="w-4 h-4 text-muted-foreground" />}
                    <Badge
                      className={
                        u.role === 'root_admin'
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : u.role === 'admin'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-muted text-muted-foreground border-muted'
                      }
                    >
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </span>
                </TableCell>
                <TableCell className="max-w-[10rem] truncate">{u.workspace?.name || '-'}</TableCell>
                <TableCell className="max-w-[8rem] truncate">
                  {u.storageLimit ? formatFileSize(u.storageLimit * 1024 * 1024) : '-'}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditUser(u)}
                    className="h-8 px-2"
                  >
                    <Icon.Edit className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserEditModal
        user={editingUser}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
