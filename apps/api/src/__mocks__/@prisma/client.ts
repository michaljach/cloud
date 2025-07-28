export const PrismaClient = jest.fn().mockImplementation(() => ({
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
    }),
    create: jest.fn(({ data }) => ({
      id: 2,
      username: data.username,
      password: data.password
    }))
  },
  oAuthToken: {
    create: jest.fn(({ data }) => ({
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
    })),
    findUnique: jest.fn(({ where }) => {
      if (where.accessToken === 'validAccessToken') {
        return {
          accessToken: 'validAccessToken',
          accessTokenExpiresAt: new Date(Date.now() + 10000),
          refreshToken: 'validRefreshToken',
          refreshTokenExpiresAt: new Date(Date.now() + 20000),
          scope: 'default',
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
      }
      return null
    }),
    deleteMany: jest.fn(() => ({}))
  }
}))
