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
import { Card } from '@repo/ui/components/base/card'
import { Badge } from '@repo/ui/components/base/badge'
import { Icon } from '@repo/ui/components/base/icons'

export default function AdminConsolePage() {
  const { user, loading, accessToken } = useUser()
  const [users, setUsers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !accessToken) return
    if (user.role !== 'admin' && user.role !== 'root_admin') {
      setError('Forbidden')
      return
    }
    getUsers(accessToken)
      .then(setUsers)
      .catch((err) => setError(err.message || 'Failed to fetch users'))
  }, [user, accessToken])

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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
