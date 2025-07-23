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
  type FileInfo,
  type FolderOrFileInfo,
  moveUserFileToTrash as moveFileToTrash,
  listUserTrashedFiles as listTrashedFiles,
  restoreUserFileFromTrash as restoreFileFromTrash,
  deleteUserFileFromTrash as deleteFileFromTrash
} from '../utils'

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
  const userDir = ensureUserFilesDir(userId)
  return encryptAndSaveFile({ fileBuffer, filename, dir: userDir })
}

export function decryptAndReadUserFile(filename: string, userId: string): Buffer {
  const userDir = getUserFilesDir(userId)
  return decryptAndReadFile({ filename, dir: userDir })
}

export function moveUserFileToTrash(userId: string, filename: string): boolean {
  return moveFileToTrash(userId, STORAGE_TYPE, filename)
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
