import { PrismaClient } from '@prisma/client'
import { User } from '@repo/types'
const prisma = new PrismaClient()

export async function createUser(username: string, password: string): Promise<User> {
  const user = await prisma.user.create({ data: { username, password } })
  return { id: user.id, username: user.username }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return null
  return { id: user.id, username: user.username }
}
