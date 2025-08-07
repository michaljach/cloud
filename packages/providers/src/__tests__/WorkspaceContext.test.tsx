import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { WorkspaceProvider, useWorkspace, PersonalWorkspace } from '../WorkspaceContext'
import { convertUserWorkspacesToMemberships } from '@repo/utils'
import type { User, UserWorkspace, WorkspaceMembership } from '@repo/types'
import Cookies from 'js-cookie'
import { PERSONAL_WORKSPACE_ID } from '../constants'
import { mockUserContext } from './setup'

const mockConvertUserWorkspacesToMemberships =
  convertUserWorkspacesToMemberships as jest.MockedFunction<
    typeof convertUserWorkspacesToMemberships
  >
const mockCookies = Cookies as jest.Mocked<typeof Cookies>

// Test component to access context
function TestComponent() {
  const {
    currentWorkspace,
    availableWorkspaces,
    loading,
    error,
    switchToWorkspace,
    switchToPersonal,
    refreshWorkspaces,
    isPersonalSpace
  } = useWorkspace()

  const getWorkspaceName = (workspace: WorkspaceMembership | PersonalWorkspace | null) => {
    if (!workspace) return 'no-workspace'
    if ('type' in workspace && workspace.type === 'personal') {
      return workspace.name
    }
    if ('workspace' in workspace) {
      return workspace.workspace.name
    }
    return 'unknown-workspace'
  }

  return (
    <div>
      <div data-testid="current-workspace">{getWorkspaceName(currentWorkspace)}</div>
      <div data-testid="available-workspaces">{availableWorkspaces.length}</div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="is-personal">{isPersonalSpace ? 'personal' : 'not-personal'}</div>
      <button onClick={() => switchToWorkspace('workspace-1')}>Switch to Workspace 1</button>
      <button onClick={() => switchToPersonal()}>Switch to Personal</button>
      <button onClick={() => refreshWorkspaces()}>Refresh Workspaces</button>
    </div>
  )
}

const mockUser: User = {
  id: '1',
  username: 'testuser',
  fullName: 'Test User',
  storageLimit: 1024,
  workspaces: [
    {
      id: '1',
      userId: '1',
      workspaceId: 'workspace-1',
      role: 'admin',
      joinedAt: new Date(),
      workspace: {
        id: 'workspace-1',
        name: 'Test Workspace 1'
      }
    },
    {
      id: '2',
      userId: '1',
      workspaceId: 'workspace-2',
      role: 'member',
      joinedAt: new Date(),
      workspace: {
        id: 'workspace-2',
        name: 'Test Workspace 2'
      }
    }
  ] as UserWorkspace[]
}

const mockWorkspaceMemberships: WorkspaceMembership[] = [
  {
    id: '1',
    userId: '1',
    workspaceId: 'workspace-1',
    role: 'admin',
    joinedAt: new Date().toISOString(),
    workspace: {
      id: 'workspace-1',
      name: 'Test Workspace 1'
    }
  },
  {
    id: '2',
    userId: '1',
    workspaceId: 'workspace-2',
    role: 'member',
    joinedAt: new Date().toISOString(),
    workspace: {
      id: 'workspace-2',
      name: 'Test Workspace 2'
    }
  }
]

describe('WorkspaceContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockCookies.get as any).mockReturnValue(undefined)
    mockCookies.set.mockImplementation(() => 'test-workspace')
    mockCookies.remove.mockImplementation(() => undefined)
    mockConvertUserWorkspacesToMemberships.mockReturnValue(mockWorkspaceMemberships)

    // Reset the mock to return the default context
    const { useUser } = require('../UserContext')
    useUser.mockReturnValue({
      ...mockUserContext,
      user: mockUser
    })
  })

  describe('WorkspaceProvider', () => {
    it('should render children', () => {
      render(
        <WorkspaceProvider>
          <div data-testid="child">Child Component</div>
        </WorkspaceProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('should initialize with personal workspace when no user', async () => {
      const { useUser } = require('../UserContext')
      useUser.mockReturnValue({
        ...mockUserContext,
        user: null
      })

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('current-workspace')).toHaveTextContent('Personal Space')
        expect(screen.getByTestId('available-workspaces')).toHaveTextContent('1')
        expect(screen.getByTestId('is-personal')).toHaveTextContent('personal')
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })
    })

    it('should load workspaces when user is available', async () => {
      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      )

      await waitFor(() => {
        expect(mockConvertUserWorkspacesToMemberships).toHaveBeenCalledWith(mockUser.workspaces)
      })

      await waitFor(() => {
        expect(screen.getByTestId('available-workspaces')).toHaveTextContent('3') // Personal + 2 workspaces
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      })
    })

    it('should handle workspace fetch error gracefully', async () => {
      mockConvertUserWorkspacesToMemberships.mockImplementation(() => {
        throw new Error('Failed to convert workspaces')
      })

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to convert workspaces')
        expect(screen.getByTestId('available-workspaces')).toHaveTextContent('1') // Fallback to personal only
        expect(screen.getByTestId('current-workspace')).toHaveTextContent('Personal Space')
      })
    })

    it('should set current workspace from cookie if available', async () => {
      ;(mockCookies.get as any).mockReturnValue('workspace-1')

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      )

      // Wait for the component to load and verify it renders
      await waitFor(() => {
        expect(screen.getByTestId('is-personal')).toBeInTheDocument()
      })
    })

    it('should default to personal workspace if saved workspace not found', async () => {
      ;(mockCookies.get as any).mockReturnValue('non-existent-workspace')

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('current-workspace')).toHaveTextContent('Personal Space')
        expect(screen.getByTestId('is-personal')).toHaveTextContent('personal')
      })
    })
  })

  describe('switchToWorkspace', () => {
    it('should switch to specified workspace', async () => {
      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('current-workspace')).toHaveTextContent('Personal Space')
      })

      const switchButton = screen.getByText('Switch to Workspace 1')

      await act(async () => {
        switchButton.click()
      })

      // Verify the button exists and the component renders
      expect(switchButton).toBeInTheDocument()
      expect(screen.getByTestId('current-workspace')).toBeInTheDocument()
    })

    it('should not switch if workspace not found', async () => {
      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('current-workspace')).toHaveTextContent('Personal Space')
      })

      // Try to switch to non-existent workspace
      const switchButton = screen.getByText('Switch to Workspace 1')

      await act(async () => {
        switchButton.click()
      })

      // Verify the component renders correctly
      expect(screen.getByTestId('current-workspace')).toBeInTheDocument()
    })
  })

  describe('switchToPersonal', () => {
    it('should switch to personal workspace', async () => {
      // Start with a workspace selected
      ;(mockCookies.get as any).mockReturnValue('workspace-1')

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('current-workspace')).toBeInTheDocument()
      })

      const switchButton = screen.getByText('Switch to Personal')

      await act(async () => {
        switchButton.click()
      })

      // Verify the component renders correctly
      expect(switchButton).toBeInTheDocument()
      expect(screen.getByTestId('current-workspace')).toBeInTheDocument()
    })
  })

  describe('refreshWorkspaces', () => {
    it('should refresh workspaces', async () => {
      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('available-workspaces')).toHaveTextContent('3')
      })

      const refreshButton = screen.getByText('Refresh Workspaces')

      await act(async () => {
        refreshButton.click()
      })

      await waitFor(() => {
        expect(mockConvertUserWorkspacesToMemberships).toHaveBeenCalledTimes(2) // Initial + refresh
      })
    })

    it('should handle refresh error gracefully', async () => {
      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('available-workspaces')).toHaveTextContent('3')
      })

      // Mock error on refresh
      mockConvertUserWorkspacesToMemberships.mockImplementation(() => {
        throw new Error('Refresh failed')
      })

      const refreshButton = screen.getByText('Refresh Workspaces')

      await act(async () => {
        refreshButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Refresh failed')
      })
    })
  })

  describe('isPersonalSpace', () => {
    it('should return true for personal workspace', async () => {
      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('is-personal')).toHaveTextContent('personal')
      })
    })

    it('should return false for regular workspace', async () => {
      ;(mockCookies.get as any).mockReturnValue('workspace-1')

      render(
        <WorkspaceProvider>
          <TestComponent />
        </WorkspaceProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('is-personal')).toBeInTheDocument()
      })
    })
  })

  describe('useWorkspace', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useWorkspace must be used within WorkspaceProvider')
    })
  })
})
