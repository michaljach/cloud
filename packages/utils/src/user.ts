import type { User, UserWorkspace, WorkspaceMembership } from '@repo/types'

/**
 * Convert UserWorkspace to WorkspaceMembership format
 * This is needed because UserWorkspace has joinedAt as Date while WorkspaceMembership has it as string
 */
export function convertUserWorkspaceToMembership(
  userWorkspace: UserWorkspace
): WorkspaceMembership {
  return {
    id: userWorkspace.id,
    userId: userWorkspace.userId,
    workspaceId: userWorkspace.workspaceId,
    role: userWorkspace.role,
    joinedAt:
      userWorkspace.joinedAt instanceof Date
        ? userWorkspace.joinedAt.toISOString()
        : userWorkspace.joinedAt,
    workspace: userWorkspace.workspace
  }
}

/**
 * Convert array of UserWorkspace to array of WorkspaceMembership
 */
export function convertUserWorkspacesToMemberships(
  userWorkspaces: UserWorkspace[]
): WorkspaceMembership[] {
  return userWorkspaces.map(convertUserWorkspaceToMembership)
}

// System Admin workspace ID constant
const SYSTEM_ADMIN_WORKSPACE_ID = 'system-admin-workspace'

/**
 * Check if a user is a root admin
 * Root admins are users who are 'owner' of the 'System Admin' workspace
 * @param user The user to check
 * @returns true if the user is a root admin
 */
export function isRootAdmin(user: User): boolean {
  return (
    user.workspaces?.some(
      (uw) => uw.role === 'owner' && uw.workspace.id === SYSTEM_ADMIN_WORKSPACE_ID
    ) ?? false
  )
}

/**
 * Check if a user is an admin in any workspace
 * @param user The user to check
 * @returns true if the user is an admin or owner in any workspace
 */
export function isAdmin(user: User): boolean {
  return user.workspaces?.some((uw) => uw.role === 'admin' || uw.role === 'owner') ?? false
}

/**
 * Check if a user has any workspaces
 * @param user The user to check
 * @returns true if the user has at least one workspace
 */
export function hasWorkspaces(user: User): boolean {
  return (user.workspaces?.length ?? 0) > 0
}
