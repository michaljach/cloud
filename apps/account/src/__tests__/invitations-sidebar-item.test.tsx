import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import { UserProvider, WorkspaceProvider, InviteProvider, useInvites } from '@repo/providers'
import { SidebarProvider } from '@repo/ui/components/base/sidebar'

import { PageSidebarInvitations } from '@/features/layout/page-sidebar-invitations'

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

import { useUser, useWorkspace, useInvites } from '@repo/providers'

describe('PageSidebarInvitations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows invitations when there are invites', () => {
    // Mock invite context with invites
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
              <PageSidebarInvitations />
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
    // Mock invite context with no invites
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
              <PageSidebarInvitations />
            </SidebarProvider>
          </InviteProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    // Should not show invitations when there are no invites
    expect(screen.queryByText('Invitations')).not.toBeInTheDocument()
  })

  it('shows invitations during loading state', () => {
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
            <SidebarProvider>
              <PageSidebarInvitations />
            </SidebarProvider>
          </InviteProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    // Should show invitations during loading (even if count is 0)
    expect(screen.getByText('Invitations')).toBeInTheDocument()
    // Should not show badge during loading
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows badge with correct count when there are multiple invites', () => {
    // Mock invite context with multiple invites
    ;(useInvites as jest.Mock).mockReturnValue({
      invites: [
        { id: 'invite-1', workspace: { name: 'Workspace 1' } },
        { id: 'invite-2', workspace: { name: 'Workspace 2' } },
        { id: 'invite-3', workspace: { name: 'Workspace 3' } }
      ],
      loading: false,
      error: null,
      refreshInvites: jest.fn(),
      inviteCount: 3
    })

    render(
      <UserProvider>
        <WorkspaceProvider>
          <InviteProvider>
            <SidebarProvider>
              <PageSidebarInvitations />
            </SidebarProvider>
          </InviteProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    // Should show invitations with correct badge count
    expect(screen.getByText('Invitations')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // Badge count
  })
})
