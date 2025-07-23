import fs from 'fs'
import path from 'path'

const STORAGE_DIR = path.resolve(__dirname, '../../storage')

// Ensure main storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true })
}

export interface FileInfo {
  filename: string
  size: number
  modified: Date
}

export interface FolderOrFileInfo {
  name: string
  type: 'file' | 'folder'
  size?: number
  modified: Date
}

/**
 * Get the main storage directory path
 */
export function getStorageDir(): string {
  return STORAGE_DIR
}

/**
 * Get a user's specific storage directory for a given type
 */
export function getUserStorageDir(userId: string, type: string): string {
  return path.join(STORAGE_DIR, String(userId), type)
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
 * Move a file to the user's trash folder (soft delete)
 */
export function moveUserFileToTrash(userId: string, type: string, filename: string): boolean {
  const userDir = getUserStorageDir(userId, type)
  const trashDir = path.join(userDir, '.trash')
  if (!fs.existsSync(trashDir)) {
    fs.mkdirSync(trashDir, { recursive: true })
  }
  const filePath = path.join(userDir, filename)
  const trashPath = path.join(trashDir, filename)
  if (fs.existsSync(filePath)) {
    fs.renameSync(filePath, trashPath)
    return true
  }
  return false
}

/**
 * List all files in the user's trash folder
 */
export function listUserTrashedFiles(userId: string, type: string): FileInfo[] {
  const userDir = getUserStorageDir(userId, type)
  const trashDir = path.join(userDir, '.trash')
  if (!fs.existsSync(trashDir)) {
    return []
  }
  return fs
    .readdirSync(trashDir)
    .filter((f) => fs.statSync(path.join(trashDir, f)).isFile())
    .map((f) => {
      const stat = fs.statSync(path.join(trashDir, f))
      return {
        filename: f,
        size: stat.size,
        modified: stat.mtime
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
