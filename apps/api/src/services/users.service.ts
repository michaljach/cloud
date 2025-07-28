import { PrismaClient } from '@prisma/client'
import { User } from '@repo/types'
import crypto from 'crypto'
const prisma = new PrismaClient()

/**
 * Create a new user in the database
 * @param username Username
 * @param password Hashed password
 * @param role User role (optional, defaults to 'user')
 * @returns User object (id, username, role)
 */
export async function createUser(
  username: string,
  password: string,
  role: 'root_admin' | 'admin' | 'user' = 'user'
): Promise<User> {
  const user = await prisma.user.create({
    data: { username, password, role },
    select: {
      id: true,
      username: true,
      role: true,
      storageLimit: true,
      fullName: true,
      workspaceId: true
    }
  })
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    storageLimit: user.storageLimit,
    fullName: user.fullName,
    workspaceId: user.workspaceId
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
    include: { workspace: true }
  })
  if (!user) return null
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    storageLimit: user.storageLimit,
    workspaceId: user.workspaceId,
    workspace: user.workspace ? { id: user.workspace.id, name: user.workspace.name } : undefined
  }
}

/**
 * Get a user by username
 * @param username Username
 * @returns User object (id, username, role) or null if not found
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      role: true,
      storageLimit: true,
      fullName: true,
      workspaceId: true
    }
  })
  if (!user) return null
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    storageLimit: user.storageLimit,
    fullName: user.fullName,
    workspaceId: user.workspaceId
  }
}

/**
 * List users, optionally filtered by workspaceId
 * @param workspaceId Optional workspace ID to filter users
 * @returns Array of users (with workspace info)
 */
export async function listUsers(workspaceId?: string): Promise<User[]> {
  const users = await prisma.user.findMany({
    where: workspaceId ? { workspaceId } : {},
    include: { workspace: true }
  })
  return users.map((user) => ({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    storageLimit: user.storageLimit,
    workspaceId: user.workspaceId,
    workspace: user.workspace ? { id: user.workspace.id, name: user.workspace.name } : undefined
  }))
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
  data: { fullName?: string; role?: string; workspaceId?: string; storageLimit?: number }
): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: { workspace: true }
  })
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    storageLimit: user.storageLimit,
    workspaceId: user.workspaceId,
    workspace: user.workspace ? { id: user.workspace.id, name: user.workspace.name } : undefined
  }
}
