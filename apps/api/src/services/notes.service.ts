import {
  ensureStorageDirForContext,
  getStorageDirForContext,
  saveFile,
  readFile,
  calculateStorageUsageByTypeForContext
} from '../utils'

const STORAGE_TYPE = 'notes'

export function saveNote(fileBuffer: Buffer, filename: string, userId: string): string {
  const userDir = ensureStorageDirForContext(userId, 'personal', STORAGE_TYPE)
  return saveFile({ fileBuffer, filename, dir: userDir })
}

export function readNote(filename: string, userId: string): Buffer {
  const userDir = getStorageDirForContext(userId, 'personal', STORAGE_TYPE)
  return readFile({ filename, dir: userDir })
}

export function getUserNotesStorageUsage(userId: string): number {
  return calculateStorageUsageByTypeForContext(userId, 'personal', STORAGE_TYPE)
}
