import fs from 'fs'
import path from 'path'
import {
  getStorageDir,
  getUserPersonalStorageDir,
  ensureStorageDirForContext,
  storageDirExistsForContext,
  listFilesForContext,
  listFilesWithMetadataForContext,
  fileExistsForContext,
  getFilePathForContext,
  deleteFileForContext,
  getFileMetadataForContext
} from '../../utils/storageUtils'
import type { FileInfo } from '@repo/types'

// Mock the storage directory to a test location
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  unlinkSync: jest.fn(),
  writeFileSync: jest.fn()
}))

describe('fileStorageUtils', () => {
  const mockFs = fs as jest.Mocked<typeof fs>
  const testUserId = 'test-user-123'
  const testType = 'test-files'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getStorageDir', () => {
    it('should return the storage directory path', () => {
      const result = getStorageDir()
      expect(result).toContain('storage')
    })
  })

  describe('getUserPersonalStorageDir', () => {
    it('should return the correct user storage directory path', () => {
      const result = getUserPersonalStorageDir(testUserId, testType)
      expect(result).toContain(testUserId)
      expect(result).toContain(testType)
    })
  })

  describe('ensureStorageDirForContext', () => {
    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      ensureStorageDirForContext(testUserId, 'personal', testType)

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining(testUserId), {
        recursive: true
      })
    })

    it('should not create directory if it already exists', () => {
      mockFs.existsSync.mockReturnValue(true)

      ensureStorageDirForContext(testUserId, 'personal', testType)

      expect(mockFs.mkdirSync).not.toHaveBeenCalled()
    })
  })

  describe('storageDirExistsForContext', () => {
    it('should return true when directory exists', () => {
      mockFs.existsSync.mockReturnValue(true)

      const result = storageDirExistsForContext(testUserId, 'personal', testType)

      expect(result).toBe(true)
      expect(mockFs.existsSync).toHaveBeenCalled()
    })

    it('should return false when directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = storageDirExistsForContext(testUserId, 'personal', testType)

      expect(result).toBe(false)
    })
  })

  describe('listFilesForContext', () => {
    it('should return empty array when directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = listFilesForContext(testUserId, 'personal', testType)

      expect(result).toEqual([])
    })

    it('should return list of files when directory exists', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readdirSync.mockReturnValue(['file1.txt', 'file2.txt'] as any)
      mockFs.statSync.mockReturnValue({ isFile: () => true } as any)

      const result = listFilesForContext(testUserId, 'personal', testType)

      expect(result).toEqual(['file1.txt', 'file2.txt'])
    })
  })

  describe('listFilesWithMetadataForContext', () => {
    it('should return empty array when directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = listFilesWithMetadataForContext(testUserId, 'personal', testType)

      expect(result).toEqual([])
    })

    it('should return files with metadata when directory exists', () => {
      const mockStat = {
        isFile: () => true,
        size: 1024,
        mtime: new Date('2023-01-01')
      }

      mockFs.existsSync.mockReturnValue(true)
      mockFs.readdirSync.mockReturnValue(['file1.txt'] as any)
      mockFs.statSync.mockReturnValue(mockStat as any)

      const result = listFilesWithMetadataForContext(testUserId, 'personal', testType)

      expect(result).toEqual([
        {
          filename: 'file1.txt',
          size: 1024,
          modified: new Date('2023-01-01')
        }
      ])
    })
  })

  describe('fileExistsForContext', () => {
    it('should return true when file exists', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.statSync.mockReturnValue({ isFile: () => true } as any)

      const result = fileExistsForContext(testUserId, 'personal', testType, 'test.txt')

      expect(result).toBe(true)
    })

    it('should return false when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = fileExistsForContext(testUserId, 'personal', testType, 'test.txt')

      expect(result).toBe(false)
    })
  })

  describe('getFilePathForContext', () => {
    it('should return the correct file path', () => {
      const result = getFilePathForContext(testUserId, 'personal', testType, 'test.txt')
      expect(result).toContain(testUserId)
      expect(result).toContain(testType)
      expect(result).toContain('test.txt')
    })
  })

  describe('deleteFileForContext', () => {
    it('should delete file when it exists', () => {
      mockFs.existsSync.mockReturnValue(true)

      const result = deleteFileForContext(testUserId, 'personal', testType, 'test.txt')

      expect(result).toBe(true)
      expect(mockFs.unlinkSync).toHaveBeenCalled()
    })

    it('should return false when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = deleteFileForContext(testUserId, 'personal', testType, 'test.txt')

      expect(result).toBe(false)
      expect(mockFs.unlinkSync).not.toHaveBeenCalled()
    })
  })

  describe('getFileMetadataForContext', () => {
    it('should return metadata when file exists', () => {
      const mockStat = {
        size: 1024,
        mtime: new Date('2023-01-01')
      }

      mockFs.existsSync.mockReturnValue(true)
      mockFs.statSync.mockReturnValue(mockStat as any)

      const result = getFileMetadataForContext(testUserId, 'personal', testType, 'test.txt')

      expect(result).toEqual({
        filename: 'test.txt',
        size: 1024,
        modified: new Date('2023-01-01')
      })
    })

    it('should return null when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = getFileMetadataForContext(testUserId, 'personal', testType, 'test.txt')

      expect(result).toBe(null)
    })
  })
})
