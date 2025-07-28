import {
  calculateUserStorageUsage,
  calculateUserStorageUsageByType
} from '../../utils/fileStorageUtils'
import fs from 'fs'
import path from 'path'

// Mock the storage directory for testing
const TEST_STORAGE_DIR = path.join(__dirname, '../../../test-storage')

// Set the storage directory environment variable for testing
process.env.STORAGE_DIR = TEST_STORAGE_DIR

describe('Storage Quota Utils', () => {
  beforeEach(() => {
    // Clean up test directory before each test
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true })
    }
    fs.mkdirSync(TEST_STORAGE_DIR, { recursive: true })
  })

  afterAll(() => {
    // Clean up test directory after all tests
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true })
    }
  })

  describe('calculateUserStorageUsageByType', () => {
    it('should return 0 for non-existent user directory', () => {
      const usage = calculateUserStorageUsageByType('non-existent-user', 'files')
      expect(usage).toBe(0)
    })

    it('should calculate correct storage usage for files', () => {
      const userId = 'test-user'
      const storageType = 'files'
      const userDir = path.join(TEST_STORAGE_DIR, userId, storageType)

      // Create test directory structure
      fs.mkdirSync(userDir, { recursive: true })

      // Create test files with known sizes
      const file1Path = path.join(userDir, 'test1.txt')
      const file2Path = path.join(userDir, 'test2.txt')

      fs.writeFileSync(file1Path, 'Hello World') // 11 bytes
      fs.writeFileSync(file2Path, 'Test content') // 12 bytes

      const usage = calculateUserStorageUsageByType(userId, storageType)
      expect(usage).toBe(23) // 11 + 12 = 23 bytes
    })

    it('should calculate storage usage including subdirectories', () => {
      const userId = 'test-user'
      const storageType = 'files'
      const userDir = path.join(TEST_STORAGE_DIR, userId, storageType)

      // Create test directory structure
      fs.mkdirSync(userDir, { recursive: true })
      const subDir = path.join(userDir, 'subdir')
      fs.mkdirSync(subDir, { recursive: true })

      // Create test files
      const file1Path = path.join(userDir, 'test1.txt')
      const file2Path = path.join(subDir, 'test2.txt')

      fs.writeFileSync(file1Path, 'Hello') // 5 bytes
      fs.writeFileSync(file2Path, 'World') // 5 bytes

      const usage = calculateUserStorageUsageByType(userId, storageType)
      expect(usage).toBe(10) // 5 + 5 = 10 bytes
    })
  })

  describe('calculateUserStorageUsage', () => {
    it('should return 0 for non-existent user directory', () => {
      const usage = calculateUserStorageUsage('non-existent-user')
      expect(usage).toBe(0)
    })

    it('should calculate total storage usage across all storage types', () => {
      const userId = 'test-user'
      const userDir = path.join(TEST_STORAGE_DIR, userId)

      // Create multiple storage type directories
      const filesDir = path.join(userDir, 'files')
      const notesDir = path.join(userDir, 'notes')
      const photosDir = path.join(userDir, 'photos')

      fs.mkdirSync(filesDir, { recursive: true })
      fs.mkdirSync(notesDir, { recursive: true })
      fs.mkdirSync(photosDir, { recursive: true })

      // Create test files in each directory
      fs.writeFileSync(path.join(filesDir, 'file1.txt'), 'File content') // 12 bytes
      fs.writeFileSync(path.join(notesDir, 'note1.txt'), 'Note content') // 12 bytes
      fs.writeFileSync(path.join(photosDir, 'photo1.jpg'), 'Photo data') // 10 bytes

      const usage = calculateUserStorageUsage(userId)
      expect(usage).toBe(34) // 12 + 12 + 10 = 34 bytes
    })
  })
})
