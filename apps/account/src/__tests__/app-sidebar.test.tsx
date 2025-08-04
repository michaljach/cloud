import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { UserProvider, WorkspaceProvider, InviteProvider } from '@repo/contexts'
import { SidebarProvider } from '@repo/ui/components/base/sidebar'
import { PageSidebarWorkspaces } from '@/components/layout/page-sidebar-workspaces'

// Mock the auth hooks
jest.mock('@repo/contexts', () => ({
  ...jest.requireActual('@repo/contexts'),
  useUser: jest.fn(),
  useWorkspace: jest.fn(),
  useInvites: jest.fn(),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  InviteProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

import { useUser, useWorkspace, useInvites } from '@repo/contexts'

describe('Sidebar Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PageSidebarWorkspaces', () => {
    it('shows loading state when user data is loading', () => {
      // Mock loading state
      ;(useUser as jest.Mock).mockReturnValue({
        user: null,
        loading: true
      })
      ;(useWorkspace as jest.Mock).mockReturnValue({
        currentWorkspace: null,
        availableWorkspaces: [],
        loading: false
      })
      ;(useInvites as jest.Mock).mockReturnValue({
        invites: [],
        loading: false,
        error: null,
        refreshInvites: jest.fn(),
        inviteCount: 0
      })

      render(
        <UserProvider>
          <WorkspaceProvider>
            <InviteProvider>
              <SidebarProvider>
                <PageSidebarWorkspaces />
              </SidebarProvider>
            </InviteProvider>
          </WorkspaceProvider>
        </UserProvider>
      )

      // Should show loading skeleton
      expect(screen.getByText('My Workspaces')).toBeInTheDocument()
      // The loading skeleton should be present
      const skeletonElements = document.querySelectorAll('.animate-pulse')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })

    it('shows workspaces when user data is loaded', () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        fullName: 'Test User',
        storageLimit: 1024,
        workspaces: [
          {
            id: 'membership-1',
            userId: 'user-1',
            workspaceId: 'workspace-1',
            role: 'owner',
            joinedAt: new Date('2024-01-01'),
            workspace: {
              id: 'workspace-1',
              name: 'Test Workspace'
            }
          }
        ]
      }

      // Mock loaded state
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false
      })
      ;(useWorkspace as jest.Mock).mockReturnValue({
        currentWorkspace: {
          id: 'workspace-1',
          workspace: { id: 'workspace-1', name: 'Test Workspace' }
        },
        availableWorkspaces: [],
        loading: false
      })
      ;(useInvites as jest.Mock).mockReturnValue({
        invites: [],
        loading: false,
        error: null,
        refreshInvites: jest.fn(),
        inviteCount: 0
      })

      render(
        <UserProvider>
          <WorkspaceProvider>
            <InviteProvider>
              <SidebarProvider>
                <PageSidebarWorkspaces />
              </SidebarProvider>
            </InviteProvider>
          </WorkspaceProvider>
        </UserProvider>
      )

      // Should show the workspaces content
      expect(screen.getByText('My Workspaces')).toBeInTheDocument()
      expect(screen.getByText('Test Workspace')).toBeInTheDocument()
      expect(screen.getByText('Create Workspace')).toBeInTheDocument()

      // Should not show loading skeleton
      const skeletonElements = document.querySelectorAll('.animate-pulse')
      expect(skeletonElements.length).toBe(0)
    })

    it('shows invitations when there are invites', () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        fullName: 'Test User',
        storageLimit: 1024,
        workspaces: []
      }

      // Mock loaded state
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false
      })
      ;(useWorkspace as jest.Mock).mockReturnValue({
        currentWorkspace: null,
        availableWorkspaces: [],
        loading: false
      })
      ;(useInvites as jest.Mock).mockReturnValue({
        invites: [{ id: 'invite-1', workspace: { name: 'Test Workspace' } }],
        loading: false,
        error: null,
        refreshInvites: jest.fn(),
        inviteCount: 1
      })

      render(
        <UserProvider>
          <WorkspaceProvider>
            <InviteProvider>
              <SidebarProvider>
                <PageSidebarWorkspaces />
              </SidebarProvider>
            </InviteProvider>
          </WorkspaceProvider>
        </UserProvider>
      )

      // Should show invitations when there are invites
      expect(screen.getByText('Invitations')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // Badge count
    })

    it('hides invitations when there are no invites', () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        fullName: 'Test User',
        storageLimit: 1024,
        workspaces: []
      }

      // Mock loaded state
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false
      })
      ;(useWorkspace as jest.Mock).mockReturnValue({
        currentWorkspace: null,
        availableWorkspaces: [],
        loading: false
      })
      ;(useInvites as jest.Mock).mockReturnValue({
        invites: [],
        loading: false,
        error: null,
        refreshInvites: jest.fn(),
        inviteCount: 0
      })

      render(
        <UserProvider>
          <WorkspaceProvider>
            <InviteProvider>
              <SidebarProvider>
                <PageSidebarWorkspaces />
              </SidebarProvider>
            </InviteProvider>
          </WorkspaceProvider>
        </UserProvider>
      )

      // Should not show invitations when there are no invites
      expect(screen.queryByText('Invitations')).not.toBeInTheDocument()
    })
  })
})
