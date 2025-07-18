import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default user
  const passwordHash = await bcrypt.hash('admin', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: passwordHash
    }
  })

  // Create default OAuth client
  await prisma.oAuthClient.upsert({
    where: { clientId: 'client1' },
    update: {},
    create: {
      clientId: 'client1',
      clientSecret: 'secret',
      grants: 'password,client_credentials',
      redirectUris: ''
    }
  })

  console.log('Seeded default user and OAuth client.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
