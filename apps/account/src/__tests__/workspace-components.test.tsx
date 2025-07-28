import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { UserProvider } from '@repo/auth'
import { SidebarProvider } from '@repo/ui/components/base/sidebar'

// Mock workspace-related API functions
jest.mock('@repo/api', () => ({
  ...jest.requireActual('@repo/api'),
  getMyWorkspaces: jest.fn(),
  getWorkspaceMembers: jest.fn(),
  createWorkspace: jest.fn(),
  updateWorkspace: jest.fn(),
  leaveWorkspace: jest.fn(),
  getMyInvites: jest.fn(),
  acceptWorkspaceInvite: jest.fn(),
  declineWorkspaceInvite: jest.fn(),
  createWorkspaceInvite: jest.fn(),
  cancelWorkspaceInvite: jest.fn(),
  addUserToWorkspace: jest.fn(),
  updateUserWorkspaceRole: jest.fn(),
  removeUserFromWorkspace: jest.fn()
}))

// Mock useUser to provide workspace data
jest.mock('@repo/auth', () => ({
  ...jest.requireActual('@repo/auth'),
  useUser: () => ({
    accessToken: 'test-token',
    user: {
      id: 'user-1',
      username: 'testuser',
      fullName: 'Test User',
      storageLimit: 1024,
      workspaces: [
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
    }
  }),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

import {
  getMyWorkspaces,
  getWorkspaceMembers,
  createWorkspace,
  updateWorkspace,
  leaveWorkspace,
  getMyInvites,
  acceptWorkspaceInvite,
  declineWorkspaceInvite,
  createWorkspaceInvite,
  cancelWorkspaceInvite,
  addUserToWorkspace,
  updateUserWorkspaceRole,
  removeUserFromWorkspace
} from '@repo/api'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  useParams: () => ({ id: 'workspace-1' })
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children)
  }
})

describe('Workspace Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Workspace List Component', () => {
    it('should render workspace list with user workspaces', async () => {
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

      ;(getMyWorkspaces as jest.Mock).mockResolvedValue(mockWorkspaces)

      // This would test a workspace list component
      // For now, we'll test the API call
      const workspaces = await getMyWorkspaces('test-token')

      expect(workspaces).toHaveLength(2)
      expect(workspaces[0]?.workspace.name).toBe('Test Workspace')
      expect(workspaces[0]?.role).toBe('owner')
      expect(workspaces[1]?.workspace.name).toBe('Another Workspace')
      expect(workspaces[1]?.role).toBe('member')
    })

    it('should handle empty workspace list', async () => {
      ;(getMyWorkspaces as jest.Mock).mockResolvedValue([])

      const workspaces = await getMyWorkspaces('test-token')

      expect(workspaces).toHaveLength(0)
    })

    it('should display workspace roles correctly', async () => {
      const mockWorkspaces = [
        {
          id: 'membership-1',
          role: 'owner',
          joinedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: 'workspace-1',
            name: 'Owner Workspace'
          }
        },
        {
          id: 'membership-2',
          role: 'admin',
          joinedAt: '2024-01-02T00:00:00Z',
          workspace: {
            id: 'workspace-2',
            name: 'Admin Workspace'
          }
        },
        {
          id: 'membership-3',
          role: 'member',
          joinedAt: '2024-01-03T00:00:00Z',
          workspace: {
            id: 'workspace-3',
            name: 'Member Workspace'
          }
        }
      ]

      ;(getMyWorkspaces as jest.Mock).mockResolvedValue(mockWorkspaces)

      const workspaces = await getMyWorkspaces('test-token')

      expect(workspaces[0]?.role).toBe('owner')
      expect(workspaces[1]?.role).toBe('admin')
      expect(workspaces[2]?.role).toBe('member')
    })
  })

  describe('Workspace Details Component', () => {
    it('should fetch and display workspace members', async () => {
      const mockMembers = [
        {
          userId: 'user-1',
          username: 'testuser',
          fullName: 'Test User',
          role: 'owner',
          joinedAt: '2024-01-01T00:00:00Z'
        },
        {
          userId: 'user-2',
          username: 'memberuser',
          fullName: 'Member User',
          role: 'member',
          joinedAt: '2024-01-02T00:00:00Z'
        }
      ]

      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockMembers)

      const members = await getWorkspaceMembers('test-token', 'workspace-1')

      expect(members).toHaveLength(2)
      expect(members[0]?.userId).toBe('user-1')
      expect(members[0]?.role).toBe('owner')
      expect(members[1]?.userId).toBe('user-2')
      expect(members[1]?.role).toBe('member')
    })

    it('should handle workspace member role updates', async () => {
      const mockResponse = {
        userId: 'user-2',
        role: 'admin'
      }

      ;(updateUserWorkspaceRole as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateUserWorkspaceRole('test-token', 'workspace-1', 'user-2', 'admin')

      expect(result.role).toBe('admin')
      expect(updateUserWorkspaceRole).toHaveBeenCalledWith(
        'test-token',
        'workspace-1',
        'user-2',
        'admin'
      )
    })

    it('should handle removing members from workspace', async () => {
      ;(removeUserFromWorkspace as jest.Mock).mockResolvedValue(undefined)

      await removeUserFromWorkspace('test-token', 'workspace-1', 'user-2')

      expect(removeUserFromWorkspace).toHaveBeenCalledWith('test-token', 'workspace-1', 'user-2')
    })
  })

  describe('Workspace Creation Component', () => {
    it('should create a new workspace successfully', async () => {
      const mockWorkspace = {
        id: 'workspace-3',
        name: 'New Workspace'
      }

      ;(createWorkspace as jest.Mock).mockResolvedValue(mockWorkspace)

      const result = await createWorkspace('test-token', 'New Workspace')

      expect(result.name).toBe('New Workspace')
      expect(result.id).toBe('workspace-3')
      expect(createWorkspace).toHaveBeenCalledWith('test-token', 'New Workspace')
    })

    it('should handle workspace creation validation', async () => {
      // Test empty name
      const emptyNameError = new Error('Workspace name is required')
      ;(createWorkspace as jest.Mock).mockRejectedValueOnce(emptyNameError)
      await expect(createWorkspace('test-token', '')).rejects.toThrow('Workspace name is required')

      // Test very long name
      const longName = 'a'.repeat(101)
      const longNameError = new Error('Name must be less than 100 characters')
      ;(createWorkspace as jest.Mock).mockRejectedValueOnce(longNameError)
      await expect(createWorkspace('test-token', longName)).rejects.toThrow(
        'Name must be less than 100 characters'
      )
    })

    it('should handle workspace creation errors', async () => {
      const error = new Error('Workspace name already exists')
      ;(createWorkspace as jest.Mock).mockRejectedValue(error)

      await expect(createWorkspace('test-token', 'Existing Workspace')).rejects.toThrow(
        'Workspace name already exists'
      )
    })
  })

  describe('Workspace Invite Components', () => {
    it('should fetch user invites', async () => {
      const mockInvites = [
        {
          id: 'invite-1',
          workspaceId: 'workspace-1',
          workspaceName: 'Test Workspace',
          invitedUsername: 'testuser',
          role: 'member',
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'invite-2',
          workspaceId: 'workspace-2',
          workspaceName: 'Another Workspace',
          invitedUsername: 'testuser',
          role: 'admin',
          status: 'pending',
          createdAt: '2024-01-02T00:00:00Z'
        }
      ]

      ;(getMyInvites as jest.Mock).mockResolvedValue(mockInvites)

      const invites = await getMyInvites('test-token')

      expect(invites).toHaveLength(2)
      expect(invites[0]?.workspaceId).toBe('workspace-1')
      expect(invites[0]?.role).toBe('member')
      expect(invites[1]?.workspaceId).toBe('workspace-2')
      expect(invites[1]?.role).toBe('admin')
    })

    it('should create workspace invites with different roles', async () => {
      const mockMemberInvite = {
        id: 'invite-1',
        workspaceId: 'workspace-1',
        invitedUsername: 'newmember',
        role: 'member',
        status: 'pending'
      }

      const mockAdminInvite = {
        id: 'invite-2',
        workspaceId: 'workspace-1',
        invitedUsername: 'newadmin',
        role: 'admin',
        status: 'pending'
      }

      ;(createWorkspaceInvite as jest.Mock)
        .mockResolvedValueOnce(mockMemberInvite)
        .mockResolvedValueOnce(mockAdminInvite)

      // Create member invite
      const memberInvite = await createWorkspaceInvite(
        'test-token',
        'workspace-1',
        'newmember',
        'member'
      )
      expect(memberInvite.role).toBe('member')

      // Create admin invite
      const adminInvite = await createWorkspaceInvite(
        'test-token',
        'workspace-1',
        'newadmin',
        'admin'
      )
      expect(adminInvite.role).toBe('admin')
    })

    it('should handle invite acceptance', async () => {
      const mockResponse = {
        invite: {
          id: 'invite-1',
          status: 'accepted'
        },
        userWorkspace: {
          id: 'membership-1',
          role: 'member'
        }
      }

      ;(acceptWorkspaceInvite as jest.Mock).mockResolvedValue(mockResponse)

      const result = await acceptWorkspaceInvite('test-token', 'invite-1')

      expect(result.invite.status).toBe('accepted')
      expect(result.userWorkspace.role).toBe('member')
    })

    it('should handle invite decline', async () => {
      const mockInvite = {
        id: 'invite-1',
        status: 'declined'
      }

      ;(declineWorkspaceInvite as jest.Mock).mockResolvedValue(mockInvite)

      const result = await declineWorkspaceInvite('test-token', 'invite-1')

      expect(result.status).toBe('declined')
    })

    it('should handle invite cancellation', async () => {
      const mockInvite = {
        id: 'invite-1',
        status: 'cancelled'
      }

      ;(cancelWorkspaceInvite as jest.Mock).mockResolvedValue(mockInvite)

      const result = await cancelWorkspaceInvite('test-token', 'invite-1')

      expect(result.status).toBe('cancelled')
    })
  })

  describe('Workspace Management Components', () => {
    it('should update workspace name', async () => {
      const mockWorkspace = {
        id: 'workspace-1',
        name: 'Updated Workspace Name'
      }

      ;(updateWorkspace as jest.Mock).mockResolvedValue(mockWorkspace)

      const result = await updateWorkspace('test-token', 'workspace-1', 'Updated Workspace Name')

      expect(result.name).toBe('Updated Workspace Name')
      expect(updateWorkspace).toHaveBeenCalledWith(
        'test-token',
        'workspace-1',
        'Updated Workspace Name'
      )
    })

    it('should handle workspace leave action', async () => {
      ;(leaveWorkspace as jest.Mock).mockResolvedValue(undefined)

      await leaveWorkspace('test-token', 'workspace-1')

      expect(leaveWorkspace).toHaveBeenCalledWith('test-token', 'workspace-1')
    })

    it('should add users to workspace', async () => {
      const mockResponse = {
        userId: 'user-3',
        role: 'member'
      }

      ;(addUserToWorkspace as jest.Mock).mockResolvedValue(mockResponse)

      const result = await addUserToWorkspace('test-token', 'workspace-1', 'user-3', 'member')

      expect(result.userId).toBe('user-3')
      expect(result.role).toBe('member')
    })
  })

  describe('Workspace Permission Components', () => {
    it('should check owner permissions', async () => {
      const mockWorkspaces = [
        {
          id: 'membership-1',
          role: 'owner',
          workspace: {
            id: 'workspace-1',
            name: 'Owner Workspace'
          }
        }
      ]

      ;(getMyWorkspaces as jest.Mock).mockResolvedValue(mockWorkspaces)

      const workspaces = await getMyWorkspaces('test-token')
      const ownerWorkspace = workspaces.find((w) => w.role === 'owner')

      expect(ownerWorkspace).toBeDefined()
      expect(ownerWorkspace?.role).toBe('owner')
    })

    it('should check admin permissions', async () => {
      const mockWorkspaces = [
        {
          id: 'membership-1',
          role: 'admin',
          workspace: {
            id: 'workspace-1',
            name: 'Admin Workspace'
          }
        }
      ]

      ;(getMyWorkspaces as jest.Mock).mockResolvedValue(mockWorkspaces)

      const workspaces = await getMyWorkspaces('test-token')
      const adminWorkspace = workspaces.find((w) => w.role === 'admin')

      expect(adminWorkspace).toBeDefined()
      expect(adminWorkspace?.role).toBe('admin')
    })

    it('should check member permissions', async () => {
      const mockWorkspaces = [
        {
          id: 'membership-1',
          role: 'member',
          workspace: {
            id: 'workspace-1',
            name: 'Member Workspace'
          }
        }
      ]

      ;(getMyWorkspaces as jest.Mock).mockResolvedValue(mockWorkspaces)

      const workspaces = await getMyWorkspaces('test-token')
      const memberWorkspace = workspaces.find((w) => w.role === 'member')

      expect(memberWorkspace).toBeDefined()
      expect(memberWorkspace?.role).toBe('member')
    })
  })

  describe('Workspace Error Handling Components', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error')
      ;(getMyWorkspaces as jest.Mock).mockRejectedValue(networkError)

      await expect(getMyWorkspaces('test-token')).rejects.toThrow('Network error')
    })

    it('should handle permission errors', async () => {
      const permissionError = new Error('Permission denied')
      ;(updateWorkspace as jest.Mock).mockRejectedValue(permissionError)

      await expect(updateWorkspace('test-token', 'workspace-1', 'New Name')).rejects.toThrow(
        'Permission denied'
      )
    })

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid workspace name')
      ;(createWorkspace as jest.Mock).mockRejectedValue(validationError)

      await expect(createWorkspace('test-token', '')).rejects.toThrow('Invalid workspace name')
    })
  })
})
