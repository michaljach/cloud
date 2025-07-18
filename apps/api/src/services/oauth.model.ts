import { Request } from 'express'
import { Token, Client, User } from 'oauth2-server'

const clients = [
  {
    id: 'client1',
    clientId: 'client1',
    clientSecret: 'secret',
    grants: ['password', 'client_credentials'],
    redirectUris: []
  }
]

const users = [{ id: 1, username: 'user', password: 'pass' }]

let tokens: any[] = []

export default {
  getClient: (clientId: string, clientSecret: string) => {
    console.log('getClient', clientId, clientSecret)
    return Promise.resolve(
      clients.find((c) => c.clientId === clientId && c.clientSecret === clientSecret) || null
    )
  },
  getUser: (username: string, password: string) => {
    return Promise.resolve(
      users.find((u) => u.username === username && u.password === password) || null
    )
  },
  saveToken: (token: Token, client: Client, user: User) => {
    const t = { ...token, client, user }
    tokens.push(t)
    return Promise.resolve(t)
  },
  getAccessToken: (accessToken: string) => {
    return Promise.resolve(tokens.find((t) => t.accessToken === accessToken) || null)
  },
  verifyScope: (token: any, scope: string | string[]) => {
    return Promise.resolve(true)
  }
  // Add other required methods as needed for your grant types
}
