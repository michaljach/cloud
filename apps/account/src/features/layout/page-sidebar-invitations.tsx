'use client'

import { useInvites } from '@repo/providers'
import { Badge } from '@repo/ui/components/base/badge'
import { SidebarMenuSubItem, SidebarMenuSubButton } from '@repo/ui/components/base/sidebar'
import { Mail } from 'lucide-react'
import Link from 'next/link'

export function PageSidebarInvitations() {
  const { inviteCount, loading } = useInvites()

  // Don't render anything if there are no invitations and not loading
  if (!loading && inviteCount === 0) {
    return null
  }

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>
        <Link href="/invitations" className="flex items-center w-full">
          <div className="flex items-center gap-1">
            <Mail className="w-4 h-4" />
            Invitations
          </div>
          {!loading && inviteCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {inviteCount}
            </Badge>
          )}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}
