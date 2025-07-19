import { PrismaClient } from '@prisma/client'
import { User } from '@repo/types'
const prisma = new PrismaClient()

/**
 * Create a new user in the database
 * @param username Username
 * @param password Hashed password
 * @returns User object (id, username)
 */
export async function createUser(username: string, password: string): Promise<User> {
  const user = await prisma.user.create({ data: { username, password } })
  return { id: user.id, username: user.username }
}

/**
 * Get a user by username
 * @param username Username
 * @returns User object (id, username) or null if not found
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return null
  return { id: user.id, username: user.username }
}
