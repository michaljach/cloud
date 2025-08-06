import fs from 'fs'
import path from 'path'
import type { FileInfo, FolderOrFileInfo, TrashedFileInfo } from '@repo/types'

// Special workspace ID for personal space
const PERSONAL_WORKSPACE_ID = 'personal'

/**
 * Get the main storage directory path
 */
export function getStorageDir(): string {
  const storageDir = process.env.STORAGE_DIR || './storage'

  // Ensure main storage directory exists
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true })
  }

  return storageDir
}

/**
 * Get a user's specific storage directory for a given type (personal files)
 * Uses new structure: /storage/users/{userId}/{type}
 */
export function getUserPersonalStorageDir(userId: string, type: string): string {
  const userStorageDir = path.join(getStorageDir(), 'users')
  return path.join(userStorageDir, String(userId), type)
}

/**
 * Get a workspace's specific storage directory for a given type (workspace files)
 */
export function getWorkspaceSpecificStorageDir(workspaceId: string, type: string): string {
  const workspaceStorageDir = path.join(getStorageDir(), 'workspaces')
  const workspaceSpecificDir = path.join(workspaceStorageDir, workspaceId, type)

  return workspaceSpecificDir
}

/**
 * Get storage directory for a user and workspace context
 */
export function getStorageDirForContext(userId: string, workspaceId: string, type: string): string {
  if (workspaceId === PERSONAL_WORKSPACE_ID) {
    // Personal space - use user's personal directory
    return getUserPersonalStorageDir(userId, type)
  } else {
    // Workspace - use workspace directory
    return getWorkspaceSpecificStorageDir(workspaceId, type)
  }
}

/**
 * Ensure storage directory exists for a user and workspace context
 */
export function ensureStorageDirForContext(
  userId: string,
  workspaceId: string,
  type: string
): string {
  const storageDir = getStorageDirForContext(userId, workspaceId, type)

  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true })
  }
  return storageDir
}

/**
 * Check if storage directory exists for a user and workspace context
 */
export function storageDirExistsForContext(
  userId: string,
  workspaceId: string,
  type: string
): boolean {
  return fs.existsSync(getStorageDirForContext(userId, workspaceId, type))
}

/**
 * List all files in storage directory for a user and workspace context
 * Returns array of filenames only
 */
export function listFilesForContext(userId: string, workspaceId: string, type: string): string[] {
  const storageDir = getStorageDirForContext(userId, workspaceId, type)
  if (!fs.existsSync(storageDir)) {
    return []
  }

  return fs.readdirSync(storageDir).filter((f) => fs.statSync(path.join(storageDir, f)).isFile())
}

/**
 * List all files in storage directory for a user and workspace context with metadata
 * Returns array of FileInfo objects
 */
export function listFilesWithMetadataForContext(
  userId: string,
  workspaceId: string,
  type: string
): FileInfo[] {
  const storageDir = getStorageDirForContext(userId, workspaceId, type)
  if (!fs.existsSync(storageDir)) {
    return []
  }

  return fs
    .readdirSync(storageDir)
    .filter((f) => fs.statSync(path.join(storageDir, f)).isFile())
    .map((f) => {
      const stat = fs.statSync(path.join(storageDir, f))
      return {
        filename: f,
        size: stat.size,
        modified: stat.mtime
      }
    })
}

/**
 * List all files and folders in storage directory for a user and workspace context and subPath
 * Returns array of FolderOrFileInfo objects
 */
export function listFolderContentsWithMetadataForContext(
  userId: string,
  workspaceId: string,
  type: string,
  subPath: string = ''
): FolderOrFileInfo[] {
  const baseDir = getStorageDirForContext(userId, workspaceId, type)
  const targetDir = subPath ? path.join(baseDir, subPath) : baseDir
  if (!fs.existsSync(targetDir)) {
    return []
  }
  return fs.readdirSync(targetDir).map((entry) => {
    const entryPath = path.join(targetDir, entry)
    const stat = fs.statSync(entryPath)
    if (stat.isDirectory()) {
      return {
        name: entry,
        type: 'folder',
        size: 0,
        modified: stat.mtime
      }
    } else {
      return {
        name: entry,
        type: 'file',
        size: stat.size,
        modified: stat.mtime
      }
    }
  })
}

/**
 * Check if a file exists in storage directory for a user and workspace context
 */
export function fileExistsForContext(
  userId: string,
  workspaceId: string,
  type: string,
  filename: string
): boolean {
  const filePath = getFilePathForContext(userId, workspaceId, type, filename)
  return fs.existsSync(filePath)
}

/**
 * Get file path for a user and workspace context
 */
export function getFilePathForContext(
  userId: string,
  workspaceId: string,
  type: string,
  filename: string
): string {
  return path.join(getStorageDirForContext(userId, workspaceId, type), filename)
}

/**
 * Delete a file from storage directory for a user and workspace context
 */
export function deleteFileForContext(
  userId: string,
  workspaceId: string,
  type: string,
  filename: string
): boolean {
  const filePath = getFilePathForContext(userId, workspaceId, type, filename)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}

/**
 * Get file metadata for a user and workspace context
 */
export function getFileMetadataForContext(
  userId: string,
  workspaceId: string,
  type: string,
  filename: string
): FileInfo | null {
  const filePath = getFilePathForContext(userId, workspaceId, type, filename)
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath)
    return {
      filename,
      size: stat.size,
      modified: stat.mtime
    }
  }
  return null
}

/**
 * List trashed files for a user and workspace context
 */
export function listTrashedFilesForContext(
  userId: string,
  workspaceId: string,
  type: string
): TrashedFileInfo[] {
  const storageDir = getStorageDirForContext(userId, workspaceId, type)
  const trashDir = path.join(storageDir, '.trash')

  // Ensure the storage directory exists (even if empty)
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true })
  }

  if (!fs.existsSync(trashDir)) {
    fs.mkdirSync(trashDir, { recursive: true })
  }

  try {
    const files = fs.readdirSync(trashDir).map((f) => {
      const stat = fs.statSync(path.join(trashDir, f))
      return {
        filename: f,
        size: stat.size,
        modified: stat.mtime,
        type: stat.isDirectory() ? ('folder' as const) : ('file' as const)
      }
    })
    return files
  } catch (error) {
    return []
  }
}

/**
 * Restore a file from trash for a user and workspace context
 */
export function restoreFileFromTrashForContext(
  userId: string,
  workspaceId: string,
  type: string,
  filename: string
): boolean {
  const storageDir = getStorageDirForContext(userId, workspaceId, type)
  const trashDir = path.join(storageDir, '.trash')
  const trashFilePath = path.join(trashDir, filename)
  const restoreFilePath = path.join(storageDir, filename)

  if (fs.existsSync(trashFilePath)) {
    fs.renameSync(trashFilePath, restoreFilePath)
    return true
  }
  return false
}

/**
 * Delete a file from trash for a user and workspace context
 */
export function deleteFileFromTrashForContext(
  userId: string,
  workspaceId: string,
  type: string,
  filename: string
): boolean {
  const storageDir = getStorageDirForContext(userId, workspaceId, type)
  const trashDir = path.join(storageDir, '.trash')
  const trashFilePath = path.join(trashDir, filename)

  if (fs.existsSync(trashFilePath)) {
    fs.unlinkSync(trashFilePath)
    return true
  }
  return false
}

/**
 * Calculate storage usage for a user and workspace context
 */
export function calculateStorageUsageForContext(userId: string, workspaceId: string): number {
  const types = ['files', 'notes', 'photos']
  let totalUsage = 0

  for (const type of types) {
    totalUsage += calculateStorageUsageByTypeForContext(userId, workspaceId, type)
  }

  return totalUsage
}

/**
 * Calculate storage usage for a specific type in a workspace context
 */
export function calculateStorageUsageByTypeForContext(
  userId: string,
  workspaceId: string,
  type: string
): number {
  const storageDir = getStorageDirForContext(userId, workspaceId, type)

  if (!fs.existsSync(storageDir)) {
    return 0
  }

  function calculateDirSize(dirPath: string): number {
    let totalSize = 0
    const items = fs.readdirSync(dirPath)

    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const stat = fs.statSync(itemPath)

      if (stat.isDirectory()) {
        totalSize += calculateDirSize(itemPath)
      } else {
        totalSize += stat.size
      }
    }

    return totalSize
  }

  return calculateDirSize(storageDir)
}

/**
 * Get all workspace storage directories
 */
export function getAllWorkspaceStorageDirs(): string[] {
  const workspaceStorageDir = path.join(getStorageDir(), 'workspaces')
  if (!fs.existsSync(workspaceStorageDir)) {
    return []
  }

  return fs
    .readdirSync(workspaceStorageDir)
    .filter((item) => {
      const itemPath = path.join(workspaceStorageDir, item)
      return fs.statSync(itemPath).isDirectory()
    })
    .map((item) => path.join(workspaceStorageDir, item))
}

/**
 * Get all user storage directories
 */
export function getAllUserStorageDirs(): string[] {
  const userStorageDir = path.join(getStorageDir(), 'users')
  if (!fs.existsSync(userStorageDir)) {
    return []
  }

  return fs
    .readdirSync(userStorageDir)
    .filter((item) => {
      const itemPath = path.join(userStorageDir, item)
      return fs.statSync(itemPath).isDirectory()
    })
    .map((item) => path.join(userStorageDir, item))
}

/**
 * Clean up empty directories
 */
export function cleanupEmptyDirectories(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    return
  }

  const items = fs.readdirSync(dirPath)

  for (const item of items) {
    const itemPath = path.join(dirPath, item)
    const stat = fs.statSync(itemPath)

    if (stat.isDirectory()) {
      cleanupEmptyDirectories(itemPath)

      // Check if directory is now empty after cleanup
      const remainingItems = fs.readdirSync(itemPath)
      if (remainingItems.length === 0) {
        fs.rmdirSync(itemPath)
      }
    }
  }
}

/**
 * Search for files by name across the user's storage directory
 * Returns array of search results with full paths
 */
export function searchFilesForContext(
  userId: string,
  workspaceId: string,
  type: string,
  query: string
): Array<{ name: string; path: string; size?: number; modified: Date; type: 'file' | 'folder' }> {
  const storageDir = getStorageDirForContext(userId, workspaceId, type)
  if (!fs.existsSync(storageDir)) {
    return []
  }

  const results: Array<{
    name: string
    path: string
    size?: number
    modified: Date
    type: 'file' | 'folder'
  }> = []
  const searchQuery = query.toLowerCase().trim()

  if (!searchQuery) {
    return []
  }

  function searchDirectory(dirPath: string, relativePath: string = '') {
    if (!fs.existsSync(dirPath)) {
      return
    }

    const items = fs.readdirSync(dirPath)

    for (const item of items) {
      // Skip .trash directory
      if (item === '.trash') {
        continue
      }

      const itemPath = path.join(dirPath, item)
      const stat = fs.statSync(itemPath)
      const currentRelativePath = relativePath ? `${relativePath}/${item}` : item

      // Check if the item name matches the search query
      if (item.toLowerCase().includes(searchQuery)) {
        results.push({
          name: item,
          path: currentRelativePath,
          size: stat.isFile() ? stat.size : undefined,
          modified: stat.mtime,
          type: stat.isDirectory() ? 'folder' : 'file'
        })
      }

      // If it's a directory, recursively search inside it
      if (stat.isDirectory()) {
        searchDirectory(itemPath, currentRelativePath)
      }
    }
  }

  searchDirectory(storageDir)

  // Sort results: folders first, then by name
  return results.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
}

/**
 * Batch move files to trash for a user and workspace context
 */
export function batchMoveFilesToTrashForContext(
  userId: string,
  workspaceId: string,
  type: string,
  filenames: string[]
): { filename: string; success: boolean; error: string | null }[] {
  const results = []
  const storageDir = getStorageDirForContext(userId, workspaceId, type)
  const trashDir = path.join(storageDir, '.trash')

  // Ensure trash directory exists
  if (!fs.existsSync(trashDir)) {
    fs.mkdirSync(trashDir, { recursive: true })
  }

  for (const filename of filenames) {
    if (!filename) {
      results.push({ filename, success: false, error: 'Filename required' })
      continue
    }

    const filePath = path.join(storageDir, filename)
    const trashPath = path.join(trashDir, filename)

    if (fs.existsSync(filePath)) {
      try {
        fs.renameSync(filePath, trashPath)
        results.push({ filename, success: true, error: null })
      } catch (err: any) {
        results.push({ filename, success: false, error: err.message })
      }
    } else {
      results.push({ filename, success: false, error: 'File or folder not found' })
    }
  }

  return results
}
