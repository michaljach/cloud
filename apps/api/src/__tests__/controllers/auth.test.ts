import request from 'supertest'

// Set up environment variables for testing
process.env.OAUTH_CLIENT_ID = 'cloud-client'
process.env.OAUTH_CLIENT_SECRET = 'cloud-secret'

jest.mock('@prisma/client')
jest.mock('@lib/prisma', () => ({
  prisma: {
    oAuthClient: {
      findUnique: jest.fn(({ where }) => {
        if (where.clientId === 'cloud-client') {
          return {
            id: 1,
            clientId: 'cloud-client',
            clientSecret: 'cloud-secret',
            grants: 'password,refresh_token',
            redirectUris: 'http://localhost:3000/callback'
          }
        }
        return null
      })
    },
    user: {
      findUnique: jest.fn(({ where }) => {
        if (where.username === 'user') {
          return {
            id: 1,
            username: 'user',
            password: 'hashed-user123',
            fullName: 'Test User',
            storageLimit: 1024
          }
        }
        return null
      })
    },
    oAuthToken: {
      create: jest.fn(({ data }) => {
        return {
          ...data,
          client: {
            id: 1,
            clientId: 'cloud-client',
            clientSecret: 'cloud-secret',
            grants: 'password,refresh_token',
            redirectUris: 'http://localhost:3000/callback'
          },
          user: {
            id: 1,
            username: 'user'
          }
        }
      })
    }
  }
}))
jest.mock('bcryptjs', () => ({
  compare: jest.fn((input, hash) => input === 'user123'),
  hash: jest.fn((input) => `hashed-${input}`)
}))

// Import app after mocks are set up
import app from '../../index'

describe('Auth API', () => {
  it('should fail with missing credentials', async () => {
    const res = await request(app)
      .post('/api/auth/token')
      .type('form')
      .send({ grant_type: 'password' })
    expect(res.status).not.toBe(200)
    expect(res.body).toHaveProperty('error')
    expect(res.body.success).toBe(false)
  })

  it('should fail with invalid credentials', async () => {
    const res = await request(app).post('/api/auth/token').type('form').send({
      grant_type: 'password',
      username: 'wrong',
      password: 'wrong',
      client_id: 'cloud-client',
      client_secret: 'cloud-secret'
    })
    expect(res.status).not.toBe(200)
    expect(res.body).toHaveProperty('error')
    expect(res.body.success).toBe(false)
  })

  it('should return access token with valid credentials', async () => {
    const res = await request(app).post('/api/auth/token').type('form').send({
      grant_type: 'password',
      username: 'user',
      password: 'user123',
      client_id: 'cloud-client',
      client_secret: 'cloud-secret'
    })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toHaveProperty('accessToken')
    expect(res.body.data).toHaveProperty('refreshToken')
  })

  // it('should access protected route with valid token', async () => {
  //   // First, get a valid access token
  //   const tokenRes = await request(app).post('/api/auth/token').type('form').send({
  //     grant_type: 'password',
  //     username: 'user',
  //     password: 'pass',
  //     client_id: 'client1',
  //     client_secret: 'secret'
  //   })
  //   expect(tokenRes.status).toBe(200)
  //   expect(tokenRes.body.success).toBe(true)
  //   expect(tokenRes.body.data).toHaveProperty('accessToken')
  //   const accessToken = tokenRes.body.data.accessToken

  //   // Now, access the protected route
  //   const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`)
  //   expect(res.status).toBe(200)
  //   expect(res.body.success).toBe(true)
  //   expect(res.body.data).toHaveProperty('id')
  //   expect(res.body.data).toHaveProperty('username')
  // })
})
