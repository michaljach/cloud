import { User } from '@repo/types'

// Export all utility functions
export * from './cryptoStorageUtils'
export * from './fileStorageUtils'
export * from './handleError'

/**
 * Check if a user is a root admin
 * Root admins are users who are 'owner' of the 'System Admin' workspace
 * @param user The user to check
 * @returns true if the user is a root admin
 */
export function isRootAdmin(user: User): boolean {
  return (
    user.workspaces?.some((uw) => uw.role === 'owner' && uw.workspace.name === 'System Admin') ??
    false
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
 * Get all workspaces where a user is an admin or owner
 * @param user The user to check
 * @returns Array of workspace memberships where user is admin/owner
 */
export function getAdminWorkspaces(user: User) {
  return user.workspaces?.filter((uw) => uw.role === 'admin' || uw.role === 'owner') ?? []
}
