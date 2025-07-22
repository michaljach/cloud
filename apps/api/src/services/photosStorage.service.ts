import {
  encryptAndSaveFile,
  decryptAndReadFile,
  ensureUserStorageDir,
  getUserStorageDir,
  userStorageDirExists,
  listUserFiles,
  userFileExists as checkUserFileExists,
  getUserFilePath as getStorageFilePath,
  deleteUserFile as deleteStorageFile,
  getUserFileMetadata as getStorageFileMetadata,
  type FileInfo
} from '../utils'

const STORAGE_TYPE = 'photos'

export function getUserPhotosDir(userId: string): string {
  return getUserStorageDir(userId, STORAGE_TYPE)
}

export function ensureUserPhotosDir(userId: string): string {
  return ensureUserStorageDir(userId, STORAGE_TYPE)
}

export function userPhotosDirExists(userId: string): boolean {
  return userStorageDirExists(userId, STORAGE_TYPE)
}

export function listUserPhotos(userId: string): string[] {
  return listUserFiles(userId, STORAGE_TYPE)
}

export function userPhotoExists(userId: string, filename: string): boolean {
  return checkUserFileExists(userId, STORAGE_TYPE, filename)
}

export function getUserPhotoPath(userId: string, filename: string): string {
  return getStorageFilePath(userId, STORAGE_TYPE, filename)
}

export function deleteUserPhoto(userId: string, filename: string): boolean {
  return deleteStorageFile(userId, STORAGE_TYPE, filename)
}

export function getUserPhotoMetadata(userId: string, filename: string): FileInfo | null {
  return getStorageFileMetadata(userId, STORAGE_TYPE, filename)
}

export function encryptAndSavePhoto(fileBuffer: Buffer, filename: string, userId: string): string {
  const userDir = ensureUserPhotosDir(userId)
  return encryptAndSaveFile({ fileBuffer, filename, dir: userDir })
}

export function decryptAndReadPhoto(filename: string, userId: string): Buffer {
  const userDir = getUserPhotosDir(userId)
  return decryptAndReadFile({ filename, dir: userDir })
}
