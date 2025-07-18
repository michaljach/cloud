import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function createUser(username: string, password: string) {
  return prisma.user.create({ data: { username, password } })
}

export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({ where: { username } })
}
