import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID!
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET!
const OAUTH_CLIENT_GRANTS = process.env.OAUTH_CLIENT_GRANTS!
const OAUTH_CLIENT_REDIRECT_URIS = process.env.OAUTH_CLIENT_REDIRECT_URIS!

async function main() {
  // Create default workspace
  const defaultWorkspace = await prisma.workspace.upsert({
    where: { name: 'Default Workspace' },
    update: {},
    create: { name: 'Default Workspace' }
  })

  // Create default user
  const passwordHash = await bcrypt.hash('admin', 10)
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: passwordHash,
      role: 'root_admin',
      workspaceId: defaultWorkspace.id
    }
  })

  // Create default OAuth client
  await prisma.oAuthClient.upsert({
    where: { clientId: OAUTH_CLIENT_ID },
    update: {},
    create: {
      clientId: OAUTH_CLIENT_ID,
      clientSecret: OAUTH_CLIENT_SECRET,
      grants: OAUTH_CLIENT_GRANTS,
      redirectUris: OAUTH_CLIENT_REDIRECT_URIS
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
