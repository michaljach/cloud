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

const STORAGE_TYPE = 'notes'

export function getUserNotesDir(userId: string): string {
  return getUserStorageDir(userId, STORAGE_TYPE)
}

export function ensureUserNotesDir(userId: string): string {
  return ensureUserStorageDir(userId, STORAGE_TYPE)
}

export function userNotesDirExists(userId: string): boolean {
  return userStorageDirExists(userId, STORAGE_TYPE)
}

export function listUserNotes(userId: string): string[] {
  return listUserFilesWithMetadata(userId, STORAGE_TYPE).map((f) => f.filename)
}

export function userNoteExists(userId: string, filename: string): boolean {
  return checkUserFileExists(userId, STORAGE_TYPE, filename)
}

export function getUserNotePath(userId: string, filename: string): string {
  return getStorageFilePath(userId, STORAGE_TYPE, filename)
}

export function deleteUserNote(userId: string, filename: string): boolean {
  return deleteStorageFile(userId, STORAGE_TYPE, filename)
}

export function getUserNoteMetadata(userId: string, filename: string): FileInfo | null {
  return getStorageFileMetadata(userId, STORAGE_TYPE, filename)
}

export function encryptAndSaveNote(fileBuffer: Buffer, filename: string, userId: string): string {
  const userDir = ensureUserNotesDir(userId)
  return encryptAndSaveFile({ fileBuffer, filename, dir: userDir })
}

export function decryptAndReadNote(filename: string, userId: string): Buffer {
  const userDir = getUserNotesDir(userId)
  return decryptAndReadFile({ filename, dir: userDir })
}

export function getUserNotesStorageUsage(userId: string): number {
  return calculateUserStorageUsageByType(userId, STORAGE_TYPE)
}
