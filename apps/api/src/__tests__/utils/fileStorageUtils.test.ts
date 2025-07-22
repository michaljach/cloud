import fs from 'fs'
import path from 'path'
import {
  getStorageDir,
  getUserStorageDir,
  ensureUserStorageDir,
  userStorageDirExists,
  listUserFiles,
  listUserFilesWithMetadata,
  userFileExists,
  getUserFilePath,
  deleteUserFile,
  getUserFileMetadata,
  type FileInfo
} from '../../utils/fileStorageUtils'

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

  describe('getUserStorageDir', () => {
    it('should return the correct user storage directory path', () => {
      const result = getUserStorageDir(testUserId, testType)
      expect(result).toContain(testUserId)
      expect(result).toContain(testType)
    })
  })

  describe('ensureUserStorageDir', () => {
    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      ensureUserStorageDir(testUserId, testType)

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining(testUserId), {
        recursive: true
      })
    })

    it('should not create directory if it already exists', () => {
      mockFs.existsSync.mockReturnValue(true)

      ensureUserStorageDir(testUserId, testType)

      expect(mockFs.mkdirSync).not.toHaveBeenCalled()
    })
  })

  describe('userStorageDirExists', () => {
    it('should return true when directory exists', () => {
      mockFs.existsSync.mockReturnValue(true)

      const result = userStorageDirExists(testUserId, testType)

      expect(result).toBe(true)
      expect(mockFs.existsSync).toHaveBeenCalled()
    })

    it('should return false when directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = userStorageDirExists(testUserId, testType)

      expect(result).toBe(false)
    })
  })

  describe('listUserFiles', () => {
    it('should return empty array when directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = listUserFiles(testUserId, testType)

      expect(result).toEqual([])
    })

    it('should return list of files when directory exists', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readdirSync.mockReturnValue(['file1.txt', 'file2.txt'] as any)
      mockFs.statSync.mockReturnValue({ isFile: () => true } as any)

      const result = listUserFiles(testUserId, testType)

      expect(result).toEqual(['file1.txt', 'file2.txt'])
    })
  })

  describe('listUserFilesWithMetadata', () => {
    it('should return empty array when directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = listUserFilesWithMetadata(testUserId, testType)

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

      const result = listUserFilesWithMetadata(testUserId, testType)

      expect(result).toEqual([
        {
          filename: 'file1.txt',
          size: 1024,
          modified: new Date('2023-01-01')
        }
      ])
    })
  })

  describe('userFileExists', () => {
    it('should return true when file exists', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.statSync.mockReturnValue({ isFile: () => true } as any)

      const result = userFileExists(testUserId, testType, 'test.txt')

      expect(result).toBe(true)
    })

    it('should return false when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = userFileExists(testUserId, testType, 'test.txt')

      expect(result).toBe(false)
    })
  })

  describe('getUserFilePath', () => {
    it('should return the correct file path', () => {
      const result = getUserFilePath(testUserId, testType, 'test.txt')
      expect(result).toContain(testUserId)
      expect(result).toContain(testType)
      expect(result).toContain('test.txt')
    })
  })

  describe('deleteUserFile', () => {
    it('should delete file when it exists', () => {
      mockFs.existsSync.mockReturnValue(true)

      const result = deleteUserFile(testUserId, testType, 'test.txt')

      expect(result).toBe(true)
      expect(mockFs.unlinkSync).toHaveBeenCalled()
    })

    it('should return false when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = deleteUserFile(testUserId, testType, 'test.txt')

      expect(result).toBe(false)
      expect(mockFs.unlinkSync).not.toHaveBeenCalled()
    })
  })

  describe('getUserFileMetadata', () => {
    it('should return metadata when file exists', () => {
      const mockStat = {
        size: 1024,
        mtime: new Date('2023-01-01')
      }

      mockFs.existsSync.mockReturnValue(true)
      mockFs.statSync.mockReturnValue(mockStat as any)

      const result = getUserFileMetadata(testUserId, testType, 'test.txt')

      expect(result).toEqual({
        filename: 'test.txt',
        size: 1024,
        modified: new Date('2023-01-01')
      })
    })

    it('should return null when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false)

      const result = getUserFileMetadata(testUserId, testType, 'test.txt')

      expect(result).toBe(null)
    })
  })
})
