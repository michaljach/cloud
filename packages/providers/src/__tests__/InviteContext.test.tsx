import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { InviteProvider, useInvites } from '../InviteContext'
import { getMyInvites } from '@repo/api'
import type { WorkspaceInvite } from '@repo/types'
import { mockUserContext } from './setup'

const mockGetMyInvites = getMyInvites as jest.MockedFunction<typeof getMyInvites>

// Test component to access context
function TestComponent() {
  const { invites, loading, error, refreshInvites, inviteCount } = useInvites()

  return (
    <div>
      <div data-testid="invites-count">{invites.length}</div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="invite-count">{inviteCount}</div>
      <button onClick={() => refreshInvites()}>Refresh Invites</button>
      {invites.map((invite, index) => (
        <div key={invite.id} data-testid={`invite-${index}`}>
          {invite.workspace?.name || 'Unknown Workspace'}
        </div>
      ))}
    </div>
  )
}

const mockInvites: WorkspaceInvite[] = [
  {
    id: 'invite-1',
    workspaceId: 'workspace-1',
    invitedByUserId: 'user-1',
    invitedUsername: 'inviter1',
    role: 'admin',
    status: 'pending',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    workspace: {
      id: 'workspace-1',
      name: 'Test Workspace 1'
    },
    invitedBy: {
      id: 'user-1',
      username: 'inviter1',
      fullName: 'Inviter One'
    }
  },
  {
    id: 'invite-2',
    workspaceId: 'workspace-2',
    invitedByUserId: 'user-2',
    invitedUsername: 'inviter2',
    role: 'member',
    status: 'pending',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    workspace: {
      id: 'workspace-2',
      name: 'Test Workspace 2'
    },
    invitedBy: {
      id: 'user-2',
      username: 'inviter2',
      fullName: 'Inviter Two'
    }
  }
]

describe('InviteContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the mock to return the default context
    const { useUser } = require('../UserContext')
    useUser.mockReturnValue(mockUserContext)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('InviteProvider', () => {
    it('should render children', () => {
      render(
        <InviteProvider>
          <div data-testid="child">Child Component</div>
        </InviteProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should initialize with default state', () => {
      render(
        <InviteProvider>
          <TestComponent />
        </InviteProvider>
      )

      expect(screen.getByTestId('invites-count')).toHaveTextContent('0')
      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
      expect(screen.getByTestId('invite-count')).toHaveTextContent('0')
    })

    it('should fetch invites when user and accessToken are available', async () => {
      mockGetMyInvites.mockResolvedValue(mockInvites)

      render(
        <InviteProvider>
          <TestComponent />
        </InviteProvider>
      )

      await waitFor(() => {
        expect(mockGetMyInvites).toHaveBeenCalledWith('test-token')
      })

      await waitFor(() => {
        expect(screen.getByTestId('invites-count')).toHaveTextContent('2')
        expect(screen.getByTestId('invite-count')).toHaveTextContent('2')
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })
    })

    it('should not fetch invites when user is null', async () => {
      const { useUser } = require('../UserContext')
      useUser.mockReturnValue({
        ...mockUserContext,
        user: null
      })

      render(
        <InviteProvider>
          <TestComponent />
        </InviteProvider>
      )

      await waitFor(() => {
        expect(mockGetMyInvites).not.toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByTestId('invites-count')).toHaveTextContent('0')
      })
    })

    it('should not fetch invites when accessToken is null', async () => {
      const { useUser } = require('../UserContext')
      useUser.mockReturnValue({
        ...mockUserContext,
        accessToken: null
      })

      render(
        <InviteProvider>
          <TestComponent />
        </InviteProvider>
      )

      await waitFor(() => {
        expect(mockGetMyInvites).not.toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByTestId('invites-count')).toHaveTextContent('0')
      })
    })

    it('should handle fetch error gracefully', async () => {
      mockGetMyInvites.mockRejectedValue(new Error('Failed to fetch invitations'))

      render(
        <InviteProvider>
          <TestComponent />
        </InviteProvider>
      )

      await waitFor(() => {
        expect(mockGetMyInvites).toHaveBeenCalledWith('test-token')
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch invitations')
        expect(screen.getByTestId('invites-count')).toHaveTextContent('0')
      })
    })

    it('should handle non-Error exceptions', async () => {
      mockGetMyInvites.mockRejectedValue('String error')

      render(
        <InviteProvider>
          <TestComponent />
        </InviteProvider>
      )

      await waitFor(() => {
        expect(mockGetMyInvites).toHaveBeenCalledWith('test-token')
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch invitations')
        expect(screen.getByTestId('invites-count')).toHaveTextContent('0')
      })
    })
  })

  describe('refreshInvites', () => {
    it('should refresh invites successfully', async () => {
      mockGetMyInvites.mockResolvedValueOnce(mockInvites).mockResolvedValueOnce([mockInvites[0]!]) // Return only one invite on refresh

      render(
        <InviteProvider>
          <TestComponent />
        </InviteProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('invites-count')).toHaveTextContent('2')
      })

      const refreshButton = screen.getByText('Refresh Invites')

      await act(async () => {
        refreshButton.click()
      })

      await waitFor(() => {
        expect(mockGetMyInvites).toHaveBeenCalledTimes(2) // Initial + refresh
      })

      await waitFor(() => {
        expect(screen.getByTestId('invites-count')).toHaveTextContent('1')
      })
    })

    it('should handle refresh error gracefully', async () => {
      mockGetMyInvites
        .mockResolvedValueOnce(mockInvites)
        .mockRejectedValueOnce(new Error('Refresh failed'))

      render(
        <InviteProvider>
          <TestComponent />
        </InviteProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('invites-count')).toHaveTextContent('2')
      })

      const refreshButton = screen.getByText('Refresh Invites')

      await act(async () => {
        refreshButton.click()
      })

      await waitFor(() => {
        expect(mockGetMyInvites).toHaveBeenCalledTimes(2)
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Refresh failed')
      })
    })
  })

  describe('inviteCount', () => {
    it('should return correct invite count', async () => {
      mockGetMyInvites.mockResolvedValue(mockInvites)

      render(
        <InviteProvider>
          <TestComponent />
        </InviteProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('invite-count')).toHaveTextContent('2')
      })
    })

    it('should return 0 when no invites', async () => {
      mockGetMyInvites.mockResolvedValue([])

      render(
        <InviteProvider>
          <TestComponent />
        </InviteProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('invite-count')).toHaveTextContent('0')
      })
    })
  })

  describe('useInvites', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useInvites must be used within InviteProvider')
    })
  })

  describe('loading states', () => {
    it('should show loading state during initial fetch', () => {
      // Don't resolve the promise immediately to test loading state
      mockGetMyInvites.mockImplementation(() => new Promise(() => {}))

      render(
        <InviteProvider>
          <TestComponent />
        </InviteProvider>
      )

      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
    })

    it('should show loading state during refresh', async () => {
      mockGetMyInvites
        .mockResolvedValueOnce(mockInvites)
        .mockImplementationOnce(() => new Promise(() => {})) // Never resolve refresh

      render(
        <InviteProvider>
          <TestComponent />
        </InviteProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })

      const refreshButton = screen.getByText('Refresh Invites')

      await act(async () => {
        refreshButton.click()
      })

      // Should show loading during refresh
      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
    })
  })
})
