import { User } from '@repo/types'

export const API_URL = process.env.NEXT_PUBLIC_API_URL!

interface ApiResponse<T> {
  success: boolean
  data: T
  error: string | null
}

export async function getCurrentUser(accessToken: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json: ApiResponse<User> = await res.json()
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

export async function uploadEncryptedUserFile(
  file: Blob | Uint8Array,
  filename: string,
  accessToken: string
): Promise<any> {
  const formData = new FormData()
  formData.append('file', file instanceof Blob ? file : new Blob([file]), filename)
  const res = await fetch(`${API_URL}/api/files`, {
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

export async function downloadUserFolder(accessToken: string, path: string) {
  const url = new URL(`${API_URL}/api/files/download-folder`)
  if (path) url.searchParams.set('path', path)
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (!res.ok) throw new Error('Failed to download folder')
  const blob = await res.blob()
  const downloadUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = (path ? path.split('/').pop() : 'folder') + '.zip'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(downloadUrl)
  }, 100)
}

export async function moveUserFileToTrash(filename: string, accessToken: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/files/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to move file to trash')
  return json.data
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
