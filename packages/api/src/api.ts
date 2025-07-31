import type {
  User,
  Workspace,
  WorkspaceInvite,
  WorkspaceMembership,
  WorkspaceMember,
  ApiResponse
} from '@repo/types'

export const API_URL = process.env.NEXT_PUBLIC_API_URL!

export async function getCurrentUser(accessToken: string): Promise<{
  user: User
  storageQuota: {
    totalUsage: { bytes: number; megabytes: number }
    breakdown: {
      files: { bytes: number; megabytes: number }
      notes: { bytes: number; megabytes: number }
      photos: { bytes: number; megabytes: number }
    }
  }
}> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json: ApiResponse<{
    user: User
    storageQuota: {
      totalUsage: { bytes: number; megabytes: number }
      breakdown: {
        files: { bytes: number; megabytes: number }
        notes: { bytes: number; megabytes: number }
        photos: { bytes: number; megabytes: number }
      }
    }
  }> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to fetch user info')
  return json.data
}

export async function registerUser(username: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const json: ApiResponse<User> = await res.json()
  if (!json.success) throw new Error(json.error || 'Registration failed')
  return json.data
}

export async function loginUser(
  username: string,
  password: string
): Promise<{
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt?: string
  refreshTokenExpiresAt?: string
}> {
  const res = await fetch(`${API_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', username, password })
  })
  const json: ApiResponse<any> = await res.json()
  if (!json.success) throw new Error(json.error || 'Login failed')
  return json.data
}

export async function refreshToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt?: string
  refreshTokenExpiresAt?: string
}> {
  const res = await fetch(`${API_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
  })
  const json: ApiResponse<any> = await res.json()
  if (!json.success) throw new Error(json.error || 'Refresh failed')
  return json.data
}

export async function logoutUser(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error || 'Logout failed')
}

export async function updateCurrentUser(accessToken: string, fullName: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ fullName })
  })
  const json: ApiResponse<User> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to update user')
  return json.data
}

export async function uploadEncryptedFile(
  file: Blob | Uint8Array,
  filename: string,
  accessToken: string
): Promise<any> {
  const formData = new FormData()
  formData.append('file', file instanceof Blob ? file : new Blob([file]), filename)
  const res = await fetch(`${API_URL}/api/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: formData
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Upload failed')
  return json.data
}

export async function uploadEncryptedNote(
  file: Blob | Uint8Array,
  filename: string,
  accessToken: string
): Promise<any> {
  const formData = new FormData()
  formData.append('file', file instanceof Blob ? file : new Blob([file]), filename)
  const res = await fetch(`${API_URL}/api/notes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: formData
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Upload failed')
  return json.data
}

export async function uploadEncryptedPhoto(
  file: Blob | Uint8Array,
  filename: string,
  accessToken: string
): Promise<any> {
  const formData = new FormData()
  formData.append('file', file instanceof Blob ? file : new Blob([file]), filename)
  const res = await fetch(`${API_URL}/api/photos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: formData
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Upload failed')
  return json.data
}

export async function uploadEncryptedUserFilesBatch(
  files: Array<{ file: Blob | Uint8Array; filename: string }>,
  accessToken: string
): Promise<any[]> {
  const formData = new FormData()
  for (const { file, filename } of files) {
    formData.append('files', file instanceof Blob ? file : new Blob([file]), filename)
  }
  const res = await fetch(`${API_URL}/api/files/batch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: formData
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Batch upload failed')
  return json.data
}

export async function listUserNotes(accessToken: string): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/notes`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json: ApiResponse<string[]> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to list notes')
  return json.data
}

export async function listUserFiles(
  accessToken: string,
  path?: string
): Promise<{ name: string; size?: number; modified: string; type: 'file' | 'folder' }[]> {
  const url = new URL(`${API_URL}/api/files`)
  if (path) url.searchParams.set('path', path)
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to list files')
  return json.data
}

export async function downloadEncryptedNote(
  filename: string,
  accessToken: string
): Promise<Uint8Array> {
  const res = await fetch(`${API_URL}/api/notes/${encodeURIComponent(filename)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok) throw new Error('Download failed')
  return new Uint8Array(await res.arrayBuffer())
}

export async function downloadEncryptedPhoto(
  filename: string,
  accessToken: string
): Promise<Uint8Array> {
  const res = await fetch(`${API_URL}/api/photos/${encodeURIComponent(filename)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok) throw new Error('Download failed')
  return new Uint8Array(await res.arrayBuffer())
}

export async function downloadEncryptedUserFile(
  filename: string,
  accessToken: string
): Promise<Uint8Array> {
  const res = await fetch(`${API_URL}/api/files/${encodeURIComponent(filename)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok) throw new Error('Download failed')
  return new Uint8Array(await res.arrayBuffer())
}

export async function listUserTrashedFiles(
  accessToken: string
): Promise<{ filename: string; size: number; modified: string }[]> {
  const res = await fetch(`${API_URL}/api/files?path=.trash`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to list trashed files')
  return json.data
}

export async function restoreUserFileFromTrash(
  filename: string,
  accessToken: string
): Promise<any> {
  const res = await fetch(`${API_URL}/api/files/trash/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ filename })
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to restore file from trash')
  return json.data
}

export async function deleteUserFileFromTrash(filename: string, accessToken: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/files/trash/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to permanently delete file from trash')
  return json.data
}

export async function batchMoveUserFilesToTrash(
  filenames: string[],
  accessToken: string
): Promise<any[]> {
  const res = await fetch(`${API_URL}/api/files/batch/trash`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ filenames })
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Batch delete failed')
  return json.data
}

/**
 * Fetch all users (admin/root_admin only)
 */
export async function getUsers(accessToken: string): Promise<User[]> {
  const res = await fetch(`${API_URL}/api/users`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json: ApiResponse<User[]> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to fetch users')
  return json.data
}

/**
 * Get storage limit for a user (admin/root_admin only)
 */
export async function getUserStorageLimit(
  accessToken: string,
  userId: string
): Promise<{
  userId: string
  storageLimit: number
  storageLimitMB: number
}> {
  const res = await fetch(`${API_URL}/api/users/${userId}/storage-limit`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json: ApiResponse<{
    userId: string
    storageLimit: number
    storageLimitMB: number
  }> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to get storage limit')
  return json.data
}

/**
 * Update storage limit for a user (admin/root_admin only)
 */
export async function updateUserStorageLimit(
  accessToken: string,
  userId: string,
  storageLimitMB: number
): Promise<{
  user: User
  storageLimit: number
  storageLimitMB: number
}> {
  const res = await fetch(`${API_URL}/api/users/${userId}/storage-limit`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ storageLimitMB })
  })
  const json: ApiResponse<{
    user: User
    storageLimit: number
    storageLimitMB: number
  }> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to update storage limit')
  return json.data
}

/**
 * Create a new user (root_admin only)
 */
export async function createUser(
  accessToken: string,
  data: {
    username: string
    password: string
    fullName?: string
    storageLimitMB?: number
  }
): Promise<{ user: User }> {
  const res = await fetch(`${API_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(data)
  })
  const json: ApiResponse<{ user: User }> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to create user')
  return json.data
}

/**
 * Update user properties (admin/root_admin only)
 */
export async function updateUser(
  accessToken: string,
  userId: string,
  data: { fullName?: string; storageLimitMB?: number }
): Promise<{ user: User }> {
  const res = await fetch(`${API_URL}/api/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(data)
  })
  const json: ApiResponse<{ user: User }> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to update user')
  return json.data
}

/**
 * Reset a user's password (root_admin only)
 */
export async function resetUserPassword(
  accessToken: string,
  userId: string,
  newPassword: string
): Promise<{ user: User }> {
  const res = await fetch(`${API_URL}/api/users/${userId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ password: newPassword })
  })
  const json: ApiResponse<{ user: User }> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to reset user password')
  return json.data
}

/**
 * Change current user's password
 */
export async function changePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string
): Promise<{ user: User }> {
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  })
  const json: ApiResponse<{ user: User }> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to change password')
  return json.data
}

/**
 * List all workspaces (root_admin only)
 */
export async function getWorkspaces(accessToken: string): Promise<Workspace[]> {
  const res = await fetch(`${API_URL}/api/workspaces`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json: ApiResponse<Workspace[]> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to fetch workspaces')
  return json.data
}

/**
 * Create a new workspace (root_admin only)
 */
export async function createWorkspace(accessToken: string, name: string): Promise<Workspace> {
  const res = await fetch(`${API_URL}/api/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ name })
  })
  const json: ApiResponse<Workspace> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to create workspace')
  return json.data
}

/**
 * Update a workspace (admin/root_admin only)
 */
export async function updateWorkspace(
  accessToken: string,
  workspaceId: string,
  name: string
): Promise<Workspace> {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ name })
  })
  const json: ApiResponse<Workspace> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to update workspace')
  return json.data
}

// Workspace Invite API functions
export async function getMyInvites(accessToken: string): Promise<WorkspaceInvite[]> {
  const res = await fetch(`${API_URL}/api/workspace-invites/my`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  const json: ApiResponse<WorkspaceInvite[]> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to get invitations')
  return json.data
}

export async function getWorkspaceInvites(
  accessToken: string,
  workspaceId: string
): Promise<WorkspaceInvite[]> {
  const res = await fetch(`${API_URL}/api/workspace-invites/workspace/${workspaceId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  const json: ApiResponse<WorkspaceInvite[]> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to get workspace invitations')
  return json.data
}

export async function createWorkspaceInvite(
  accessToken: string,
  workspaceId: string,
  invitedUsername: string,
  role: 'owner' | 'admin' | 'member' = 'member'
): Promise<WorkspaceInvite> {
  const res = await fetch(`${API_URL}/api/workspace-invites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ workspaceId, invitedUsername, role })
  })
  const json: ApiResponse<WorkspaceInvite> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to create invitation')
  return json.data
}

export async function acceptWorkspaceInvite(
  accessToken: string,
  inviteId: string
): Promise<{ invite: WorkspaceInvite; userWorkspace: any }> {
  const res = await fetch(`${API_URL}/api/workspace-invites/${inviteId}/accept`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  const json: ApiResponse<{ invite: WorkspaceInvite; userWorkspace: any }> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to accept invitation')
  return json.data
}

export async function declineWorkspaceInvite(
  accessToken: string,
  inviteId: string
): Promise<WorkspaceInvite> {
  const res = await fetch(`${API_URL}/api/workspace-invites/${inviteId}/decline`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  const json: ApiResponse<WorkspaceInvite> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to decline invitation')
  return json.data
}

export async function cancelWorkspaceInvite(
  accessToken: string,
  inviteId: string
): Promise<WorkspaceInvite> {
  const res = await fetch(`${API_URL}/api/workspace-invites/${inviteId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  const json: ApiResponse<WorkspaceInvite> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to cancel invitation')
  return json.data
}

export async function leaveWorkspace(accessToken: string, workspaceId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/leave`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to leave workspace')
}

export async function getMyWorkspaces(accessToken: string): Promise<WorkspaceMembership[]> {
  // Get user data from /me endpoint which includes workspaces
  const userData = await getCurrentUser(accessToken)
  const userWorkspaces = userData.user.workspaces || []

  // Convert UserWorkspace to WorkspaceMembership format
  return userWorkspaces.map((uw) => ({
    id: uw.id,
    userId: uw.userId,
    workspaceId: uw.workspaceId,
    role: uw.role,
    joinedAt: uw.joinedAt instanceof Date ? uw.joinedAt.toISOString() : uw.joinedAt,
    workspace: uw.workspace
  }))
}

export async function getWorkspaceMembers(
  accessToken: string,
  workspaceId: string
): Promise<WorkspaceMember[]> {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json: ApiResponse<WorkspaceMember[]> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to fetch workspace members')
  return json.data
}

export async function addUserToWorkspace(
  accessToken: string,
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member' = 'member'
): Promise<any> {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ userId, role })
  })
  const json: ApiResponse<any> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to add user to workspace')
  return json.data
}

export async function updateUserWorkspaceRole(
  accessToken: string,
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member'
): Promise<any> {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ role })
  })
  const json: ApiResponse<any> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to update user role')
  return json.data
}

export async function removeUserFromWorkspace(
  accessToken: string,
  workspaceId: string,
  userId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to remove user from workspace')
}

// Unified function that works for both personal and workspace files
export async function listFiles(
  accessToken: string,
  path?: string,
  workspaceId?: string
): Promise<{ name: string; size?: number; modified: string; type: 'file' | 'folder' }[]> {
  const url = new URL(`${API_URL}/api/files`)
  if (workspaceId) {
    url.searchParams.set('workspaceId', workspaceId)
  }
  if (path) {
    url.searchParams.set('path', path)
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to list files')
  return json.data
}

export async function downloadFile(
  filename: string,
  accessToken: string,
  workspaceId?: string
): Promise<Uint8Array> {
  const url = new URL(`${API_URL}/api/files/${encodeURIComponent(filename)}`)
  if (workspaceId) {
    url.searchParams.set('workspaceId', workspaceId)
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok) throw new Error('Download failed')
  return new Uint8Array(await res.arrayBuffer())
}

export async function listTrashedFiles(
  accessToken: string,
  workspaceId?: string
): Promise<{ filename: string; size: number; modified: string }[]> {
  const url = new URL(`${API_URL}/api/files/trash`)
  if (workspaceId) {
    url.searchParams.set('workspaceId', workspaceId)
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to list trashed files')
  return json.data
}

export async function restoreFileFromTrash(
  filename: string,
  accessToken: string,
  workspaceId?: string
): Promise<any> {
  const url = new URL(`${API_URL}/api/files/trash/restore`)
  if (workspaceId) {
    url.searchParams.set('workspaceId', workspaceId)
  }
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ filename })
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to restore file from trash')
  return json.data
}

export async function deleteFileFromTrash(
  filename: string,
  accessToken: string,
  workspaceId?: string
): Promise<any> {
  const url = new URL(`${API_URL}/api/files/trash/${encodeURIComponent(filename)}`)
  if (workspaceId) {
    url.searchParams.set('workspaceId', workspaceId)
  }
  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to permanently delete file from trash')
  return json.data
}

export async function batchMoveFilesToTrash(
  filenames: string[],
  accessToken: string,
  workspaceId?: string
): Promise<any[]> {
  const url = new URL(`${API_URL}/api/files/batch/trash`)
  if (workspaceId) {
    url.searchParams.set('workspaceId', workspaceId)
  }
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ filenames })
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to move files to trash')
  return json.data
}

export async function uploadFilesBatch(
  files: Array<{ file: Blob | Uint8Array; filename: string }>,
  accessToken: string,
  workspaceId?: string
): Promise<any[]> {
  const formData = new FormData()

  for (const { file, filename } of files) {
    const blob = file instanceof Blob ? file : new Blob([file])
    formData.append('files', blob, filename)
  }

  const url = new URL(`${API_URL}/api/files/batch`)
  if (workspaceId) {
    url.searchParams.set('workspaceId', workspaceId)
  }

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Upload failed')
  return json.data
}

// Unified note functions
export async function listNotes(accessToken: string, workspaceId?: string): Promise<string[]> {
  const url = new URL(`${API_URL}/api/notes`)
  if (workspaceId) {
    url.searchParams.set('workspaceId', workspaceId)
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json: ApiResponse<string[]> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to list notes')
  return json.data
}

export async function downloadNote(
  filename: string,
  accessToken: string,
  workspaceId?: string
): Promise<Uint8Array> {
  const url = new URL(`${API_URL}/api/notes/${encodeURIComponent(filename)}`)
  if (workspaceId) {
    url.searchParams.set('workspaceId', workspaceId)
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok) throw new Error('Download failed')
  return new Uint8Array(await res.arrayBuffer())
}

export async function uploadNote(
  file: Blob | Uint8Array,
  filename: string,
  accessToken: string,
  workspaceId?: string
): Promise<any> {
  const formData = new FormData()
  const blob = file instanceof Blob ? file : new Blob([file])
  formData.append('note', blob, filename)

  const url = new URL(`${API_URL}/api/notes`)
  if (workspaceId) {
    url.searchParams.set('workspaceId', workspaceId)
  }

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Upload failed')
  return json.data
}

export async function createEmptyNote(
  accessToken: string,
  workspaceId?: string
): Promise<{ filename: string }> {
  // Generate a unique filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const filename = `note-${timestamp}.md`

  // Create empty content
  const emptyContent = new TextEncoder().encode('')

  // Upload the empty note
  const result = await uploadNote(emptyContent, filename, accessToken, workspaceId)

  return { filename }
}
