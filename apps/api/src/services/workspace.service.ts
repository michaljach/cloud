import { Workspace, UserWorkspace } from '@repo/types'
import { prisma } from '@lib/prisma'

/**
 * List all workspaces
 * @returns Array of workspaces
 */
export async function listWorkspaces(): Promise<Workspace[]> {
  const workspaces = await prisma.workspace.findMany({
    select: {
      id: true,
      name: true
    }
  })
  return workspaces
}

/**
 * Create a new workspace
 * @param name Workspace name
 * @returns Created workspace
 */
export async function createWorkspace(name: string): Promise<Workspace> {
  const workspace = await prisma.workspace.create({
    data: { name },
    select: {
      id: true,
      name: true
    }
  })
  return workspace
}

/**
 * Get a workspace by ID
 * @param id Workspace ID
 * @returns Workspace or null if not found
 */
export async function getWorkspaceById(id: string): Promise<Workspace | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: {
      id: true,
      name: true
    }
  })
  return workspace
}

/**
 * Get workspace with all its members
 * @param id Workspace ID
 * @returns Workspace with userWorkspaces or null if not found
 */
export async function getWorkspaceWithMembers(id: string): Promise<Workspace | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      userWorkspaces: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          },
          workspace: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  })
  return workspace
}

/**
 * Add a user to a workspace
 * @param userId User ID
 * @param workspaceId Workspace ID
 * @param role User role in workspace (default: 'member')
 * @returns UserWorkspace relationship
 */
export async function addUserToWorkspace(
  userId: string,
  workspaceId: string,
  role: 'owner' | 'admin' | 'member' = 'member'
): Promise<UserWorkspace> {
  const userWorkspace = await prisma.userWorkspace.create({
    data: {
      userId,
      workspaceId,
      role
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
  return userWorkspace
}

/**
 * Remove a user from a workspace
 * @param userId User ID
 * @param workspaceId Workspace ID
 * @returns Success status
 */
export async function removeUserFromWorkspace(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  try {
    await prisma.userWorkspace.delete({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      }
    })
    return true
  } catch (error) {
    return false
  }
}

/**
 * Update user role in workspace
 * @param userId User ID
 * @param workspaceId Workspace ID
 * @param role New role
 * @returns Updated UserWorkspace relationship
 */
export async function updateUserWorkspaceRole(
  userId: string,
  workspaceId: string,
  role: 'owner' | 'admin' | 'member'
): Promise<UserWorkspace | null> {
  try {
    const userWorkspace = await prisma.userWorkspace.update({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      },
      data: { role },
      include: {
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    return userWorkspace
  } catch (error) {
    return null
  }
}

/**
 * Update a workspace
 * @param id Workspace ID
 * @param name New workspace name
 * @returns Updated workspace
 */
export async function updateWorkspace(id: string, name: string): Promise<Workspace> {
  const workspace = await prisma.workspace.update({
    where: { id },
    data: { name },
    select: {
      id: true,
      name: true
    }
  })
  return workspace
}
