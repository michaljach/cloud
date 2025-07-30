import {
  encryptAndSaveFile,
  decryptAndReadFile,
  ensureStorageDirForContext,
  getStorageDirForContext,
  calculateStorageUsageByTypeForContext
} from '../utils'

const STORAGE_TYPE = 'photos'

export function encryptAndSavePhoto(fileBuffer: Buffer, filename: string, userId: string): string {
  const userDir = ensureStorageDirForContext(userId, 'personal', STORAGE_TYPE)
  return encryptAndSaveFile({ fileBuffer, filename, dir: userDir })
}

export function decryptAndReadPhoto(filename: string, userId: string): Buffer {
  const userDir = getStorageDirForContext(userId, 'personal', STORAGE_TYPE)
  return decryptAndReadFile({ filename, dir: userDir })
}

export function getUserPhotosStorageUsage(userId: string): number {
  return calculateStorageUsageByTypeForContext(userId, 'personal', STORAGE_TYPE)
}
