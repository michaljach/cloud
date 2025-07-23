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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Workspace</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.id}</TableCell>
              <TableCell>{u.username}</TableCell>
              <TableCell>{u.fullName || '-'}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>{u.workspace?.name || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
