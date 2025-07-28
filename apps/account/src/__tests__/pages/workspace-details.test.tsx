import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { UserProvider } from '@repo/auth'
import WorkspaceDetailsPage from '../../app/(home)/workspaces/[id]/page'

// Mock the API functions
jest.mock('@repo/api', () => ({
  ...jest.requireActual('@repo/api'),
  getMyWorkspaces: jest.fn(),
  getWorkspaceMembers: jest.fn(),
  updateUserWorkspaceRole: jest.fn(),
  removeUserFromWorkspace: jest.fn(),
  leaveWorkspace: jest.fn()
}))

// Mock useUser hook
jest.mock('@repo/auth', () => ({
  ...jest.requireActual('@repo/auth'),
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

// Mock the modal components
jest.mock('@/components/workspace-edit-modal', () => ({
  WorkspaceEditModal: ({ open, onOpenChange }: any) =>
    open ? <div data-testid="workspace-edit-modal">Edit Modal</div> : null
}))

jest.mock('@/components/workspace-invite-modal', () => ({
  WorkspaceInviteModal: ({ open, onOpenChange }: any) =>
    open ? <div data-testid="workspace-invite-modal">Invite Modal</div> : null
}))

jest.mock('@/components/leave-workspace-dialog', () => ({
  LeaveWorkspaceDialog: ({ open, onOpenChange, onConfirm }: any) =>
    open ? <div data-testid="leave-workspace-dialog">Leave Dialog</div> : null
}))

jest.mock('@/components/remove-member-dialog', () => ({
  RemoveMemberDialog: ({ open, onOpenChange, onConfirm }: any) =>
    open ? <div data-testid="remove-member-dialog">Remove Dialog</div> : null
}))

import {
  getMyWorkspaces,
  getWorkspaceMembers,
  updateUserWorkspaceRole,
  removeUserFromWorkspace,
  leaveWorkspace
} from '@repo/api'
import { useUser } from '@repo/auth'

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
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([])

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

    it('shows error when API call fails', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockRejectedValue(new Error('API Error'))

      await act(async () => {
        render(
          <UserProvider>
            <WorkspaceDetailsPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument()
      })
    })
  })

  describe('Workspace Details Display', () => {
    beforeEach(async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([mockWorkspaceMembership])
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
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([mockWorkspaceMembership])
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
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([mockWorkspaceMembership])
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
    it('calls getMyWorkspaces with correct token', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([mockWorkspaceMembership])
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockWorkspaceMembers)

      await act(async () => {
        render(
          <UserProvider>
            <WorkspaceDetailsPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(getMyWorkspaces).toHaveBeenCalledWith('test-token')
      })
    })

    it('calls getWorkspaceMembers with correct parameters', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([mockWorkspaceMembership])
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
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([mockWorkspaceMembership])
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
