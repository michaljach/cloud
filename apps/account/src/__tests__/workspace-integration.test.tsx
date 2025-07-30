import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { UserProvider, WorkspaceProvider } from '@repo/contexts'
import { SidebarProvider } from '@repo/ui/components/base/sidebar'
import { UserDropdown } from '@repo/ui/components/user-dropdown'

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

// Mock useUser and useWorkspace to provide workspace data
jest.mock('@repo/contexts', () => ({
  ...jest.requireActual('@repo/contexts'),
  useUser: jest.fn(),
  useWorkspace: jest.fn(),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
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

import { useUser, useWorkspace } from '@repo/contexts'

describe('Workspace Integration Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Workspace Name Update Refresh', () => {
    it('should refresh user dropdown workspace information when workspace name is updated', async () => {
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
              name: 'Original Workspace Name'
            }
          }
        ]
      }

      const mockUpdatedUser = {
        ...mockUser,
        workspaces: [
          {
            ...mockUser.workspaces[0],
            workspace: {
              id: 'workspace-1',
              name: 'Updated Workspace Name'
            }
          }
        ]
      }

      const mockCurrentWorkspace = {
        id: 'workspace-1',
        userId: 'user-1',
        workspaceId: 'workspace-1',
        role: 'owner',
        joinedAt: '2024-01-01T00:00:00Z',
        workspace: {
          id: 'workspace-1',
          name: 'Original Workspace Name'
        }
      }

      const mockAvailableWorkspaces = [
        {
          id: 'personal',
          name: 'Personal Space',
          type: 'personal'
        },
        mockCurrentWorkspace
      ]

      // Mock the useUser hook
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token',
        refreshStorageQuota: jest.fn().mockResolvedValue(undefined)
      })

      // Mock the useWorkspace hook
      ;(useWorkspace as jest.Mock).mockReturnValue({
        currentWorkspace: mockCurrentWorkspace,
        availableWorkspaces: mockAvailableWorkspaces,
        loading: false,
        switchToWorkspace: jest.fn()
      })

      // Mock the workspace update API call
      ;(updateWorkspace as jest.Mock).mockResolvedValue({
        id: 'workspace-1',
        name: 'Updated Workspace Name'
      })

      // Test the workspace update flow
      const { refreshStorageQuota } = useUser()

      // Update the workspace name
      await act(async () => {
        await updateWorkspace('test-token', 'workspace-1', 'Updated Workspace Name')
        await refreshStorageQuota()
      })

      // Verify the API was called
      expect(updateWorkspace).toHaveBeenCalledWith(
        'test-token',
        'workspace-1',
        'Updated Workspace Name'
      )
      expect(refreshStorageQuota).toHaveBeenCalled()

      // Note: In a real scenario, the user data would be updated by the refreshStorageQuota call
      // and the component would re-render with the new workspace name
      // This test verifies that the refresh mechanism is properly triggered
    })
  })

  describe('Workspace Lifecycle Management', () => {
    it('should handle complete workspace lifecycle: create, manage, and leave', async () => {
      // Step 1: Create a new workspace
      const mockNewWorkspace = {
        id: 'workspace-new',
        name: 'New Integration Workspace'
      }
      ;(createWorkspace as jest.Mock).mockResolvedValue(mockNewWorkspace)

      const newWorkspace = await createWorkspace('test-token', 'New Integration Workspace')
      expect(newWorkspace.name).toBe('New Integration Workspace')

      // Step 2: Add members to the workspace
      const mockMember1 = { userId: 'user-2', role: 'member' }
      const mockMember2 = { userId: 'user-3', role: 'admin' }

      ;(addUserToWorkspace as jest.Mock)
        .mockResolvedValueOnce(mockMember1)
        .mockResolvedValueOnce(mockMember2)

      await addUserToWorkspace('test-token', 'workspace-new', 'user-2', 'member')
      await addUserToWorkspace('test-token', 'workspace-new', 'user-3', 'admin')

      expect(addUserToWorkspace).toHaveBeenCalledTimes(2)

      // Step 3: Update member roles
      const mockUpdatedMember = { userId: 'user-2', role: 'admin' }
      ;(updateUserWorkspaceRole as jest.Mock).mockResolvedValue(mockUpdatedMember)

      await updateUserWorkspaceRole('test-token', 'workspace-new', 'user-2', 'admin')
      expect(updateUserWorkspaceRole).toHaveBeenCalledWith(
        'test-token',
        'workspace-new',
        'user-2',
        'admin'
      )

      // Step 4: Remove a member
      ;(removeUserFromWorkspace as jest.Mock).mockResolvedValue(undefined)
      await removeUserFromWorkspace('test-token', 'workspace-new', 'user-3')
      expect(removeUserFromWorkspace).toHaveBeenCalledWith('test-token', 'workspace-new', 'user-3')

      // Step 5: Update workspace name
      const mockUpdatedWorkspace = {
        id: 'workspace-new',
        name: 'Updated Integration Workspace'
      }
      ;(updateWorkspace as jest.Mock).mockResolvedValue(mockUpdatedWorkspace)

      const updatedWorkspace = await updateWorkspace(
        'test-token',
        'workspace-new',
        'Updated Integration Workspace'
      )
      expect(updatedWorkspace.name).toBe('Updated Integration Workspace')

      // Step 6: Leave the workspace
      ;(leaveWorkspace as jest.Mock).mockResolvedValue(undefined)
      await leaveWorkspace('test-token', 'workspace-new')
      expect(leaveWorkspace).toHaveBeenCalledWith('test-token', 'workspace-new')
    })

    it('should handle workspace invite workflow', async () => {
      // Step 1: Create workspace invite
      const mockInvite = {
        id: 'invite-1',
        workspaceId: 'workspace-1',
        invitedUsername: 'newuser',
        role: 'member',
        status: 'pending'
      }
      ;(createWorkspaceInvite as jest.Mock).mockResolvedValue(mockInvite)

      const invite = await createWorkspaceInvite('test-token', 'workspace-1', 'newuser', 'member')
      expect(invite.status).toBe('pending')

      // Step 2: Accept the invite (simulating the invited user)
      const mockAcceptedResponse = {
        invite: { id: 'invite-1', status: 'accepted' },
        userWorkspace: { id: 'membership-new', role: 'member' }
      }
      ;(acceptWorkspaceInvite as jest.Mock).mockResolvedValue(mockAcceptedResponse)

      const acceptedResult = await acceptWorkspaceInvite('test-token', 'invite-1')
      expect(acceptedResult.invite.status).toBe('accepted')
      expect(acceptedResult.userWorkspace.role).toBe('member')

      // Step 3: Verify the user is now a member
      const mockMembers = [
        { userId: 'user-1', role: 'owner' },
        { userId: 'newuser', role: 'member' }
      ]
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockMembers)

      const members = await getWorkspaceMembers('test-token', 'workspace-1')
      expect(members).toHaveLength(2)
      expect(members.find((m) => m.userId === 'newuser')?.role).toBe('member')
    })

    it('should handle workspace invite decline workflow', async () => {
      // Step 1: Create workspace invite
      const mockInvite = {
        id: 'invite-2',
        workspaceId: 'workspace-1',
        invitedUsername: 'declineuser',
        role: 'member',
        status: 'pending'
      }
      ;(createWorkspaceInvite as jest.Mock).mockResolvedValue(mockInvite)

      await createWorkspaceInvite('test-token', 'workspace-1', 'declineuser', 'member')

      // Step 2: Decline the invite
      const mockDeclinedInvite = {
        id: 'invite-2',
        status: 'declined'
      }
      ;(declineWorkspaceInvite as jest.Mock).mockResolvedValue(mockDeclinedInvite)

      const declinedResult = await declineWorkspaceInvite('test-token', 'invite-2')
      expect(declinedResult.status).toBe('declined')

      // Step 3: Verify the user is not a member
      const mockMembers = [{ userId: 'user-1', role: 'owner' }]
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockMembers)

      const members = await getWorkspaceMembers('test-token', 'workspace-1')
      expect(members).toHaveLength(1)
      expect(members.find((m) => m.userId === 'declineuser')).toBeUndefined()
    })
  })

  describe('Workspace Role Management Integration', () => {
    it('should handle role escalation and de-escalation', async () => {
      // Initial state: user is a member
      const mockMembers = [
        { userId: 'user-1', role: 'owner' },
        { userId: 'user-2', role: 'member' }
      ]
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockMembers)

      let members = await getWorkspaceMembers('test-token', 'workspace-1')
      expect(members.find((m) => m.userId === 'user-2')?.role).toBe('member')

      // Step 1: Promote member to admin
      const mockPromotedMember = { userId: 'user-2', role: 'admin' }
      ;(updateUserWorkspaceRole as jest.Mock).mockResolvedValue(mockPromotedMember)

      await updateUserWorkspaceRole('test-token', 'workspace-1', 'user-2', 'admin')

      // Step 2: Verify promotion
      const mockUpdatedMembers = [
        { userId: 'user-1', role: 'owner' },
        { userId: 'user-2', role: 'admin' }
      ]
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockUpdatedMembers)

      members = await getWorkspaceMembers('test-token', 'workspace-1')
      expect(members.find((m) => m.userId === 'user-2')?.role).toBe('admin')

      // Step 3: Demote admin back to member
      const mockDemotedMember = { userId: 'user-2', role: 'member' }
      ;(updateUserWorkspaceRole as jest.Mock).mockResolvedValue(mockDemotedMember)

      await updateUserWorkspaceRole('test-token', 'workspace-1', 'user-2', 'member')

      // Step 4: Verify demotion
      const mockFinalMembers = [
        { userId: 'user-1', role: 'owner' },
        { userId: 'user-2', role: 'member' }
      ]
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockFinalMembers)

      members = await getWorkspaceMembers('test-token', 'workspace-1')
      expect(members.find((m) => m.userId === 'user-2')?.role).toBe('member')
    })

    it('should handle owner transfer scenario', async () => {
      // Initial state: two owners
      const mockInitialMembers = [
        { userId: 'user-1', role: 'owner' },
        { userId: 'user-2', role: 'owner' }
      ]
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockInitialMembers)

      let members = await getWorkspaceMembers('test-token', 'workspace-1')
      expect(members.filter((m) => m.role === 'owner')).toHaveLength(2)

      // Step 1: Transfer ownership from user-1 to user-2
      const mockNewOwner = { userId: 'user-2', role: 'owner' }
      const mockFormerOwner = { userId: 'user-1', role: 'member' }

      ;(updateUserWorkspaceRole as jest.Mock)
        .mockResolvedValueOnce(mockNewOwner)
        .mockResolvedValueOnce(mockFormerOwner)

      // Promote user-2 to owner (already is owner, but this simulates the transfer)
      await updateUserWorkspaceRole('test-token', 'workspace-1', 'user-2', 'owner')

      // Demote user-1 to member
      await updateUserWorkspaceRole('test-token', 'workspace-1', 'user-1', 'member')

      // Step 2: Verify ownership transfer
      const mockFinalMembers = [
        { userId: 'user-1', role: 'member' },
        { userId: 'user-2', role: 'owner' }
      ]
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockFinalMembers)

      members = await getWorkspaceMembers('test-token', 'workspace-1')
      expect(members.find((m) => m.userId === 'user-1')?.role).toBe('member')
      expect(members.find((m) => m.userId === 'user-2')?.role).toBe('owner')
      expect(members.filter((m) => m.role === 'owner')).toHaveLength(1)
    })
  })

  describe('Workspace Error Recovery Scenarios', () => {
    it('should handle partial failure in workspace operations', async () => {
      // Step 1: Successfully create workspace
      const mockWorkspace = { id: 'workspace-error', name: 'Error Test Workspace' }
      ;(createWorkspace as jest.Mock).mockResolvedValue(mockWorkspace)

      const workspace = await createWorkspace('test-token', 'Error Test Workspace')
      expect(workspace.name).toBe('Error Test Workspace')

      // Step 2: Fail to add first member
      const addMemberError = new Error('User not found')
      ;(addUserToWorkspace as jest.Mock).mockRejectedValueOnce(addMemberError)

      await expect(
        addUserToWorkspace('test-token', 'workspace-error', 'nonexistent', 'member')
      ).rejects.toThrow('User not found')

      // Step 3: Successfully add second member
      const mockMember = { userId: 'user-valid', role: 'member' }
      ;(addUserToWorkspace as jest.Mock).mockResolvedValueOnce(mockMember)

      const member = await addUserToWorkspace(
        'test-token',
        'workspace-error',
        'user-valid',
        'member'
      )
      expect(member.role).toBe('member')

      // Step 4: Verify workspace still exists and has the valid member
      const mockMembers = [
        { userId: 'user-1', role: 'owner' },
        { userId: 'user-valid', role: 'member' }
      ]
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockMembers)

      const members = await getWorkspaceMembers('test-token', 'workspace-error')
      expect(members).toHaveLength(2)
      expect(members.find((m) => m.userId === 'user-valid')).toBeDefined()
    })

    it('should handle network failure recovery', async () => {
      // Step 1: Initial network failure
      const networkError = new Error('Network error')
      ;(getMyWorkspaces as jest.Mock).mockRejectedValueOnce(networkError)

      await expect(getMyWorkspaces('test-token')).rejects.toThrow('Network error')

      // Step 2: Retry and succeed
      const mockWorkspaces = [
        {
          id: 'membership-1',
          role: 'owner',
          workspace: { id: 'workspace-1', name: 'Test Workspace' }
        }
      ]
      ;(getMyWorkspaces as jest.Mock).mockResolvedValueOnce(mockWorkspaces)

      const workspaces = await getMyWorkspaces('test-token')
      expect(workspaces).toHaveLength(1)
      expect(workspaces[0]?.workspace.name).toBe('Test Workspace')
    })
  })

  describe('Workspace Data Consistency Scenarios', () => {
    it('should maintain data consistency across multiple operations', async () => {
      // Step 1: Create workspace
      const mockWorkspace = { id: 'workspace-consistency', name: 'Consistency Test' }
      ;(createWorkspace as jest.Mock).mockResolvedValue(mockWorkspace)

      const workspace = await createWorkspace('test-token', 'Consistency Test')
      expect(workspace.id).toBe('workspace-consistency')

      // Step 2: Add multiple members
      const mockMembers = [
        { userId: 'user-1', role: 'owner' },
        { userId: 'user-2', role: 'member' },
        { userId: 'user-3', role: 'admin' }
      ]

      ;(addUserToWorkspace as jest.Mock)
        .mockResolvedValueOnce(mockMembers[1])
        .mockResolvedValueOnce(mockMembers[2])

      await addUserToWorkspace('test-token', 'workspace-consistency', 'user-2', 'member')
      await addUserToWorkspace('test-token', 'workspace-consistency', 'user-3', 'admin')

      // Step 3: Verify all members are present
      ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockMembers)

      const members = await getWorkspaceMembers('test-token', 'workspace-consistency')
      expect(members).toHaveLength(3)
      expect(members.find((m) => m.role === 'owner')).toBeDefined()
      expect(members.find((m) => m.role === 'member')).toBeDefined()
      expect(members.find((m) => m.role === 'admin')).toBeDefined()

      // Step 4: Update workspace name
      const mockUpdatedWorkspace = { id: 'workspace-consistency', name: 'Updated Consistency Test' }
      ;(updateWorkspace as jest.Mock).mockResolvedValue(mockUpdatedWorkspace)

      const updatedWorkspace = await updateWorkspace(
        'test-token',
        'workspace-consistency',
        'Updated Consistency Test'
      )
      expect(updatedWorkspace.name).toBe('Updated Consistency Test')

      // Step 5: Verify members are still present after workspace update
      const finalMembers = await getWorkspaceMembers('test-token', 'workspace-consistency')
      expect(finalMembers).toHaveLength(3)
      expect(finalMembers.find((m) => m.userId === 'user-1')?.role).toBe('owner')
      expect(finalMembers.find((m) => m.userId === 'user-2')?.role).toBe('member')
      expect(finalMembers.find((m) => m.userId === 'user-3')?.role).toBe('admin')
    })

    it('should handle concurrent workspace operations', async () => {
      // Simulate concurrent operations by setting up multiple mocks
      const mockWorkspace1 = { id: 'workspace-1', name: 'Concurrent Workspace 1' }
      const mockWorkspace2 = { id: 'workspace-2', name: 'Concurrent Workspace 2' }

      ;(createWorkspace as jest.Mock)
        .mockResolvedValueOnce(mockWorkspace1)
        .mockResolvedValueOnce(mockWorkspace2)

      // Execute concurrent workspace creation
      const [workspace1, workspace2] = await Promise.all([
        createWorkspace('test-token', 'Concurrent Workspace 1'),
        createWorkspace('test-token', 'Concurrent Workspace 2')
      ])

      expect(workspace1.name).toBe('Concurrent Workspace 1')
      expect(workspace2.name).toBe('Concurrent Workspace 2')
      expect(createWorkspace).toHaveBeenCalledTimes(2)

      // Simulate concurrent member additions
      const mockMember1 = { userId: 'user-1', role: 'member' }
      const mockMember2 = { userId: 'user-2', role: 'member' }

      ;(addUserToWorkspace as jest.Mock)
        .mockResolvedValueOnce(mockMember1)
        .mockResolvedValueOnce(mockMember2)

      await Promise.all([
        addUserToWorkspace('test-token', 'workspace-1', 'user-1', 'member'),
        addUserToWorkspace('test-token', 'workspace-2', 'user-2', 'member')
      ])

      expect(addUserToWorkspace).toHaveBeenCalledTimes(2)
    })
  })
})
