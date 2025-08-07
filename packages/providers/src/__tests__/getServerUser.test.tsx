import type { User } from '@repo/types'

const mockUser: User = {
  id: '1',
  username: 'testuser',
  fullName: 'Test User',
  storageLimit: 1024,
  workspaces: []
}

describe('getServerUser', () => {
  describe('Next.js cookies context', () => {
    it('should return null when no access token in cookies', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined)
      }

      // Mock the dynamic import
      jest.doMock('@repo/api', () => ({
        getCurrentUser: jest.fn()
      }))

      const { getServerUser } = require('../getServerUser')

      const result = await getServerUser({ cookies: () => mockCookies })

      expect(mockCookies.get).toHaveBeenCalledWith('accessToken')
      expect(result).toBeNull()
    })

    it('should return null when access token cookie has no value', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: undefined })
      }

      // Mock the dynamic import
      jest.doMock('@repo/api', () => ({
        getCurrentUser: jest.fn()
      }))

      const { getServerUser } = require('../getServerUser')

      const result = await getServerUser({ cookies: () => mockCookies })

      expect(mockCookies.get).toHaveBeenCalledWith('accessToken')
      expect(result).toBeNull()
    })
  })

  describe('Request headers context', () => {
    it('should return null when no Authorization header is present', async () => {
      const mockHeaders = {
        get: jest
          .fn()
          .mockReturnValueOnce(null) // First call for 'authorization'
          .mockReturnValueOnce(null) // Second call for 'Authorization'
      }

      // Mock the dynamic import
      jest.doMock('@repo/api', () => ({
        getCurrentUser: jest.fn()
      }))

      const { getServerUser } = require('../getServerUser')

      const result = await getServerUser({ headers: mockHeaders })

      expect(mockHeaders.get).toHaveBeenCalledWith('authorization')
      expect(mockHeaders.get).toHaveBeenCalledWith('Authorization')
      expect(result).toBeNull()
    })

    it('should return null when Authorization header does not start with Bearer', async () => {
      const mockHeaders = {
        get: jest
          .fn()
          .mockReturnValueOnce(null) // First call for 'authorization'
          .mockReturnValueOnce('Basic dXNlcjpwYXNz') // Second call for 'Authorization'
      }

      // Mock the dynamic import
      jest.doMock('@repo/api', () => ({
        getCurrentUser: jest.fn()
      }))

      const { getServerUser } = require('../getServerUser')

      const result = await getServerUser({ headers: mockHeaders })

      expect(mockHeaders.get).toHaveBeenCalledWith('authorization')
      expect(mockHeaders.get).toHaveBeenCalledWith('Authorization')
      expect(result).toBeNull()
    })

    it('should return null when Authorization header is malformed', async () => {
      const mockHeaders = {
        get: jest
          .fn()
          .mockReturnValueOnce(null) // First call for 'authorization'
          .mockReturnValueOnce('Bearer') // Second call for 'Authorization' (no token)
      }

      // Mock the dynamic import
      jest.doMock('@repo/api', () => ({
        getCurrentUser: jest.fn()
      }))

      const { getServerUser } = require('../getServerUser')

      const result = await getServerUser({ headers: mockHeaders })

      expect(mockHeaders.get).toHaveBeenCalledWith('authorization')
      expect(mockHeaders.get).toHaveBeenCalledWith('Authorization')
      expect(result).toBeNull()
    })
  })

  describe('Type safety', () => {
    it('should accept both context types', async () => {
      // Mock the dynamic import
      jest.doMock('@repo/api', () => ({
        getCurrentUser: jest.fn()
      }))

      const { getServerUser } = require('../getServerUser')

      // Test that the function can be called with both context types
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined)
      }

      const mockHeaders = {
        get: jest.fn().mockReturnValue(null)
      }

      // These should not throw type errors
      await getServerUser({ cookies: () => mockCookies })
      await getServerUser({ headers: mockHeaders })
    })
  })
})
