// Test setup file for providers package
import '@testing-library/jest-dom'
import React from 'react'

// Mock all external dependencies
jest.mock('@repo/api', () => ({
  getCurrentUser: jest.fn(),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  updateCurrentUser: jest.fn(),
  getMyInvites: jest.fn()
}))

jest.mock('@repo/utils', () => ({
  convertUserWorkspacesToMemberships: jest.fn()
}))

jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn()
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  }
}))

// Export mock context for individual test customization
export const mockUserContext = {
  accessToken: 'test-token',
  user: {
    id: '1',
    username: 'testuser',
    fullName: 'Test User',
    storageLimit: 10240,
    workspaces: []
  },
  loading: false,
  error: null,
  storageQuota: null,
  login: jest.fn(),
  logout: jest.fn(),
  updateUser: jest.fn(),
  refreshStorageQuota: jest.fn()
}

// Mock UserContext for tests that need it
jest.mock('../UserContext', () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
  useUser: jest.fn(() => mockUserContext)
}))
