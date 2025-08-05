'use client'

import { Avatar, AvatarFallback } from '@repo/ui/components/base/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@repo/ui/components/base/dropdown-menu'
import { SidebarMenuButton } from '@repo/ui/components/base/sidebar'
import {
  Bell,
  CreditCard,
  LogOut,
  MoreVertical,
  Settings,
  ShieldUser,
  Building2,
  User,
  Crown,
  Shield,
  Users,
  Check
} from 'lucide-react'
import { User as UserType } from '@repo/types'
import { useWorkspace } from '@repo/providers'
import type { WorkspaceMembership } from '@repo/types'

export function UserDropdown({
  user,
  onLogout,
  onAccountClick
}: {
  user: UserType | null
  onLogout?: () => void
  onAccountClick?: () => void
}) {
  const { currentWorkspace, availableWorkspaces, switchToWorkspace } = useWorkspace()

  // Helper to get initials from fullName or username
  function getInitials() {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase()
    }
    return 'CN'
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

  const isCurrentWorkspace = (workspace: WorkspaceMembership | any) => {
    return currentWorkspace?.id === workspace.id
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="w-auto min-w-48 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg grayscale">
            {/* No avatar property, fallback to initials */}
            <AvatarFallback className="rounded-lg">{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user?.fullName}</span>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground truncate text-xs">{user?.username}</span>
              {currentWorkspace &&
                (!('type' in currentWorkspace) || currentWorkspace.type !== 'personal') && (
                  <>
                    <span className="text-muted-foreground text-xs">•</span>
                    <div className="flex items-center gap-1">
                      {getWorkspaceIcon(currentWorkspace)}
                      <span className="text-muted-foreground truncate text-xs">
                        {getWorkspaceName(currentWorkspace)}
                      </span>
                    </div>
                  </>
                )}
            </div>
          </div>
          <MoreVertical className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 rounded-lg" side={'bottom'} align="end" sideOffset={4}>
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user?.fullName}</span>
              <span className="text-muted-foreground truncate text-xs">{user?.username}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Workspace Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Workspaces
          </DropdownMenuLabel>
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
                </div>
              </div>
              {isCurrentWorkspace(workspace) && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* User Settings Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Settings
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={onAccountClick}>
            <Settings className="h-4 w-4" />
            Account settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="h-4 w-4" />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="h-4 w-4" />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Admin Section */}
        {user?.workspaces?.some(
          (uw) => uw.role === 'owner' && uw.workspace.id === 'system-admin-workspace'
        ) && (
          <>
            <DropdownMenuItem>
              <ShieldUser className="h-4 w-4" />
              Administration panel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Logout */}
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
