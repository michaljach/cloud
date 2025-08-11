import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { getMyInvites } from '@repo/api'
import { UserProvider, WorkspaceProvider, InviteProvider, useInvites } from '@repo/providers'

// Mock the API
jest.mock('@repo/api', () => ({
  getMyInvites: jest.fn()
}))

// Mock the auth hooks
jest.mock('@repo/providers', () => ({
  ...jest.requireActual('@repo/providers'),
  useUser: jest.fn(),
  useWorkspace: jest.fn(),
  useInvites: jest.fn(),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  InviteProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

import { useUser, useWorkspace } from '@repo/providers'

// Test component that uses the invite context
function TestInviteComponent() {
  const { invites, loading, error, inviteCount } = useInvites()

  if (loading) return <div>Loading invites...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <div>Invite count: {inviteCount}</div>
      <div>Invites: {invites.length}</div>
      {invites.map((invite) => (
        <div key={invite.id}>{invite.workspace?.name}</div>
      ))}
    </div>
  )
}

describe('InviteContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('provides invite data through context', () => {
    const mockInvites = [
      {
        id: 'invite-1',
        workspace: { id: 'workspace-1', name: 'Test Workspace' },
        invitedBy: { id: 'user-1', username: 'testuser', fullName: 'Test User' },
        invitedUsername: 'inviteduser',
        role: 'member',
        status: 'pending',
        expiresAt: '2024-12-31T23:59:59.000Z',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    ]

    // Mock user context
    ;(useUser as jest.Mock).mockReturnValue({
      user: { id: 'user-1', username: 'testuser' },
      accessToken: 'test-token',
      loading: false
    })

    // Mock workspace context
    ;(useWorkspace as jest.Mock).mockReturnValue({
      currentWorkspace: null,
      availableWorkspaces: [],
      loading: false
    })

    // Mock invite context
    ;(useInvites as jest.Mock).mockReturnValue({
      invites: mockInvites,
      loading: false,
      error: null,
      refreshInvites: jest.fn(),
      inviteCount: mockInvites.length
    })

    render(
      <UserProvider>
        <WorkspaceProvider>
          <InviteProvider>
            <TestInviteComponent />
          </InviteProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    expect(screen.getByText('Invite count: 1')).toBeInTheDocument()
    expect(screen.getByText('Invites: 1')).toBeInTheDocument()
    expect(screen.getByText('Test Workspace')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    // Mock user context
    ;(useUser as jest.Mock).mockReturnValue({
      user: { id: 'user-1', username: 'testuser' },
      accessToken: 'test-token',
      loading: false
    })

    // Mock workspace context
    ;(useWorkspace as jest.Mock).mockReturnValue({
      currentWorkspace: null,
      availableWorkspaces: [],
      loading: false
    })

    // Mock invite context with loading state
    ;(useInvites as jest.Mock).mockReturnValue({
      invites: [],
      loading: true,
      error: null,
      refreshInvites: jest.fn(),
      inviteCount: 0
    })

    render(
      <UserProvider>
        <WorkspaceProvider>
          <InviteProvider>
            <TestInviteComponent />
          </InviteProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    expect(screen.getByText('Loading invites...')).toBeInTheDocument()
  })

  it('shows error state', () => {
    // Mock user context
    ;(useUser as jest.Mock).mockReturnValue({
      user: { id: 'user-1', username: 'testuser' },
      accessToken: 'test-token',
      loading: false
    })

    // Mock workspace context
    ;(useWorkspace as jest.Mock).mockReturnValue({
      currentWorkspace: null,
      availableWorkspaces: [],
      loading: false
    })

    // Mock invite context with error state
    ;(useInvites as jest.Mock).mockReturnValue({
      invites: [],
      loading: false,
      error: 'Failed to fetch invitations',
      refreshInvites: jest.fn(),
      inviteCount: 0
    })

    render(
      <UserProvider>
        <WorkspaceProvider>
          <InviteProvider>
            <TestInviteComponent />
          </InviteProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    expect(screen.getByText('Error: Failed to fetch invitations')).toBeInTheDocument()
  })
})
