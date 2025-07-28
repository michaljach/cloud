import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { UserProvider } from '@repo/auth'
import WorkspacesPage from '../../app/(home)/workspaces/page'

// Mock the API functions
jest.mock('@repo/api', () => ({
  ...jest.requireActual('@repo/api'),
  getMyWorkspaces: jest.fn()
}))

// Mock useUser hook
jest.mock('@repo/auth', () => ({
  ...jest.requireActual('@repo/auth'),
  useUser: jest.fn(),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children)
  }
})

import { getMyWorkspaces } from '@repo/api'
import { useUser } from '@repo/auth'

describe('Workspaces Page', () => {
  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    fullName: 'Test User',
    storageLimit: 1024,
    workspaces: []
  }

  const mockWorkspaces = [
    {
      id: 'membership-1',
      role: 'owner',
      joinedAt: '2024-01-01T00:00:00Z',
      workspace: {
        id: 'workspace-1',
        name: 'Test Workspace'
      }
    },
    {
      id: 'membership-2',
      role: 'member',
      joinedAt: '2024-01-02T00:00:00Z',
      workspace: {
        id: 'workspace-2',
        name: 'Another Workspace'
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
          <WorkspacesPage />
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
          <WorkspacesPage />
        </UserProvider>
      )

      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error message when API call fails', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockRejectedValue(new Error('API Error'))

      await act(async () => {
        render(
          <UserProvider>
            <WorkspacesPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument()
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when user has no workspaces', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([])

      await act(async () => {
        render(
          <UserProvider>
            <WorkspacesPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('No Workspaces')).toBeInTheDocument()
        expect(screen.getByText('You are not a member of any workspaces yet.')).toBeInTheDocument()
        expect(screen.getByText('Create Your First Workspace')).toBeInTheDocument()
      })
    })

    it('has create workspace link in empty state', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([])

      await act(async () => {
        render(
          <UserProvider>
            <WorkspacesPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        const createLink = screen.getByText('Create Your First Workspace')
        expect(createLink.closest('a')).toHaveAttribute('href', '/workspaces/create')
      })
    })
  })

  describe('Workspaces List', () => {
    it('displays workspaces when user has workspaces', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue(mockWorkspaces)

      await act(async () => {
        render(
          <UserProvider>
            <WorkspacesPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Test Workspace')).toBeInTheDocument()
        expect(screen.getByText('Another Workspace')).toBeInTheDocument()
      })
    })

    it('displays workspace roles correctly', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue(mockWorkspaces)

      await act(async () => {
        render(
          <UserProvider>
            <WorkspacesPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('owner')).toBeInTheDocument()
        expect(screen.getByText('member')).toBeInTheDocument()
      })
    })

    it('displays workspace IDs', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue(mockWorkspaces)

      await act(async () => {
        render(
          <UserProvider>
            <WorkspacesPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Workspace ID: workspace-1')).toBeInTheDocument()
        expect(screen.getByText('Workspace ID: workspace-2')).toBeInTheDocument()
      })
    })

    it('displays join dates', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue(mockWorkspaces)

      await act(async () => {
        render(
          <UserProvider>
            <WorkspacesPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getAllByText(/Joined:/)).toHaveLength(2)
        expect(screen.getAllByText(/Member since/)).toHaveLength(2)
      })
    })
  })

  describe('Navigation', () => {
    it('has create workspace button in header', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([])

      await act(async () => {
        render(
          <UserProvider>
            <WorkspacesPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        const createButton = screen.getByText('Create Workspace')
        expect(createButton.closest('a')).toHaveAttribute('href', '/workspaces/create')
      })
    })

    it('has view details links for each workspace', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue(mockWorkspaces)

      await act(async () => {
        render(
          <UserProvider>
            <WorkspacesPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        const viewDetailsLinks = screen.getAllByText('View Details')
        expect(viewDetailsLinks).toHaveLength(2)

        expect(viewDetailsLinks[0]?.closest('a')).toHaveAttribute('href', '/workspaces/workspace-1')
        expect(viewDetailsLinks[1]?.closest('a')).toHaveAttribute('href', '/workspaces/workspace-2')
      })
    })
  })

  describe('Page Header', () => {
    it('displays correct page title and description', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([])

      await act(async () => {
        render(
          <UserProvider>
            <WorkspacesPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('My Workspaces')).toBeInTheDocument()
        expect(screen.getByText('Manage your workspace memberships and access')).toBeInTheDocument()
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
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([])

      await act(async () => {
        render(
          <UserProvider>
            <WorkspacesPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(getMyWorkspaces).toHaveBeenCalledWith('test-token')
      })
    })

    it('refreshes workspaces when component mounts', async () => {
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([])

      await act(async () => {
        render(
          <UserProvider>
            <WorkspacesPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(getMyWorkspaces).toHaveBeenCalledTimes(1)
      })
    })
  })
})
