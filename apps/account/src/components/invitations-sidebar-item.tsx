'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@repo/auth'
import { getMyInvites } from '@repo/api'
import { Mail } from 'lucide-react'
import Link from 'next/link'
import { SidebarMenuSubItem, SidebarMenuSubButton } from '@repo/ui/components/base/sidebar'
import { Badge } from '@repo/ui/components/base/badge'

export function InvitationsSidebarItem() {
  const { user, accessToken } = useUser()
  const [inviteCount, setInviteCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInviteCount = async () => {
      if (!user || !accessToken) {
        setIsLoading(false)
        return
      }

      try {
        const invites = await getMyInvites(accessToken)
        setInviteCount(invites.length)
      } catch (error) {
        console.error('Failed to fetch invite count:', error)
        setInviteCount(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInviteCount()
  }, [user, accessToken])

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>
        <Link href="/invitations" className="flex items-center w-full">
          <div className="flex items-center gap-1">
            <Mail className="w-4 h-4" />
            Invitations
          </div>
          {!isLoading && inviteCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {inviteCount}
            </Badge>
          )}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}
