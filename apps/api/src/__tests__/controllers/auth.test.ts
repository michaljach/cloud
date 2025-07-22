import request from 'supertest'
import app from '../../index'

jest.mock('@prisma/client')
jest.mock('bcryptjs', () => ({
  compare: jest.fn((input, hash) => input === 'pass'),
  hash: jest.fn((input) => `hashed-${input}`)
}))

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
      client_id: 'client1',
      client_secret: 'secret'
    })
    expect(res.status).not.toBe(200)
    expect(res.body).toHaveProperty('error')
    expect(res.body.success).toBe(false)
  })

  it('should return access token with valid credentials', async () => {
    const res = await request(app).post('/api/auth/token').type('form').send({
      grant_type: 'password',
      username: 'user',
      password: 'pass',
      client_id: 'client1',
      client_secret: 'secret'
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
