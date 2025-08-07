import { getServerUser } from '../getServerUser'
import type { User } from '@repo/types'

// Mock @repo/api
jest.mock('@repo/api', () => ({
  getCurrentUser: jest.fn()
}))

const mockGetCurrentUser = require('@repo/api').getCurrentUser as jest.MockedFunction<
  typeof import('@repo/api').getCurrentUser
>

const mockUser: User = {
  id: '1',
  username: 'testuser',
  email: 'test@test.com',
  workspaces: []
}

describe('getServerUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Next.js cookies context', () => {
    it('should return user when valid access token is in cookies', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'valid-token' })
      }

      mockGetCurrentUser.mockResolvedValue({
        user: mockUser,
        storageQuota: null
      })

      const result = await getServerUser({ cookies: () => mockCookies })

      expect(mockCookies.get).toHaveBeenCalledWith('accessToken')
      expect(mockGetCurrentUser).toHaveBeenCalledWith('valid-token')
      expect(result).toEqual(mockUser)
    })

    it('should return null when no access token in cookies', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined)
      }

      const result = await getServerUser({ cookies: () => mockCookies })

      expect(mockCookies.get).toHaveBeenCalledWith('accessToken')
      expect(mockGetCurrentUser).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should return null when access token cookie has no value', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: undefined })
      }

      const result = await getServerUser({ cookies: () => mockCookies })

      expect(mockCookies.get).toHaveBeenCalledWith('accessToken')
      expect(mockGetCurrentUser).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should return null when getCurrentUser throws an error', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'invalid-token' })
      }

      mockGetCurrentUser.mockRejectedValue(new Error('Invalid token'))

      const result = await getServerUser({ cookies: () => mockCookies })

      expect(mockCookies.get).toHaveBeenCalledWith('accessToken')
      expect(mockGetCurrentUser).toHaveBeenCalledWith('invalid-token')
      expect(result).toBeNull()
    })
  })

  describe('Request headers context', () => {
    it('should return user when valid Bearer token is in Authorization header', async () => {
      const mockHeaders = {
        get: jest
          .fn()
          .mockReturnValueOnce(null) // First call for 'authorization'
          .mockReturnValueOnce('Bearer valid-token') // Second call for 'Authorization'
      }

      mockGetCurrentUser.mockResolvedValue({
        user: mockUser,
        storageQuota: null
      })

      const result = await getServerUser({ headers: mockHeaders })

      expect(mockHeaders.get).toHaveBeenCalledWith('authorization')
      expect(mockHeaders.get).toHaveBeenCalledWith('Authorization')
      expect(mockGetCurrentUser).toHaveBeenCalledWith('valid-token')
      expect(result).toEqual(mockUser)
    })

    it('should return user when valid Bearer token is in lowercase authorization header', async () => {
      const mockHeaders = {
        get: jest.fn().mockReturnValueOnce('Bearer valid-token') // First call for 'authorization'
      }

      mockGetCurrentUser.mockResolvedValue({
        user: mockUser,
        storageQuota: null
      })

      const result = await getServerUser({ headers: mockHeaders })

      expect(mockHeaders.get).toHaveBeenCalledWith('authorization')
      expect(mockGetCurrentUser).toHaveBeenCalledWith('valid-token')
      expect(result).toEqual(mockUser)
    })

    it('should return null when no Authorization header is present', async () => {
      const mockHeaders = {
        get: jest
          .fn()
          .mockReturnValueOnce(null) // First call for 'authorization'
          .mockReturnValueOnce(null) // Second call for 'Authorization'
      }

      const result = await getServerUser({ headers: mockHeaders })

      expect(mockHeaders.get).toHaveBeenCalledWith('authorization')
      expect(mockHeaders.get).toHaveBeenCalledWith('Authorization')
      expect(mockGetCurrentUser).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should return null when Authorization header does not start with Bearer', async () => {
      const mockHeaders = {
        get: jest
          .fn()
          .mockReturnValueOnce(null) // First call for 'authorization'
          .mockReturnValueOnce('Basic dXNlcjpwYXNz') // Second call for 'Authorization'
      }

      const result = await getServerUser({ headers: mockHeaders })

      expect(mockHeaders.get).toHaveBeenCalledWith('authorization')
      expect(mockHeaders.get).toHaveBeenCalledWith('Authorization')
      expect(mockGetCurrentUser).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should return null when Authorization header is malformed', async () => {
      const mockHeaders = {
        get: jest
          .fn()
          .mockReturnValueOnce(null) // First call for 'authorization'
          .mockReturnValueOnce('Bearer') // Second call for 'Authorization' (no token)
      }

      const result = await getServerUser({ headers: mockHeaders })

      expect(mockHeaders.get).toHaveBeenCalledWith('authorization')
      expect(mockHeaders.get).toHaveBeenCalledWith('Authorization')
      expect(mockGetCurrentUser).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should return null when getCurrentUser throws an error for header token', async () => {
      const mockHeaders = {
        get: jest
          .fn()
          .mockReturnValueOnce(null) // First call for 'authorization'
          .mockReturnValueOnce('Bearer invalid-token') // Second call for 'Authorization'
      }

      mockGetCurrentUser.mockRejectedValue(new Error('Invalid token'))

      const result = await getServerUser({ headers: mockHeaders })

      expect(mockHeaders.get).toHaveBeenCalledWith('authorization')
      expect(mockHeaders.get).toHaveBeenCalledWith('Authorization')
      expect(mockGetCurrentUser).toHaveBeenCalledWith('invalid-token')
      expect(result).toBeNull()
    })
  })

  describe('Error handling', () => {
    it('should handle non-Error exceptions from getCurrentUser', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'valid-token' })
      }

      mockGetCurrentUser.mockRejectedValue('String error')

      const result = await getServerUser({ cookies: () => mockCookies })

      expect(mockGetCurrentUser).toHaveBeenCalledWith('valid-token')
      expect(result).toBeNull()
    })

    it('should handle network errors from getCurrentUser', async () => {
      const mockHeaders = {
        get: jest
          .fn()
          .mockReturnValueOnce(null) // First call for 'authorization'
          .mockReturnValueOnce('Bearer valid-token') // Second call for 'Authorization'
      }

      mockGetCurrentUser.mockRejectedValue(new Error('Network error'))

      const result = await getServerUser({ headers: mockHeaders })

      expect(mockGetCurrentUser).toHaveBeenCalledWith('valid-token')
      expect(result).toBeNull()
    })
  })

  describe('Type safety', () => {
    it('should handle both context types correctly', async () => {
      // Test cookies context
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: 'cookie-token' })
      }

      mockGetCurrentUser.mockResolvedValue({
        user: mockUser,
        storageQuota: null
      })

      const cookieResult = await getServerUser({ cookies: () => mockCookies })
      expect(cookieResult).toEqual(mockUser)

      // Test headers context
      const mockHeaders = {
        get: jest
          .fn()
          .mockReturnValueOnce(null) // First call for 'authorization'
          .mockReturnValueOnce('Bearer header-token') // Second call for 'Authorization'
      }

      const headerResult = await getServerUser({ headers: mockHeaders })
      expect(headerResult).toEqual(mockUser)
    })
  })
})
