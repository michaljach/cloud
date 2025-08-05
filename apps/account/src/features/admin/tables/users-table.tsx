'use client'

import { Button } from '@repo/ui/components/base/button'
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
import { formatFileSize } from '@repo/utils'
import { useAdminUsers } from '@/features/admin/providers/admin-users-provider'
import type { User } from '@repo/types'

interface UsersTableProps {
  onEditUser: (user: User) => void
  onResetPassword: (user: User) => void
}

export function UsersTable({ onEditUser, onResetPassword }: UsersTableProps) {
  const { users } = useAdminUsers()

  return (
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
        {users.map((user, i) => (
          <TableRow key={user.id} className={i % 2 === 1 ? 'bg-muted/40' : ''}>
            <TableCell className="font-mono text-xs text-muted-foreground max-w-[8rem] truncate">
              {user.id}
            </TableCell>
            <TableCell className="font-medium max-w-[10rem] truncate">{user.username}</TableCell>
            <TableCell className="max-w-[14rem] truncate">{user.fullName || '-'}</TableCell>
            <TableCell className="max-w-[20rem]">
              {user.workspaces && user.workspaces.length > 0 ? (
                <div className="space-y-1">
                  {user.workspaces.map((uw) => (
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
                      <span className="text-sm text-muted-foreground">{uw.workspace.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">No workspaces</span>
              )}
            </TableCell>
            <TableCell>{formatFileSize(user.storageLimit * 1024 * 1024)}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEditUser(user)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResetPassword(user)}
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
  )
}
