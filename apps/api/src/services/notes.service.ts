import {
  encryptAndSaveFile,
  decryptAndReadFile,
  ensureStorageDirForContext,
  getStorageDirForContext,
  getUserPersonalStorageDir,
  storageDirExistsForContext,
  listFilesWithMetadataForContext,
  fileExistsForContext,
  getFilePathForContext,
  deleteFileForContext,
  getFileMetadataForContext,
  listFolderContentsWithMetadataForContext,
  listTrashedFilesForContext,
  restoreFileFromTrashForContext,
  deleteFileFromTrashForContext,
  calculateStorageUsageForContext,
  calculateStorageUsageByTypeForContext
} from '../utils'
import type { FileInfo, FolderOrFileInfo } from '@repo/types'
import fs from 'fs'
import path from 'path'

const STORAGE_TYPE = 'notes'

export function encryptAndSaveNote(fileBuffer: Buffer, filename: string, userId: string): string {
  const userDir = ensureStorageDirForContext(userId, 'personal', STORAGE_TYPE)
  return encryptAndSaveFile({ fileBuffer, filename, dir: userDir })
}

export function decryptAndReadNote(filename: string, userId: string): Buffer {
  const userDir = getStorageDirForContext(userId, 'personal', STORAGE_TYPE)
  return decryptAndReadFile({ filename, dir: userDir })
}

export function getUserNotesStorageUsage(userId: string): number {
  return calculateStorageUsageByTypeForContext(userId, 'personal', STORAGE_TYPE)
}
