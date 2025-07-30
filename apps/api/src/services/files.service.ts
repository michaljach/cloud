import { encryptAndSaveFile, decryptAndReadFile } from '../utils/cryptoStorageUtils'
import {
  getStorageDirForContext,
  listTrashedFilesForContext,
  restoreFileFromTrashForContext,
  deleteFileFromTrashForContext,
  calculateStorageUsageForContext,
  calculateStorageUsageByTypeForContext,
  batchMoveFilesToTrashForContext
} from '../utils/storageUtils'
import type { FileInfo } from '@repo/types'

const STORAGE_TYPE = 'files'

export function encryptAndSaveUserFile(
  fileBuffer: Buffer,
  filename: string,
  userId: string
): string {
  const userDir = getStorageDirForContext(userId, 'personal', STORAGE_TYPE)
  return encryptAndSaveFile({ fileBuffer, filename, dir: userDir })
}

export function decryptAndReadUserFile(filename: string, userId: string): Buffer {
  const userDir = getStorageDirForContext(userId, 'personal', STORAGE_TYPE)
  return decryptAndReadFile({ filename, dir: userDir })
}

export function listUserTrashedFiles(userId: string): FileInfo[] {
  return listTrashedFilesForContext(userId, 'personal', STORAGE_TYPE)
}

export function restoreUserFileFromTrash(userId: string, filename: string): boolean {
  return restoreFileFromTrashForContext(userId, 'personal', STORAGE_TYPE, filename)
}

export function deleteUserFileFromTrash(userId: string, filename: string): boolean {
  return deleteFileFromTrashForContext(userId, 'personal', STORAGE_TYPE, filename)
}

export function batchMoveUserFilesToTrash(
  userId: string,
  filenames: string[]
): { filename: string; success: boolean; error: string | null }[] {
  return batchMoveFilesToTrashForContext(userId, 'personal', STORAGE_TYPE, filenames)
}

export function getUserStorageUsage(userId: string): number {
  return calculateStorageUsageForContext(userId, 'personal')
}

export function getUserFilesStorageUsage(userId: string): number {
  return calculateStorageUsageByTypeForContext(userId, 'personal', STORAGE_TYPE)
}
