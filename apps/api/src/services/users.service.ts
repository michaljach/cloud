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
  const user = await prisma.user.create({ data: { username, password, role } })
  return { id: user.id, username: user.username, role: user.role }
}

/**
 * Get a user by username
 * @param username Username
 * @returns User object (id, username, role) or null if not found
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return null
  return { id: user.id, username: user.username, role: user.role }
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
    workspaceId: user.workspaceId,
    workspace: user.workspace ? { id: user.workspace.id, name: user.workspace.name } : undefined
  }))
}
