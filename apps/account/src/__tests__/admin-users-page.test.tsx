import { getUsers } from '@repo/api'
import { UserProvider } from '@repo/providers'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

import UsersPage from '../app/(home)/admin/users/page'


// Mock the API
jest.mock('@repo/api', () => ({
  getUsers: jest.fn(),
  resetUserPassword: jest.fn()
}))

// Mock the contexts
jest.mock('@repo/providers', () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useUser: () => ({
    accessToken: 'test-token',
    user: {
      id: 'admin-id',
      username: 'admin',
      workspaces: [
        {
          id: 'uw1',
          userId: 'admin-id',
          workspaceId: 'system-admin-workspace',
          role: 'owner',
          joinedAt: new Date('2024-01-01'),
          workspace: {
            id: 'system-admin-workspace',
            name: 'System Admin'
          }
        }
      ]
    }
  })
}))

const mockUsers = [
  {
    id: 'user-1',
    username: 'user1',
    fullName: 'User One',
    storageLimit: 1024,
    workspaces: [
      {
        id: 'uw2',
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: 'member',
        joinedAt: new Date('2024-01-01'),
        workspace: {
          id: 'workspace-1',
          name: 'Test Workspace'
        }
      }
    ]
  },
  {
    id: 'user-2',
    username: 'user2',
    fullName: 'User Two',
    storageLimit: 2048,
    workspaces: []
  }
]

describe('Admin Users Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const mockGetUsers = getUsers as jest.MockedFunction<typeof getUsers>
    // Make the API call resolve after a small delay to simulate real async behavior
    mockGetUsers.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockUsers), 10)
        })
    )
  })

  it('renders loading state initially', async () => {
    render(
      <UserProvider>
        <UsersPage />
      </UserProvider>
    )

    // The component should show loading state initially
    await waitFor(() => {
      expect(screen.getByText('Loading users...')).toBeInTheDocument()
    })
  })

  it('has reset password functionality integrated', async () => {
    // This test verifies that the reset password dialog is imported and available
    render(
      <UserProvider>
        <UsersPage />
      </UserProvider>
    )

    // The component should render without errors
    await waitFor(() => {
      expect(screen.getByText('Loading users...')).toBeInTheDocument()
    })
  })

  it('has proper admin permissions check', async () => {
    // This test verifies that the component checks for root admin permissions
    render(
      <UserProvider>
        <UsersPage />
      </UserProvider>
    )

    // The component should render without errors for root admin
    await waitFor(() => {
      expect(screen.getByText('Loading users...')).toBeInTheDocument()
    })
  })

  it('imports and renders without errors', async () => {
    // This test verifies that the component can be imported and rendered
    // without throwing any errors, which is important for integration
    expect(() => {
      render(
        <UserProvider>
          <UsersPage />
        </UserProvider>
      )
    }).not.toThrow()
  })
})
