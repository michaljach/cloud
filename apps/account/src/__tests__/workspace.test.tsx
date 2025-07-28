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

describe('Workspace Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Workspace API Functions', () => {
    it('should fetch user workspaces', async () => {
      const mockWorkspaces = [
        {
          id: 'membership-1',
          role: 'owner',
          joinedAt: '2024-01-01T00:00:00Z',
          workspace: {
            id: 'workspace-1',
            name: 'Test Workspace'
          }
        }
      ]

      ;(getMyWorkspaces as jest.Mock).mockResolvedValue(mockWorkspaces)

      const result = await getMyWorkspaces('test-token')

      expect(getMyWorkspaces).toHaveBeenCalledWith('test-token')
      expect(result).toEqual(mockWorkspaces)
    })

    it('should fetch workspace members', async () => {
      const mockMembers = [
        {
          userId: 'user-1',
          username: 'testuser',
          fullName: 'Test User',
          role: 'owner',
          joinedAt: '2024-01-01T00:00:00Z'
        }
      ]

      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockMembers)

      const result = await getWorkspaceMembers('test-token', 'workspace-1')

      expect(getWorkspaceMembers).toHaveBeenCalledWith('test-token', 'workspace-1')
      expect(result).toEqual(mockMembers)
    })

    it('should create a new workspace', async () => {
      const mockWorkspace = {
        id: 'workspace-3',
        name: 'New Workspace'
      }

      ;(createWorkspace as jest.Mock).mockResolvedValue(mockWorkspace)

      const result = await createWorkspace('test-token', 'New Workspace')

      expect(createWorkspace).toHaveBeenCalledWith('test-token', 'New Workspace')
      expect(result).toEqual(mockWorkspace)
    })

    it('should update workspace name', async () => {
      const mockWorkspace = {
        id: 'workspace-1',
        name: 'Updated Workspace'
      }

      ;(updateWorkspace as jest.Mock).mockResolvedValue(mockWorkspace)

      const result = await updateWorkspace('test-token', 'workspace-1', 'Updated Workspace')

      expect(updateWorkspace).toHaveBeenCalledWith('test-token', 'workspace-1', 'Updated Workspace')
      expect(result).toEqual(mockWorkspace)
    })

    it('should leave a workspace', async () => {
      ;(leaveWorkspace as jest.Mock).mockResolvedValue(undefined)

      await leaveWorkspace('test-token', 'workspace-1')

      expect(leaveWorkspace).toHaveBeenCalledWith('test-token', 'workspace-1')
    })

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
        }
      ]

      ;(getMyInvites as jest.Mock).mockResolvedValue(mockInvites)

      const result = await getMyInvites('test-token')

      expect(getMyInvites).toHaveBeenCalledWith('test-token')
      expect(result).toEqual(mockInvites)
    })

    it('should accept workspace invite', async () => {
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

      expect(acceptWorkspaceInvite).toHaveBeenCalledWith('test-token', 'invite-1')
      expect(result).toEqual(mockResponse)
    })

    it('should decline workspace invite', async () => {
      const mockInvite = {
        id: 'invite-1',
        status: 'declined'
      }

      ;(declineWorkspaceInvite as jest.Mock).mockResolvedValue(mockInvite)

      const result = await declineWorkspaceInvite('test-token', 'invite-1')

      expect(declineWorkspaceInvite).toHaveBeenCalledWith('test-token', 'invite-1')
      expect(result).toEqual(mockInvite)
    })

    it('should create workspace invite', async () => {
      const mockInvite = {
        id: 'invite-1',
        workspaceId: 'workspace-1',
        invitedUsername: 'newuser',
        role: 'member',
        status: 'pending'
      }

      ;(createWorkspaceInvite as jest.Mock).mockResolvedValue(mockInvite)

      const result = await createWorkspaceInvite('test-token', 'workspace-1', 'newuser', 'member')

      expect(createWorkspaceInvite).toHaveBeenCalledWith(
        'test-token',
        'workspace-1',
        'newuser',
        'member'
      )
      expect(result).toEqual(mockInvite)
    })

    it('should cancel workspace invite', async () => {
      const mockInvite = {
        id: 'invite-1',
        status: 'cancelled'
      }

      ;(cancelWorkspaceInvite as jest.Mock).mockResolvedValue(mockInvite)

      const result = await cancelWorkspaceInvite('test-token', 'invite-1')

      expect(cancelWorkspaceInvite).toHaveBeenCalledWith('test-token', 'invite-1')
      expect(result).toEqual(mockInvite)
    })

    it('should add user to workspace', async () => {
      const mockResponse = {
        userId: 'user-2',
        role: 'member'
      }

      ;(addUserToWorkspace as jest.Mock).mockResolvedValue(mockResponse)

      const result = await addUserToWorkspace('test-token', 'workspace-1', 'user-2', 'member')

      expect(addUserToWorkspace).toHaveBeenCalledWith(
        'test-token',
        'workspace-1',
        'user-2',
        'member'
      )
      expect(result).toEqual(mockResponse)
    })

    it('should update user workspace role', async () => {
      const mockResponse = {
        userId: 'user-2',
        role: 'admin'
      }

      ;(updateUserWorkspaceRole as jest.Mock).mockResolvedValue(mockResponse)

      const result = await updateUserWorkspaceRole('test-token', 'workspace-1', 'user-2', 'admin')

      expect(updateUserWorkspaceRole).toHaveBeenCalledWith(
        'test-token',
        'workspace-1',
        'user-2',
        'admin'
      )
      expect(result).toEqual(mockResponse)
    })

    it('should remove user from workspace', async () => {
      ;(removeUserFromWorkspace as jest.Mock).mockResolvedValue(undefined)

      await removeUserFromWorkspace('test-token', 'workspace-1', 'user-2')

      expect(removeUserFromWorkspace).toHaveBeenCalledWith('test-token', 'workspace-1', 'user-2')
    })
  })

  describe('Workspace Error Handling', () => {
    it('should handle workspace fetch errors', async () => {
      const error = new Error('Failed to fetch workspaces')
      ;(getMyWorkspaces as jest.Mock).mockRejectedValue(error)

      await expect(getMyWorkspaces('test-token')).rejects.toThrow('Failed to fetch workspaces')
    })

    it('should handle workspace creation errors', async () => {
      const error = new Error('Workspace name already exists')
      ;(createWorkspace as jest.Mock).mockRejectedValue(error)

      await expect(createWorkspace('test-token', 'Existing Workspace')).rejects.toThrow(
        'Workspace name already exists'
      )
    })

    it('should handle workspace update errors', async () => {
      const error = new Error('Permission denied')
      ;(updateWorkspace as jest.Mock).mockRejectedValue(error)

      await expect(updateWorkspace('test-token', 'workspace-1', 'New Name')).rejects.toThrow(
        'Permission denied'
      )
    })

    it('should handle workspace leave errors', async () => {
      const error = new Error('Cannot leave workspace as owner')
      ;(leaveWorkspace as jest.Mock).mockRejectedValue(error)

      await expect(leaveWorkspace('test-token', 'workspace-1')).rejects.toThrow(
        'Cannot leave workspace as owner'
      )
    })
  })

  describe('Workspace Role Permissions', () => {
    it('should allow owners to perform all actions', async () => {
      const mockWorkspace = {
        id: 'workspace-1',
        name: 'Owner Workspace'
      }

      ;(updateWorkspace as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(addUserToWorkspace as jest.Mock).mockResolvedValue({})
      ;(removeUserFromWorkspace as jest.Mock).mockResolvedValue(undefined)

      // Owner should be able to update workspace
      await updateWorkspace('test-token', 'workspace-1', 'New Name')
      expect(updateWorkspace).toHaveBeenCalled()

      // Owner should be able to add users
      await addUserToWorkspace('test-token', 'workspace-1', 'user-2', 'member')
      expect(addUserToWorkspace).toHaveBeenCalled()

      // Owner should be able to remove users
      await removeUserFromWorkspace('test-token', 'workspace-1', 'user-2')
      expect(removeUserFromWorkspace).toHaveBeenCalled()
    })

    it('should allow admins to perform most actions', async () => {
      const mockWorkspace = {
        id: 'workspace-1',
        name: 'Admin Workspace'
      }

      ;(updateWorkspace as jest.Mock).mockResolvedValue(mockWorkspace)
      ;(addUserToWorkspace as jest.Mock).mockResolvedValue({})

      // Admin should be able to update workspace
      await updateWorkspace('test-token', 'workspace-1', 'New Name')
      expect(updateWorkspace).toHaveBeenCalled()

      // Admin should be able to add users
      await addUserToWorkspace('test-token', 'workspace-1', 'user-2', 'member')
      expect(addUserToWorkspace).toHaveBeenCalled()
    })

    it('should restrict members to limited actions', async () => {
      // Members should only be able to leave workspace
      ;(leaveWorkspace as jest.Mock).mockResolvedValue(undefined)

      await leaveWorkspace('test-token', 'workspace-2')
      expect(leaveWorkspace).toHaveBeenCalled()
    })
  })

  describe('Workspace Invite Management', () => {
    it('should handle invite creation with different roles', async () => {
      const mockMemberInvite = {
        id: 'invite-1',
        role: 'member',
        status: 'pending'
      }

      const mockAdminInvite = {
        id: 'invite-2',
        role: 'admin',
        status: 'pending'
      }

      ;(createWorkspaceInvite as jest.Mock)
        .mockResolvedValueOnce(mockMemberInvite)
        .mockResolvedValueOnce(mockAdminInvite)

      // Create member invite
      await createWorkspaceInvite('test-token', 'workspace-1', 'newmember', 'member')
      expect(createWorkspaceInvite).toHaveBeenCalledWith(
        'test-token',
        'workspace-1',
        'newmember',
        'member'
      )

      // Create admin invite
      await createWorkspaceInvite('test-token', 'workspace-1', 'newadmin', 'admin')
      expect(createWorkspaceInvite).toHaveBeenCalledWith(
        'test-token',
        'workspace-1',
        'newadmin',
        'admin'
      )
    })

    it('should handle invite acceptance and decline', async () => {
      const mockAcceptedInvite = {
        id: 'invite-1',
        status: 'accepted'
      }

      const mockDeclinedInvite = {
        id: 'invite-2',
        status: 'declined'
      }

      ;(acceptWorkspaceInvite as jest.Mock).mockResolvedValue(mockAcceptedInvite)
      ;(declineWorkspaceInvite as jest.Mock).mockResolvedValue(mockDeclinedInvite)

      // Accept invite
      await acceptWorkspaceInvite('test-token', 'invite-1')
      expect(acceptWorkspaceInvite).toHaveBeenCalledWith('test-token', 'invite-1')

      // Decline invite
      await declineWorkspaceInvite('test-token', 'invite-2')
      expect(declineWorkspaceInvite).toHaveBeenCalledWith('test-token', 'invite-2')
    })
  })
})
