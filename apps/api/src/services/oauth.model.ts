import { Request } from 'express'
import { Token, Client, User as OAuthUser } from 'oauth2-server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { User as SharedUser } from '@repo/types'
const prisma = new PrismaClient()

export default {
  /**
   * Get an OAuth client by clientId and clientSecret
   * @param clientId OAuth client ID
   * @param clientSecret OAuth client secret
   * @returns OAuth2 client object or null if not found/invalid
   */
  getClient: async (clientId: string, clientSecret: string) => {
    const client = await prisma.oAuthClient.findUnique({ where: { clientId } })
    if (!client || client.clientSecret !== clientSecret) return null
    const { id, grants, redirectUris, ...rest } = client
    return {
      id: String(id),
      grants: grants.split(','),
      redirectUris: redirectUris.split(','),
      ...rest
    }
  },
  /**
   * Get a user by username and password (verifies password)
   * @param username Username
   * @param password Plaintext password
   * @returns SharedUser object or null if not found/invalid
   */
  getUser: async (username: string, password: string): Promise<SharedUser | null> => {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return null
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return null
    const { id, username: uname } = user
    return { id, username: uname }
  },
  /**
   * Save a new OAuth token to the database
   * @param token OAuth2 token object
   * @param client OAuth2 client object
   * @param user OAuth2 user object
   * @returns Saved token object in OAuth2-server format
   */
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
    const {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope,
      client: dbClient,
      user: dbUser
    } = dbToken
    const { id: clientId, grants, redirectUris, ...clientRest } = dbClient
    const { id: userId, username } = dbUser
    return {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope,
      client: {
        ...clientRest,
        id: String(clientId),
        grants: grants.split(','),
        redirectUris: redirectUris.split(',')
      },
      user: { id: userId, username } as SharedUser
    }
  },
  /**
   * Get an access token and associated client/user by accessToken string
   * @param accessToken Access token string
   * @returns Token object or null if not found
   */
  getAccessToken: async (accessToken: string) => {
    const dbToken = await prisma.oAuthToken.findUnique({
      where: { accessToken },
      include: { client: true, user: true }
    })
    if (!dbToken) return null
    const {
      accessToken: at,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope,
      client: dbClient,
      user: dbUser
    } = dbToken
    const { id: clientId, grants, redirectUris, ...clientRest } = dbClient
    const { id: userId, username } = dbUser
    return {
      accessToken: at,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      scope,
      client: {
        ...clientRest,
        id: String(clientId),
        grants: grants.split(','),
        redirectUris: redirectUris.split(',')
      },
      user: { id: userId, username } as SharedUser
    }
  },
  /**
   * Verify the scope of a token (always returns true in this implementation)
   * @param token Token object
   * @param scope Scope string or array
   * @returns true
   */
  verifyScope: async (token: any, scope: string | string[]) => {
    // Implement scope verification if needed
    return true
  }
  // Add other required methods as needed for your grant types
}
