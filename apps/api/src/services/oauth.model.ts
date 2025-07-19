import { Request } from 'express'
import { Token, Client, User as OAuthUser } from 'oauth2-server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { User as SharedUser } from '@repo/types'
const prisma = new PrismaClient()

export default {
  getClient: async (clientId: string, clientSecret: string) => {
    const client = await prisma.oAuthClient.findUnique({
      where: { clientId }
    })
    if (!client || client.clientSecret !== clientSecret) return null
    // Map DB client to oauth2-server client format
    return {
      id: String(client.id), // Convert id to string
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      grants: client.grants.split(','),
      redirectUris: client.redirectUris.split(',')
    }
  },
  getUser: async (username: string, password: string): Promise<SharedUser | null> => {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return null
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return null
    // Return only the shared User fields
    return { id: user.id, username: user.username }
  },
  saveToken: async (token: Token, client: Client, user: OAuthUser) => {
    const dbToken = await prisma.oAuthToken.create({
      data: {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        scope: Array.isArray(token.scope) ? token.scope.join(' ') : token.scope,
        client: { connect: { clientId: client.clientId } },
        user: { connect: { id: (user as any).id } }
      },
      include: { client: true, user: true }
    })
    // Map DB token to oauth2-server token format
    return {
      accessToken: dbToken.accessToken,
      accessTokenExpiresAt: dbToken.accessTokenExpiresAt,
      refreshToken: dbToken.refreshToken,
      refreshTokenExpiresAt: dbToken.refreshTokenExpiresAt,
      scope: dbToken.scope,
      client: {
        ...dbToken.client,
        id: String(dbToken.client.id),
        grants: dbToken.client.grants.split(','),
        redirectUris: dbToken.client.redirectUris.split(',')
      },
      user: { id: dbToken.user.id, username: dbToken.user.username } as SharedUser
    }
  },
  getAccessToken: async (accessToken: string) => {
    const dbToken = await prisma.oAuthToken.findUnique({
      where: { accessToken },
      include: { client: true, user: true }
    })
    if (!dbToken) return null
    return {
      accessToken: dbToken.accessToken,
      accessTokenExpiresAt: dbToken.accessTokenExpiresAt,
      refreshToken: dbToken.refreshToken,
      refreshTokenExpiresAt: dbToken.refreshTokenExpiresAt,
      scope: dbToken.scope,
      client: {
        ...dbToken.client,
        id: String(dbToken.client.id),
        grants: dbToken.client.grants.split(','),
        redirectUris: dbToken.client.redirectUris.split(',')
      },
      user: { id: dbToken.user.id, username: dbToken.user.username } as SharedUser
    }
  },
  verifyScope: async (token: any, scope: string | string[]) => {
    // Implement scope verification if needed
    return true
  }
  // Add other required methods as needed for your grant types
}
