import request from 'supertest'
import app from '../index'

describe('Auth API', () => {
  it('should fail with missing credentials', async () => {
    const res = await request(app)
      .post('/api/oauth/token')
      .type('form')
      .send({ grant_type: 'password' })
    expect(res.status).not.toBe(200)
    expect(res.body).toHaveProperty('error')
  })

  it('should fail with invalid credentials', async () => {
    const res = await request(app).post('/api/oauth/token').type('form').send({
      grant_type: 'password',
      username: 'wrong',
      password: 'wrong',
      client_id: 'client1',
      client_secret: 'secret'
    })
    expect(res.status).not.toBe(200)
    expect(res.body).toHaveProperty('error')
  })

  it('should return access token with valid credentials', async () => {
    const res = await request(app).post('/api/oauth/token').type('form').send({
      grant_type: 'password',
      username: 'user',
      password: 'pass',
      client_id: 'client1',
      client_secret: 'secret'
    })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('accessToken')
  })

  it('should fail to access protected route without token', async () => {
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(401)
  })

  it('should access protected route with valid token', async () => {
    // First, get a valid access token
    const tokenRes = await request(app).post('/api/oauth/token').type('form').send({
      grant_type: 'password',
      username: 'user',
      password: 'pass',
      client_id: 'client1',
      client_secret: 'secret'
    })
    expect(tokenRes.status).toBe(200)
    expect(tokenRes.body).toHaveProperty('accessToken')
    const accessToken = tokenRes.body.accessToken

    // Now, access the protected route
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})
