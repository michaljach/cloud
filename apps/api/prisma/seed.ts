import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create System Admin workspace
  console.log('Creating System Admin workspace...')
  const systemAdminWorkspace = await prisma.workspace.upsert({
    where: { id: 'system-admin-workspace' },
    update: {},
    create: {
      id: 'system-admin-workspace',
      name: 'System Admin'
    }
  })

  // Create root admin user
  console.log('Creating root admin user...')
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const rootAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      fullName: 'System Administrator',
      storageLimit: 10240 // 10GB
    }
  })

  // Add root admin to System Admin workspace as owner
  console.log('Adding root admin to System Admin workspace...')
  await prisma.userWorkspace.upsert({
    where: {
      userId_workspaceId: {
        userId: rootAdmin.id,
        workspaceId: systemAdminWorkspace.id
      }
    },
    update: {
      role: 'owner'
    },
    create: {
      userId: rootAdmin.id,
      workspaceId: systemAdminWorkspace.id,
      role: 'owner'
    }
  })

  // Create a sample workspace for testing
  console.log('Creating sample workspace...')
  const sampleWorkspace = await prisma.workspace.upsert({
    where: { id: 'sample-workspace' },
    update: {},
    create: {
      id: 'sample-workspace',
      name: 'Sample Workspace'
    }
  })

  // Create a sample user
  console.log('Creating sample user...')
  const sampleUser = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      password: await bcrypt.hash('user123', 10),
      fullName: 'Sample User',
      storageLimit: 1024 // 1GB
    }
  })

  // Add sample user to sample workspace as member
  console.log('Adding sample user to sample workspace...')
  await prisma.userWorkspace.upsert({
    where: {
      userId_workspaceId: {
        userId: sampleUser.id,
        workspaceId: sampleWorkspace.id
      }
    },
    update: {
      role: 'member'
    },
    create: {
      userId: sampleUser.id,
      workspaceId: sampleWorkspace.id,
      role: 'member'
    }
  })

  // Create default OAuth client
  console.log('Creating OAuth client...')
  const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || 'cloud-client'
  const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || 'cloud-secret'
  const OAUTH_CLIENT_GRANTS = process.env.OAUTH_CLIENT_GRANTS || 'password,refresh_token'
  const OAUTH_CLIENT_REDIRECT_URIS =
    process.env.OAUTH_CLIENT_REDIRECT_URIS || 'http://localhost:3000/callback'

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

  console.log('✅ Database seed completed successfully!')
  console.log('')
  console.log('📋 Created accounts:')
  console.log('   Root Admin: admin / admin123')
  console.log('   Sample User: user / user123')
  console.log('')
  console.log('🏢 Created workspaces:')
  console.log('   - System Admin (for root admin users)')
  console.log('   - Sample Workspace (for testing)')
  console.log('')
  console.log('🔐 OAuth Client:')
  console.log(`   Client ID: ${OAUTH_CLIENT_ID}`)
  console.log(`   Grants: ${OAUTH_CLIENT_GRANTS}`)
  console.log(`   Redirect URIs: ${OAUTH_CLIENT_REDIRECT_URIS}`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
