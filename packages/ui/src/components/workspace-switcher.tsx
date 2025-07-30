'use client'

import React from 'react'
import { ChevronDown, Building2, User, Crown, Shield, Users, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './base/dropdown-menu'
import { Button } from './base/button'
import { Badge } from './base/badge'
import { useWorkspace } from '@repo/contexts'
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
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Loading...</span>
        </div>
      </Button>
    )
  }

  if (!currentWorkspace) {
    return null
  }

  const getWorkspaceIcon = (workspace: WorkspaceMembership | any) => {
    if ('type' in workspace && workspace.type === 'personal') {
      return <User className="h-4 w-4 text-blue-600" />
    }
    return <Building2 className="h-4 w-4 text-indigo-600" />
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

  const getRoleIcon = (workspace: WorkspaceMembership | any) => {
    if ('type' in workspace && workspace.type === 'personal') return null

    const role = (workspace as WorkspaceMembership).role
    if (!role) return null

    const roleIcons = {
      owner: <Crown className="h-3 w-3 text-yellow-600" />,
      admin: <Shield className="h-3 w-3 text-blue-600" />,
      member: <Users className="h-3 w-3 text-gray-600" />
    }

    return roleIcons[role as keyof typeof roleIcons] || roleIcons.member
  }

  const getRoleBadge = (workspace: WorkspaceMembership | any) => {
    if ('type' in workspace && workspace.type === 'personal') return null

    const role = (workspace as WorkspaceMembership).role
    if (!role) return null

    const roleColors = {
      owner: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      admin: 'bg-blue-100 text-blue-800 border-blue-200',
      member: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    return (
      <Badge
        variant="outline"
        className={`ml-2 text-xs ${roleColors[role as keyof typeof roleColors] || roleColors.member}`}
      >
        {role}
      </Badge>
    )
  }

  const isCurrentWorkspace = (workspace: WorkspaceMembership | any) => {
    return currentWorkspace.id === workspace.id
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <div className="flex items-center gap-2">
            {getWorkspaceIcon(currentWorkspace)}
            <span className="truncate max-w-[120px] font-medium">
              {getWorkspaceName(currentWorkspace)}
            </span>
            {getRoleBadge(currentWorkspace)}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          Switch Workspace
        </div>
        <DropdownMenuSeparator />
        {availableWorkspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => switchToWorkspace(workspace.id)}
            className={`flex items-center gap-3 cursor-pointer p-2 rounded-md transition-colors ${
              isCurrentWorkspace(workspace)
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50'
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getWorkspaceIcon(workspace)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{getWorkspaceName(workspace)}</span>
                  {getRoleIcon(workspace)}
                </div>
                {getRoleBadge(workspace) && <div className="mt-1">{getRoleBadge(workspace)}</div>}
              </div>
            </div>
            {isCurrentWorkspace(workspace) && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
