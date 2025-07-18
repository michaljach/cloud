import request from 'supertest'
import app from '../index'

describe('Users API', () => {
  it('should require authentication for /api/users', async () => {
    const res = await request(app).get('/api/users')
    expect(res.status).toBe(401)
  })
})
