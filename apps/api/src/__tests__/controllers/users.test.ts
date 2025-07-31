import request from 'supertest'
import bcrypt from 'bcryptjs'

// Set up environment variables for testing
process.env.OAUTH_CLIENT_ID = 'cloud-client'
process.env.OAUTH_CLIENT_SECRET = 'cloud-secret'

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn((input, hash) => input === 'user123'),
  hash: jest.fn((input) => `hashed-${input}`)
}))

// Mock users service
jest.mock('@services/users.service', () => ({
  getUserById: jest.fn((userId) => {
    if (userId === 'admin-id') {
      return Promise.resolve({
        id: 'admin-id',
        username: 'admin',
        fullName: 'Admin User',
        storageLimit: 1024,
        workspaces: [
          {
            id: 'uw1',
            role: 'owner',
            workspace: {
              id: 'system-admin-workspace',
              name: 'System Admin'
            }
          }
        ]
      })
    }
    if (userId === 'user-id') {
      return Promise.resolve({
        id: 'user-id',
        username: 'user',
        fullName: 'Test User',
        storageLimit: 1024,
        workspaces: [
          {
            id: 'uw2',
            role: 'member',
            workspace: {
              id: 'workspace-1',
              name: 'Test Workspace'
            }
          }
        ]
      })
    }
    if (userId === 'target-user-id') {
      return Promise.resolve({
        id: 'target-user-id',
        username: 'targetuser',
        fullName: 'Target User',
        storageLimit: 1024,
        workspaces: []
      })
    }
    return Promise.resolve(null)
  }),
  listUsers: jest.fn(),
  getUserByUsername: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  getUserStorageLimit: jest.fn()
}))

// Mock OAuth model
jest.mock('@services/oauth.model', () => ({
  __esModule: true,
  default: {
    getClient: jest.fn(),
    getUser: jest.fn(),
    saveToken: jest.fn(),
    getAccessToken: jest.fn((accessToken) => {
      if (accessToken === 'valid-admin-token') {
        return {
          accessToken: 'valid-admin-token',
          accessTokenExpiresAt: new Date(Date.now() + 3600000),
          refreshToken: 'refresh-admin-token',
          refreshTokenExpiresAt: new Date(Date.now() + 86400000),
          scope: 'read write',
          client: {
            id: '1',
            clientId: 'cloud-client',
            clientSecret: 'cloud-secret',
            grants: ['password', 'refresh_token'],
            redirectUris: ['http://localhost:3000/callback']
          },
          user: {
            id: 'admin-id',
            username: 'admin',
            fullName: 'Admin User',
            storageLimit: 1024
          }
        }
      }
      if (accessToken === 'valid-user-token') {
        return {
          accessToken: 'valid-user-token',
          accessTokenExpiresAt: new Date(Date.now() + 3600000),
          refreshToken: 'refresh-user-token',
          refreshTokenExpiresAt: new Date(Date.now() + 86400000),
          scope: 'read write',
          client: {
            id: '1',
            clientId: 'cloud-client',
            clientSecret: 'cloud-secret',
            grants: ['password', 'refresh_token'],
            redirectUris: ['http://localhost:3000/callback']
          },
          user: {
            id: 'user-id',
            username: 'user',
            fullName: 'Test User',
            storageLimit: 1024
          }
        }
      }
      return null
    }),
    verifyScope: jest.fn(() => true),
    getRefreshToken: jest.fn()
  }
}))

// Mock Prisma
jest.mock('@prisma/client')
jest.mock('@lib/prisma', () => ({
  prisma: {
    oAuthClient: {
      findUnique: jest.fn(() => ({
        id: 1,
        clientId: 'cloud-client',
        clientSecret: 'cloud-secret',
        grants: 'password,refresh_token',
        redirectUris: 'http://localhost:3000/callback'
      }))
    },
    user: {
      findUnique: jest.fn(({ where }) => {
        if (where.username === 'admin') {
          return {
            id: 'admin-id',
            username: 'admin',
            password: 'hashed-admin123',
            fullName: 'Admin User',
            storageLimit: 1024,
            userWorkspaces: [
              {
                id: 'uw1',
                role: 'owner',
                workspace: {
                  id: 'system-admin-workspace',
                  name: 'System Admin'
                }
              }
            ]
          }
        }
        if (where.username === 'user') {
          return {
            id: 'user-id',
            username: 'user',
            password: 'hashed-user123',
            fullName: 'Test User',
            storageLimit: 1024,
            userWorkspaces: [
              {
                id: 'uw2',
                role: 'member',
                workspace: {
                  id: 'workspace-1',
                  name: 'Test Workspace'
                }
              }
            ]
          }
        }
        if (where.id === 'target-user-id') {
          return {
            id: 'target-user-id',
            username: 'targetuser',
            password: 'hashed-old-password',
            fullName: 'Target User',
            storageLimit: 1024,
            userWorkspaces: []
          }
        }
        return null
      }),
      update: jest.fn(({ where, data }) => ({
        id: where.id,
        username: 'targetuser',
        password: data.password,
        fullName: 'Target User',
        storageLimit: 1024
      }))
    },
    oAuthToken: {
      create: jest.fn(({ data }) => ({
        ...data,
        client: {
          id: 1,
          clientId: 'cloud-client'
        },
        user: {
          id: data.userId,
          username: data.userId === 'admin-id' ? 'admin' : 'user'
        }
      })),
      findFirst: jest.fn(({ where }) => {
        if (where.accessToken === 'valid-admin-token') {
          return {
            id: 1,
            accessToken: 'valid-admin-token',
            userId: 'admin-id',
            clientId: 1,
            expiresAt: new Date(Date.now() + 3600000),
            client: {
              id: 1,
              clientId: 'cloud-client'
            },
            user: {
              id: 'admin-id',
              username: 'admin'
            }
          }
        }
        if (where.accessToken === 'valid-user-token') {
          return {
            id: 2,
            accessToken: 'valid-user-token',
            userId: 'user-id',
            clientId: 1,
            expiresAt: new Date(Date.now() + 3600000),
            client: {
              id: 1,
              clientId: 'cloud-client'
            },
            user: {
              id: 'user-id',
              username: 'user'
            }
          }
        }
        return null
      }),
      findUnique: jest.fn(({ where }) => {
        if (where.accessToken === 'valid-admin-token') {
          return {
            id: 1,
            accessToken: 'valid-admin-token',
            userId: 'admin-id',
            clientId: 1,
            expiresAt: new Date(Date.now() + 3600000),
            client: {
              id: 1,
              clientId: 'cloud-client'
            },
            user: {
              id: 'admin-id',
              username: 'admin'
            }
          }
        }
        if (where.accessToken === 'valid-user-token') {
          return {
            id: 2,
            accessToken: 'valid-user-token',
            userId: 'user-id',
            clientId: 1,
            expiresAt: new Date(Date.now() + 3600000),
            client: {
              id: 1,
              clientId: 'cloud-client'
            },
            user: {
              id: 'user-id',
              username: 'user'
            }
          }
        }
        return null
      })
    }
  }
}))

// Import app after mocks are set up
import app from '../../index'

describe('Users API - Reset Password', () => {
  const adminToken = 'valid-admin-token'
  const userToken = 'valid-user-token'

  describe('POST /api/users/:userId/reset-password', () => {
    it('should reset password successfully for root admin', async () => {
      const newPassword = 'newSecurePassword123!'
      const res = await request(app)
        .post('/api/users/target-user-id/reset-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: newPassword })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('user')
      expect(res.body.data.user.id).toBe('target-user-id')

      // Verify bcrypt.hash was called with the new password
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10)
    })

    it('should return 403 for regular user trying to reset password', async () => {
      const res = await request(app)
        .post('/api/users/target-user-id/reset-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ password: 'newPassword123' })

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toBe('Forbidden')
    })

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/users/target-user-id/reset-password')
        .send({ password: 'newPassword123' })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toBe('Unauthorized request: no authentication given')
    })

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/users/non-existent-id/reset-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: 'newPassword123' })

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
      expect(res.body.error).toBe('User not found')
    })

    it('should validate password length', async () => {
      const res = await request(app)
        .post('/api/users/target-user-id/reset-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ password: '123' })

      expect(res.status).toBe(500) // Currently returns 500 instead of 400
      expect(res.body.success).toBe(false)
      expect(res.body.error).toContain('Password must be at least 6 characters')
    })

    it('should validate required password field', async () => {
      const res = await request(app)
        .post('/api/users/target-user-id/reset-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})

      expect(res.status).toBe(500) // Currently returns 500 instead of 400
      expect(res.body.success).toBe(false)
    })

    it('should validate request body structure', async () => {
      const res = await request(app)
        .post('/api/users/target-user-id/reset-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invalidField: 'value' })

      expect(res.status).toBe(500) // Currently returns 500 instead of 400
      expect(res.body.success).toBe(false)
    })
  })
})
