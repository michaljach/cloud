import { User } from '@repo/types'
import { prisma } from '@lib/prisma'

/**
 * Create a new user in the database
 * @param username Username
 * @param password Hashed password
 * @returns User object (id, username)
 */
export async function createUser(username: string, password: string): Promise<User> {
  const user = await prisma.user.create({
    data: { username, password },
    select: {
      id: true,
      username: true,
      storageLimit: true,
      fullName: true
    }
  })
  return {
    id: user.id,
    username: user.username,
    storageLimit: user.storageLimit,
    fullName: user.fullName
  }
}

/**
 * Get a user by ID
 * @param userId User ID
 * @returns User object or null if not found
 */
export async function getUserById(userId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userWorkspaces: {
        include: {
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

  if (!user) return null

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    storageLimit: user.storageLimit,
    workspaces: user.userWorkspaces
  }
}

/**
 * Get a user by username
 * @param username Username
 * @returns User object (id, username) or null if not found
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      storageLimit: true,
      fullName: true
    }
  })
  if (!user) return null
  return {
    id: user.id,
    username: user.username,
    storageLimit: user.storageLimit,
    fullName: user.fullName
  }
}

/**
 * List users, optionally filtered by workspaceId
 * @param workspaceId Optional workspace ID to filter users
 * @returns Array of users (with workspace info)
 */
export async function listUsers(workspaceId?: string): Promise<User[]> {
  if (workspaceId) {
    // Get users in a specific workspace
    const userWorkspaces = await prisma.userWorkspace.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            storageLimit: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
    return userWorkspaces.map((uw) => ({
      id: uw.user.id,
      username: uw.user.username,
      fullName: uw.user.fullName,
      storageLimit: uw.user.storageLimit,
      workspaces: [uw]
    }))
  } else {
    // Get all users with their workspace memberships
    const users = await prisma.user.findMany({
      include: {
        userWorkspaces: {
          include: {
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
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      storageLimit: user.storageLimit,
      workspaces: user.userWorkspaces
    }))
  }
}

/**
 * Get storage limit for a specific user
 * @param userId User ID
 * @returns Storage limit in MB
 */
export async function getUserStorageLimit(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storageLimit: true }
  })
  return Number(user?.storageLimit) || 1024 // Default 1GB in MB
}

/**
 * Update user properties
 * @param userId User ID
 * @param data Object containing properties to update
 * @returns Updated user
 */
export async function updateUser(
  userId: string,
  data: { fullName?: string; storageLimit?: number }
): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: {
      userWorkspaces: {
        include: {
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
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    storageLimit: user.storageLimit,
    workspaces: user.userWorkspaces
  }
}
