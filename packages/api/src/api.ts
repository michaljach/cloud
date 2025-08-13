import type {
  User,
  Workspace,
  WorkspaceInvite,
  WorkspaceMembership,
  WorkspaceMember,
  PlatformSettings,
  ApiResponse
} from '@repo/types'
import { apiClient } from './apiClient'

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
  return apiClient.get('/api/auth/me', accessToken)
}

export async function registerUser(username: string, password: string): Promise<User> {
  return apiClient.post('/api/auth/register', { username, password })
}

export async function loginUser(
  username: string,
  password: string
): Promise<{
  accessToken: string
  accessTokenExpiresAt?: string
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

export async function logoutUser(token: string): Promise<void> {
  return apiClient.post('/api/auth/logout', { token })
}

export async function updateCurrentUser(accessToken: string, fullName: string): Promise<User> {
  return apiClient.patch('/api/auth/me', { fullName }, accessToken)
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
  const endpoint = path ? `/api/files?path=${encodeURIComponent(path)}` : '/api/files'
  return apiClient.get(endpoint, accessToken)
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
  const response = await fetch(`${API_URL}/api/files/${encodeURIComponent(filename)}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!response.ok) throw new Error('Download failed')
  return new Uint8Array(await response.arrayBuffer())
}

export async function listUserTrashedFiles(
  accessToken: string
): Promise<{ filename: string; size: number; modified: string }[]> {
  return apiClient.get('/api/files?path=.trash', accessToken)
}

export async function restoreUserFileFromTrash(
  filename: string,
  accessToken: string
): Promise<any> {
  return apiClient.post('/api/files/trash/restore', { filename }, accessToken)
}

export async function deleteUserFileFromTrash(filename: string, accessToken: string): Promise<any> {
  return apiClient.delete(`/api/files/trash/${encodeURIComponent(filename)}`, accessToken)
}

export async function batchMoveUserFilesToTrash(
  filenames: string[],
  accessToken: string
): Promise<any[]> {
  return apiClient.post('/api/files/batch/trash', { filenames }, accessToken)
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
  return apiClient.get('/api/workspaces', accessToken)
}

/**
 * Create a new workspace (root_admin only)
 */
export async function createWorkspace(accessToken: string, name: string): Promise<Workspace> {
  return apiClient.post('/api/workspaces', { name }, accessToken)
}

/**
 * Update a workspace (admin/root_admin only)
 */
export async function updateWorkspace(
  accessToken: string,
  workspaceId: string,
  name: string
): Promise<Workspace> {
  return apiClient.patch(`/api/workspaces/${workspaceId}`, { name }, accessToken)
}

// Workspace Invite API functions
export async function getMyInvites(accessToken: string): Promise<WorkspaceInvite[]> {
  return apiClient.get('/api/workspace-invites/my', accessToken)
}

export async function getWorkspaceInvites(
  accessToken: string,
  workspaceId: string
): Promise<WorkspaceInvite[]> {
  return apiClient.get(`/api/workspace-invites/workspace/${workspaceId}`, accessToken)
}

export async function createWorkspaceInvite(
  accessToken: string,
  workspaceId: string,
  invitedUsername: string,
  role: 'owner' | 'admin' | 'member' = 'member'
): Promise<WorkspaceInvite> {
  return apiClient.post(
    '/api/workspace-invites',
    { workspaceId, invitedUsername, role },
    accessToken
  )
}

export async function acceptWorkspaceInvite(
  accessToken: string,
  inviteId: string
): Promise<{ invite: WorkspaceInvite; userWorkspace: any }> {
  return apiClient.patch(`/api/workspace-invites/${inviteId}/accept`, undefined, accessToken)
}

export async function declineWorkspaceInvite(
  accessToken: string,
  inviteId: string
): Promise<WorkspaceInvite> {
  return apiClient.patch(`/api/workspace-invites/${inviteId}/decline`, undefined, accessToken)
}

export async function cancelWorkspaceInvite(
  accessToken: string,
  inviteId: string
): Promise<WorkspaceInvite> {
  return apiClient.delete(`/api/workspace-invites/${inviteId}`, accessToken)
}

export async function leaveWorkspace(accessToken: string, workspaceId: string): Promise<void> {
  return apiClient.delete(`/api/workspaces/${workspaceId}/leave`, accessToken)
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
  return apiClient.get(`/api/workspaces/${workspaceId}/members`, accessToken)
}

export async function addUserToWorkspace(
  accessToken: string,
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member' = 'member'
): Promise<any> {
  return apiClient.post(`/api/workspaces/${workspaceId}/members`, { userId, role }, accessToken)
}

export async function updateUserWorkspaceRole(
  accessToken: string,
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member'
): Promise<any> {
  return apiClient.patch(`/api/workspaces/${workspaceId}/members/${userId}`, { role }, accessToken)
}

export async function removeUserFromWorkspace(
  accessToken: string,
  workspaceId: string,
  userId: string
): Promise<void> {
  return apiClient.delete(`/api/workspaces/${workspaceId}/members/${userId}`, accessToken)
}

// Unified function that works for both personal and workspace files
export async function listFiles(
  accessToken: string,
  path?: string,
  workspaceId?: string
): Promise<{ name: string; size?: number; modified: string; type: 'file' | 'folder' }[]> {
  const params = new URLSearchParams()
  if (workspaceId) {
    params.set('workspaceId', workspaceId)
  }
  if (path) {
    params.set('path', path)
  }
  const endpoint = `/api/files${params.toString() ? `?${params.toString()}` : ''}`
  return apiClient.get(endpoint, accessToken)
}

export async function searchFiles(
  accessToken: string,
  query: string,
  workspaceId?: string
): Promise<
  { name: string; path: string; size?: number; modified: string; type: 'file' | 'folder' }[]
> {
  const params = new URLSearchParams()
  params.set('q', query)
  if (workspaceId) {
    params.set('workspaceId', workspaceId)
  }
  const endpoint = `/api/files/search?${params.toString()}`
  return apiClient.get(endpoint, accessToken)
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
  const endpoint = workspaceId ? `/api/files/trash?workspaceId=${workspaceId}` : '/api/files/trash'
  return apiClient.get(endpoint, accessToken)
}

export async function restoreFileFromTrash(
  filename: string,
  accessToken: string,
  workspaceId?: string
): Promise<any> {
  const endpoint = workspaceId
    ? `/api/files/trash/restore?workspaceId=${workspaceId}`
    : '/api/files/trash/restore'
  return apiClient.post(endpoint, { filename }, accessToken)
}

export async function deleteFileFromTrash(
  filename: string,
  accessToken: string,
  workspaceId?: string
): Promise<any> {
  const endpoint = workspaceId
    ? `/api/files/trash/${encodeURIComponent(filename)}?workspaceId=${workspaceId}`
    : `/api/files/trash/${encodeURIComponent(filename)}`
  return apiClient.delete(endpoint, accessToken)
}

export async function batchMoveFilesToTrash(
  filenames: string[],
  accessToken: string,
  workspaceId?: string
): Promise<any[]> {
  const endpoint = workspaceId
    ? `/api/files/batch/trash?workspaceId=${workspaceId}`
    : '/api/files/batch/trash'
  return apiClient.post(endpoint, { filenames }, accessToken)
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

  const endpoint = workspaceId ? `/api/files/batch?workspaceId=${workspaceId}` : '/api/files/batch'
  return apiClient.upload(endpoint, formData, accessToken)
}

// Unified note functions
export async function listNotes(accessToken: string, workspaceId?: string): Promise<string[]> {
  const endpoint = `/api/notes${workspaceId ? `?workspaceId=${workspaceId}` : ''}`
  return await apiClient.get<string[]>(endpoint, accessToken)
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

export async function renameNote(
  oldFilename: string,
  newFilename: string,
  accessToken: string,
  workspaceId?: string
): Promise<{ filename: string }> {
  const url = new URL(`${API_URL}/api/notes/${encodeURIComponent(oldFilename)}/rename`)
  if (workspaceId) {
    url.searchParams.set('workspaceId', workspaceId)
  }

  const res = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ newFilename })
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Rename failed')
  return json.data
}

export async function deleteNote(
  filename: string,
  accessToken: string,
  workspaceId?: string
): Promise<{ filename: string }> {
  const url = new URL(`${API_URL}/api/notes/${encodeURIComponent(filename)}`)
  if (workspaceId) {
    url.searchParams.set('workspaceId', workspaceId)
  }

  const res = await fetch(url.toString(), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Delete failed')
  return json.data
}

// Admin Settings API functions (root admin only)

/**
 * Get platform settings (root admin only)
 */
export async function getPlatformSettings(accessToken: string): Promise<PlatformSettings> {
  return apiClient.get('/api/admin/settings', accessToken)
}

/**
 * Update platform settings (root admin only)
 */
export async function updatePlatformSettings(
  accessToken: string,
  settings: {
    title: string
    timezone: string
    maintenanceMode: boolean
    registrationEnabled: boolean
    defaultStorageLimit: number
    maxFileSize: number
    supportEmail: string
    companyName: string
  }
): Promise<PlatformSettings> {
  return apiClient.put('/api/admin/settings', settings, accessToken)
}
