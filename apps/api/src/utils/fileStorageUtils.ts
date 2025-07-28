import fs from 'fs'
import path from 'path'
import type { FileInfo, FolderOrFileInfo, TrashedFileInfo } from '@repo/types'

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
 * Get a user's specific storage directory for a given type
 */
export function getUserStorageDir(userId: string, type: string): string {
  return path.join(getStorageDir(), String(userId), type)
}

/**
 * Ensure a user's storage directory exists for a given type
 */
export function ensureUserStorageDir(userId: string, type: string): string {
  const userDir = getUserStorageDir(userId, type)
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true })
  }
  return userDir
}

/**
 * Check if a user's storage directory exists for a given type
 */
export function userStorageDirExists(userId: string, type: string): boolean {
  return fs.existsSync(getUserStorageDir(userId, type))
}

/**
 * List all files in a user's storage directory for a given type
 * Returns array of filenames only
 */
export function listUserFiles(userId: string, type: string): string[] {
  const userDir = getUserStorageDir(userId, type)
  if (!fs.existsSync(userDir)) {
    return []
  }

  return fs.readdirSync(userDir).filter((f) => fs.statSync(path.join(userDir, f)).isFile())
}

/**
 * List all files in a user's storage directory for a given type with metadata
 * Returns array of FileInfo objects
 */
export function listUserFilesWithMetadata(userId: string, type: string): FileInfo[] {
  const userDir = getUserStorageDir(userId, type)
  if (!fs.existsSync(userDir)) {
    return []
  }

  return fs
    .readdirSync(userDir)
    .filter((f) => fs.statSync(path.join(userDir, f)).isFile())
    .map((f) => {
      const stat = fs.statSync(path.join(userDir, f))
      return {
        filename: f,
        size: stat.size,
        modified: stat.mtime
      }
    })
}

/**
 * List all files and folders in a user's storage directory for a given type and subPath
 * Returns array of FolderOrFileInfo objects
 */
export function listUserFolderContentsWithMetadata(
  userId: string,
  type: string,
  subPath: string = ''
): FolderOrFileInfo[] {
  const baseDir = getUserStorageDir(userId, type)
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
 * Check if a specific file exists in a user's storage directory
 */
export function userFileExists(userId: string, type: string, filename: string): boolean {
  const userDir = getUserStorageDir(userId, type)
  const filePath = path.join(userDir, filename)
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile()
}

/**
 * Get the full path to a file in a user's storage directory
 */
export function getUserFilePath(userId: string, type: string, filename: string): string {
  return path.join(getUserStorageDir(userId, type), filename)
}

/**
 * Delete a file from a user's storage directory
 */
export function deleteUserFile(userId: string, type: string, filename: string): boolean {
  const filePath = getUserFilePath(userId, type, filename)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}

/**
 * Get file metadata for a specific file
 */
export function getUserFileMetadata(
  userId: string,
  type: string,
  filename: string
): FileInfo | null {
  const filePath = getUserFilePath(userId, type, filename)
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
 * List all files in the user's trash folder
 */
export function listUserTrashedFiles(userId: string, type: string): TrashedFileInfo[] {
  const userDir = getUserStorageDir(userId, type)
  const trashDir = path.join(userDir, '.trash')
  if (!fs.existsSync(trashDir)) {
    return []
  }
  return fs.readdirSync(trashDir).map((f) => {
    const stat = fs.statSync(path.join(trashDir, f))
    return {
      filename: f,
      size: stat.isFile() ? stat.size : undefined,
      modified: stat.mtime,
      type: stat.isDirectory() ? 'folder' : 'file'
    }
  })
}

/**
 * Restore a file from the user's trash folder
 */
export function restoreUserFileFromTrash(userId: string, type: string, filename: string): boolean {
  const userDir = getUserStorageDir(userId, type)
  const trashDir = path.join(userDir, '.trash')
  const trashPath = path.join(trashDir, filename)
  const restorePath = path.join(userDir, filename)
  if (fs.existsSync(trashPath)) {
    fs.renameSync(trashPath, restorePath)
    return true
  }
  return false
}

/**
 * Permanently delete a file from the user's trash folder
 */
export function deleteUserFileFromTrash(userId: string, type: string, filename: string): boolean {
  const userDir = getUserStorageDir(userId, type)
  const trashDir = path.join(userDir, '.trash')
  const trashPath = path.join(trashDir, filename)
  if (fs.existsSync(trashPath)) {
    fs.unlinkSync(trashPath)
    return true
  }
  return false
}

/**
 * Calculate total storage usage for a user across all storage types
 * Returns total size in bytes
 */
export function calculateUserStorageUsage(userId: string): number {
  const userDir = path.join(getStorageDir(), String(userId))
  if (!fs.existsSync(userDir)) {
    return 0
  }

  let totalSize = 0

  function calculateDirSize(dirPath: string): number {
    let size = 0
    if (!fs.existsSync(dirPath)) {
      return size
    }

    const items = fs.readdirSync(dirPath)
    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const stat = fs.statSync(itemPath)

      if (stat.isDirectory()) {
        size += calculateDirSize(itemPath)
      } else {
        size += stat.size
      }
    }
    return size
  }

  return calculateDirSize(userDir)
}

/**
 * Calculate storage usage for a specific storage type for a user
 * Returns total size in bytes
 */
export function calculateUserStorageUsageByType(userId: string, type: string): number {
  const userDir = getUserStorageDir(userId, type)
  if (!fs.existsSync(userDir)) {
    return 0
  }

  let totalSize = 0

  function calculateDirSize(dirPath: string): number {
    let size = 0
    if (!fs.existsSync(dirPath)) {
      return size
    }

    const items = fs.readdirSync(dirPath)
    for (const item of items) {
      const itemPath = path.join(dirPath, item)
      const stat = fs.statSync(itemPath)

      if (stat.isDirectory()) {
        size += calculateDirSize(itemPath)
      } else {
        size += stat.size
      }
    }
    return size
  }

  return calculateDirSize(userDir)
}
