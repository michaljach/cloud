import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { UserProvider } from '../UserContext'
import { useUser } from '../UserContext'
import { getCurrentUser, refreshToken } from '@repo/api'

// Mock the API functions
jest.mock('@repo/api', () => ({
  getCurrentUser: jest.fn(),
  refreshToken: jest.fn(),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  updateCurrentUser: jest.fn(),
  apiClient: {
    setTokenManager: jest.fn()
  }
}))

// Mock js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn()
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

// Test component that uses the user context
function TestComponent() {
  const { user, loading, error, accessToken } = useUser()

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {user && <div>User: {user.username}</div>}
      {accessToken && <div>Token: {accessToken}</div>}
    </div>
  )
}

describe('Token Refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should automatically refresh token when getCurrentUser fails with expired token', async () => {
    const mockUser = { id: '1', username: 'testuser', workspaces: [] }
    const mockStorageQuota = {
      totalUsage: { bytes: 0, megabytes: 0 },
      breakdown: {
        files: { bytes: 0, megabytes: 0 },
        notes: { bytes: 0, megabytes: 0 },
        photos: { bytes: 0, megabytes: 0 }
      }
    }

    // Mock initial token in cookies
    const { get: mockGet, set: mockSet } = require('js-cookie')
    mockGet.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'expired-token'
      if (key === 'refreshToken') return 'valid-refresh-token'
      return null
    })

    // Mock getCurrentUser to fail with expired token error
    ;(getCurrentUser as jest.Mock).mockRejectedValueOnce(
      new Error('Invalid token: access token has expired')
    )

    // Mock refreshToken to succeed
    ;(refreshToken as jest.Mock).mockResolvedValueOnce({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString()
    })

    // Mock getCurrentUser to succeed after refresh
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      user: mockUser,
      storageQuota: mockStorageQuota
    })

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Wait for the token refresh to complete
    await waitFor(() => {
      expect(refreshToken).toHaveBeenCalledWith('valid-refresh-token')
    })

    // Wait for the user data to be loaded after refresh
    await waitFor(() => {
      expect(screen.getByText('User: testuser')).toBeInTheDocument()
    })

    // Verify that cookies were updated
    expect(mockSet).toHaveBeenCalledWith('accessToken', 'new-access-token', expect.any(Object))
    expect(mockSet).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', expect.any(Object))
  })

  it('should logout user when refresh token fails', async () => {
    // Mock initial token in cookies
    const { get: mockGet, remove: mockRemove } = require('js-cookie')
    mockGet.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'expired-token'
      if (key === 'refreshToken') return 'invalid-refresh-token'
      return null
    })

    // Mock getCurrentUser to fail with expired token error
    ;(getCurrentUser as jest.Mock).mockRejectedValueOnce(
      new Error('Invalid token: access token has expired')
    )

    // Mock refreshToken to fail
    ;(refreshToken as jest.Mock).mockRejectedValueOnce(new Error('refresh token is invalid'))

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    // Wait for the refresh to fail and logout to be called
    await waitFor(() => {
      expect(refreshToken).toHaveBeenCalledWith('invalid-refresh-token')
    })

    // Verify that cookies were removed
    expect(mockRemove).toHaveBeenCalledWith('accessToken', { path: '/' })
    expect(mockRemove).toHaveBeenCalledWith('refreshToken', { path: '/' })

    // Verify that router.push was called to redirect to login
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('should handle 401 errors as token expiration', async () => {
    const mockUser = { id: '1', username: 'testuser', workspaces: [] }
    const mockStorageQuota = {
      totalUsage: { bytes: 0, megabytes: 0 },
      breakdown: {
        files: { bytes: 0, megabytes: 0 },
        notes: { bytes: 0, megabytes: 0 },
        photos: { bytes: 0, megabytes: 0 }
      }
    }

    // Mock initial token in cookies
    const { get: mockGet } = require('js-cookie')
    mockGet.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'expired-token'
      if (key === 'refreshToken') return 'valid-refresh-token'
      return null
    })

    // Mock getCurrentUser to fail with 401 error
    ;(getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error('401 Unauthorized'))

    // Mock refreshToken to succeed
    ;(refreshToken as jest.Mock).mockResolvedValueOnce({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + 86400000).toISOString()
    })

    // Mock getCurrentUser to succeed after refresh
    ;(getCurrentUser as jest.Mock).mockResolvedValueOnce({
      user: mockUser,
      storageQuota: mockStorageQuota
    })

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    )

    // Wait for the token refresh to complete
    await waitFor(() => {
      expect(refreshToken).toHaveBeenCalledWith('valid-refresh-token')
    })

    // Wait for the user data to be loaded after refresh
    await waitFor(() => {
      expect(screen.getByText('User: testuser')).toBeInTheDocument()
    })
  })
})
