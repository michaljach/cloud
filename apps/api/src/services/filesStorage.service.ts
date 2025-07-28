import {
  encryptAndSaveFile,
  decryptAndReadFile,
  ensureUserStorageDir,
  getUserStorageDir,
  userStorageDirExists,
  listUserFilesWithMetadata,
  userFileExists as checkUserFileExists,
  getUserFilePath as getStorageFilePath,
  deleteUserFile as deleteStorageFile,
  getUserFileMetadata as getStorageFileMetadata,
  listUserFolderContentsWithMetadata,
  listUserTrashedFiles as listTrashedFiles,
  restoreUserFileFromTrash as restoreFileFromTrash,
  deleteUserFileFromTrash as deleteFileFromTrash,
  calculateUserStorageUsage,
  calculateUserStorageUsageByType
} from '../utils'
import type { FileInfo, FolderOrFileInfo } from '@repo/types'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'

const STORAGE_TYPE = 'files'

export function getUserFilesDir(userId: string): string {
  return getUserStorageDir(userId, STORAGE_TYPE)
}

export function ensureUserFilesDir(userId: string): string {
  return ensureUserStorageDir(userId, STORAGE_TYPE)
}

export function userFilesDirExists(userId: string): boolean {
  return userStorageDirExists(userId, STORAGE_TYPE)
}

export function listUserFiles(userId: string): FileInfo[] {
  return listUserFilesWithMetadata(userId, STORAGE_TYPE)
}

export function userFileExists(userId: string, filename: string): boolean {
  return checkUserFileExists(userId, STORAGE_TYPE, filename)
}

export function getUserFilePath(userId: string, filename: string): string {
  return getStorageFilePath(userId, STORAGE_TYPE, filename)
}

export function deleteUserFile(userId: string, filename: string): boolean {
  return deleteStorageFile(userId, STORAGE_TYPE, filename)
}

export function getUserFileMetadata(userId: string, filename: string): FileInfo | null {
  return getStorageFileMetadata(userId, STORAGE_TYPE, filename)
}

export function listUserFolderContents(userId: string, path: string = ''): FolderOrFileInfo[] {
  return listUserFolderContentsWithMetadata(userId, STORAGE_TYPE, path)
}

export function encryptAndSaveUserFile(
  fileBuffer: Buffer,
  filename: string,
  userId: string
): string {
  const userDir = getUserFilesDir(userId)
  return encryptAndSaveFile({ fileBuffer, filename, dir: userDir })
}

export function decryptAndReadUserFile(filename: string, userId: string): Buffer {
  const userDir = getUserFilesDir(userId)
  return decryptAndReadFile({ filename, dir: userDir })
}

export function listUserTrashedFiles(userId: string): FileInfo[] {
  return listTrashedFiles(userId, STORAGE_TYPE)
}

export function restoreUserFileFromTrash(userId: string, filename: string): boolean {
  return restoreFileFromTrash(userId, STORAGE_TYPE, filename)
}

export function deleteUserFileFromTrash(userId: string, filename: string): boolean {
  return deleteFileFromTrash(userId, STORAGE_TYPE, filename)
}

export function batchMoveUserFilesToTrash(
  userId: string,
  filenames: string[]
): { filename: string; success: boolean; error: string | null }[] {
  const results = []
  const userDir = getUserFilesDir(userId)
  const trashDir = path.join(userDir, '.trash')
  if (!fs.existsSync(trashDir)) {
    fs.mkdirSync(trashDir, { recursive: true })
  }
  for (const filename of filenames) {
    if (!filename) {
      results.push({ filename, success: false, error: 'Filename required' })
      continue
    }
    const filePath = path.join(userDir, filename)
    const trashPath = path.join(trashDir, filename)
    if (fs.existsSync(filePath)) {
      fs.renameSync(filePath, trashPath)
      results.push({ filename, success: true, error: null })
    } else {
      results.push({ filename, success: false, error: 'File or folder not found' })
    }
  }
  return results
}

export function getUserStorageUsage(userId: string): number {
  return calculateUserStorageUsage(userId)
}

export function getUserFilesStorageUsage(userId: string): number {
  return calculateUserStorageUsageByType(userId, STORAGE_TYPE)
}

export function streamUserFolderAsZip(
  userId: string,
  folderPath: string,
  writableStream: NodeJS.WritableStream
): Promise<void> {
  function walkDir(
    dir: string,
    relPath: string,
    fileList: { abs: string; rel: string }[] = []
  ): { abs: string; rel: string }[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const absPath = path.join(dir, entry.name)
      const relEntryPath = path.join(relPath, entry.name)
      if (entry.isDirectory()) {
        walkDir(absPath, relEntryPath, fileList)
      } else if (entry.isFile()) {
        fileList.push({ abs: absPath, rel: relEntryPath })
      }
    }
    return fileList
  }

  return new Promise((resolve, reject) => {
    const baseDir = getUserFilesDir(userId)
    const targetDir = folderPath ? path.join(baseDir, folderPath) : baseDir
    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
      return reject(new Error('Folder not found'))
    }
    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.on('error', (err) => reject(err))
    archive.on('end', () => resolve())
    archive.pipe(writableStream)

    // Recursively add decrypted files
    const files = walkDir(targetDir, '')
    for (const file of files) {
      // Skip dotfiles and system files
      if (file.rel.startsWith('.') || file.rel.includes('/.')) continue
      if (file.rel === '.DS_Store') continue
      // Compute the relative path from the user's files root
      const relFromUserRoot = path.relative(baseDir, file.abs)
      let decrypted: Buffer
      try {
        decrypted = decryptAndReadUserFile(relFromUserRoot, userId)
      } catch (e) {
        // If decryption fails, skip the file
        continue
      }
      archive.append(decrypted, { name: file.rel })
    }
    archive.finalize()
  })
}
