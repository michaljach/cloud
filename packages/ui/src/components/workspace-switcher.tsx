'use client'

import React from 'react'
import { ChevronDown, Building2, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './base/dropdown-menu'
import { Button } from './base/button'
import { Badge } from './base/badge'
import { useWorkspace } from '@repo/auth'
import type { WorkspaceMembership } from '@repo/types'

interface WorkspaceSwitcherProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function WorkspaceSwitcher({
  className,
  variant = 'outline',
  size = 'default'
}: WorkspaceSwitcherProps) {
  const { currentWorkspace, availableWorkspaces, loading, switchToWorkspace, isPersonalSpace } =
    useWorkspace()

  if (loading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        Loading...
      </Button>
    )
  }

  if (!currentWorkspace) {
    return null
  }

  const getWorkspaceIcon = (workspace: WorkspaceMembership | any) => {
    if ('type' in workspace && workspace.type === 'personal') {
      return <User className="h-4 w-4" />
    }
    return <Building2 className="h-4 w-4" />
  }

  const getWorkspaceName = (workspace: WorkspaceMembership | any) => {
    if ('type' in workspace && workspace.type === 'personal') {
      return workspace.name
    }
    if ('workspace' in workspace) {
      return workspace.workspace.name
    }
    return 'Unknown'
  }

  const getRoleBadge = (workspace: WorkspaceMembership | any) => {
    if ('type' in workspace && workspace.type === 'personal') return null

    const role = (workspace as WorkspaceMembership).role
    if (!role) return null

    const roleColors = {
      owner: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge
        variant="secondary"
        className={`ml-2 text-xs ${roleColors[role as keyof typeof roleColors] || roleColors.member}`}
      >
        {role}
      </Badge>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <div className="flex items-center gap-2">
            {getWorkspaceIcon(currentWorkspace)}
            <span className="truncate max-w-[120px]">{getWorkspaceName(currentWorkspace)}</span>
            {getRoleBadge(currentWorkspace)}
            <ChevronDown className="h-4 w-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {availableWorkspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => switchToWorkspace(workspace.id)}
            className={`flex items-center gap-2 cursor-pointer ${
              currentWorkspace.id === workspace.id ? 'bg-accent' : ''
            }`}
          >
            {getWorkspaceIcon(workspace)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate">{getWorkspaceName(workspace)}</span>
                {getRoleBadge(workspace)}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
