import '@testing-library/jest-dom'
import { UserProvider } from '@repo/providers'
import { useUser } from '@repo/providers'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import React from 'react'

import WorkspaceDetailsPage from '../../app/(home)/workspaces/[id]/page'

// Mock the API functions
jest.mock('@repo/api', () => ({
  ...jest.requireActual('@repo/api'),
  getWorkspaceMembers: jest.fn(),
  updateUserWorkspaceRole: jest.fn(),
  removeUserFromWorkspace: jest.fn(),
  leaveWorkspace: jest.fn()
}))

// Mock useUser hook
jest.mock('@repo/providers', () => ({
  ...jest.requireActual('@repo/providers'),
  useUser: jest.fn(),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'workspace-1' })
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children)
  }
})

// Mock the dialog components
jest.mock('@/features/workspaces/dialogs/workspace-edit-dialog', () => ({
  WorkspaceEditDialog: ({ open, onOpenChange }: any) =>
    open ? <div data-testid="workspace-edit-dialog">Workspace Edit Dialog</div> : null
}))

jest.mock('@/features/workspaces/dialogs/workspace-invite-dialog', () => ({
  WorkspaceInviteDialog: ({ open, onOpenChange }: any) =>
    open ? <div data-testid="workspace-invite-dialog">Workspace Invite Dialog</div> : null
}))

jest.mock('@/features/workspaces/dialogs/leave-workspace-dialog', () => ({
  LeaveWorkspaceDialog: ({ open, onOpenChange, onConfirm }: any) =>
    open ? <div data-testid="leave-workspace-dialog">Leave Dialog</div> : null
}))

jest.mock('@/features/workspaces/dialogs/remove-member-dialog', () => ({
  RemoveMemberDialog: ({ open, onOpenChange, onConfirm }: any) =>
    open ? <div data-testid="remove-member-dialog">Remove Dialog</div> : null
}))

import {
  getWorkspaceMembers,
  updateUserWorkspaceRole,
  removeUserFromWorkspace,
  leaveWorkspace
} from '@repo/api'

describe('Workspace Details Page', () => {
  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    fullName: 'Test User',
    storageLimit: 1024,
    workspaces: []
  }

  const mockWorkspaceMembership = {
    id: 'membership-1',
    workspaceId: 'workspace-1',
    role: 'owner',
    joinedAt: '2024-01-01T00:00:00Z',
    workspace: {
      id: 'workspace-1',
      name: 'Test Workspace'
    }
  }

  const mockWorkspaceMembers = [
    {
      id: 'membership-1',
      userId: 'user-1',
      username: 'testuser',
      fullName: 'Test User',
      role: 'owner',
      joinedAt: '2024-01-01T00:00:00Z',
      user: {
        id: 'user-1',
        username: 'testuser',
        fullName: 'Test User'
      }
    },
    {
      id: 'membership-2',
      userId: 'user-2',
      username: 'memberuser',
      fullName: 'Member User',
      role: 'member',
      joinedAt: '2024-01-02T00:00:00Z',
      user: {
        id: 'user-2',
        username: 'memberuser',
        fullName: 'Member User'
      }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading state when user is loading', () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
        accessToken: null
      })

      render(
        <UserProvider>
          <WorkspaceDetailsPage />
        </UserProvider>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Authentication State', () => {
    it('shows not authenticated message when user is not logged in', () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
        accessToken: null
      })

      render(
        <UserProvider>
          <WorkspaceDetailsPage />
        </UserProvider>
      )

      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error when user is not a member of the workspace', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })

      await act(async () => {
        render(
          <UserProvider>
            <WorkspaceDetailsPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('You are not a member of this workspace')).toBeInTheDocument()
      })
    })
  })

  describe('Workspace Details Display', () => {
    beforeEach(async () => {
      const userWithWorkspace = {
        ...mockUser,
        workspaces: [mockWorkspaceMembership]
      }

      ;(useUser as jest.Mock).mockReturnValue({
        user: userWithWorkspace,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockWorkspaceMembers)

      await act(async () => {
        render(
          <UserProvider>
            <WorkspaceDetailsPage />
          </UserProvider>
        )
      })
    })

    it('displays workspace name', async () => {
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Workspace' })).toBeInTheDocument()
      })
    })

    it('displays workspace ID', async () => {
      await waitFor(() => {
        expect(screen.getByText('Workspace ID: workspace-1')).toBeInTheDocument()
      })
    })
  })

  describe('Members Table', () => {
    beforeEach(async () => {
      const userWithWorkspace = {
        ...mockUser,
        workspaces: [mockWorkspaceMembership]
      }

      ;(useUser as jest.Mock).mockReturnValue({
        user: userWithWorkspace,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockWorkspaceMembers)

      await act(async () => {
        render(
          <UserProvider>
            <WorkspaceDetailsPage />
          </UserProvider>
        )
      })
    })

    it('displays members section', async () => {
      await waitFor(() => {
        expect(screen.getByText('Members')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    beforeEach(async () => {
      const userWithWorkspace = {
        ...mockUser,
        workspaces: [mockWorkspaceMembership]
      }

      ;(useUser as jest.Mock).mockReturnValue({
        user: userWithWorkspace,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockWorkspaceMembers)

      await act(async () => {
        render(
          <UserProvider>
            <WorkspaceDetailsPage />
          </UserProvider>
        )
      })
    })

    it('has back to workspaces link', async () => {
      await waitFor(() => {
        const backLink = screen.getByText('Back to Workspaces')
        expect(backLink.closest('a')).toHaveAttribute('href', '/workspaces')
      })
    })
  })

  describe('API Integration', () => {
    it('uses workspace data from user object', async () => {
      const userWithWorkspace = {
        ...mockUser,
        workspaces: [mockWorkspaceMembership]
      }

      ;(useUser as jest.Mock).mockReturnValue({
        user: userWithWorkspace,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockWorkspaceMembers)

      await act(async () => {
        render(
          <UserProvider>
            <WorkspaceDetailsPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Workspace' })).toBeInTheDocument()
      })
    })

    it('calls getWorkspaceMembers with correct parameters', async () => {
      const userWithWorkspace = {
        ...mockUser,
        workspaces: [mockWorkspaceMembership]
      }

      ;(useUser as jest.Mock).mockReturnValue({
        user: userWithWorkspace,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockWorkspaceMembers)

      await act(async () => {
        render(
          <UserProvider>
            <WorkspaceDetailsPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(getWorkspaceMembers).toHaveBeenCalledWith('test-token', 'workspace-1')
      })
    })
  })

  describe('Page Header', () => {
    beforeEach(async () => {
      const userWithWorkspace = {
        ...mockUser,
        workspaces: [mockWorkspaceMembership]
      }

      ;(useUser as jest.Mock).mockReturnValue({
        user: userWithWorkspace,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockWorkspaceMembers)

      await act(async () => {
        render(
          <UserProvider>
            <WorkspaceDetailsPage />
          </UserProvider>
        )
      })
    })

    it('displays workspace name in header', async () => {
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Workspace' })).toBeInTheDocument()
      })
    })
  })
})
