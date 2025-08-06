import fs from 'fs'
import path from 'path'
import { searchFilesForContext } from '../utils/storageUtils'

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  mkdirSync: jest.fn()
}))

// Mock the storage utilities but keep searchFilesForContext
jest.mock('../utils/storageUtils', () => {
  const actual = jest.requireActual('../utils/storageUtils')
  return {
    ...actual,
    getStorageDirForContext: jest.fn(() => './storage/users/user-1/files')
  }
})

describe('searchFilesForContext', () => {
  const mockFs = fs as jest.Mocked<typeof fs>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns empty array when storage directory does not exist', () => {
    mockFs.existsSync.mockReturnValue(false)

    const results = searchFilesForContext('user-1', 'personal', 'files', 'test')

    expect(results).toEqual([])
    expect(mockFs.existsSync).toHaveBeenCalled()
  })

  it('returns empty array for empty query', () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue(['document.txt', 'image.jpg'] as any)

    const results = searchFilesForContext('user-1', 'personal', 'files', '')

    expect(results).toEqual([])
    expect(mockFs.existsSync).toHaveBeenCalled()
  })

  it('returns empty array for whitespace-only query', () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue(['document.txt', 'image.jpg'] as any)

    const results = searchFilesForContext('user-1', 'personal', 'files', '   ')

    expect(results).toEqual([])
    expect(mockFs.existsSync).toHaveBeenCalled()
  })

  it('finds files matching search query', () => {
    const storageDir = '/storage/users/user-1/files'
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue(['document.txt', 'image.jpg', 'other.txt'] as any)

    // Mock stat for each file
    mockFs.statSync
      .mockReturnValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date('2024-01-01')
      } as any)
      .mockReturnValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 2048,
        mtime: new Date('2024-01-02')
      } as any)
      .mockReturnValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 512,
        mtime: new Date('2024-01-03')
      } as any)

    const results = searchFilesForContext('user-1', 'personal', 'files', 'document')

    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({
      name: 'document.txt',
      path: 'document.txt',
      size: 1024,
      modified: new Date('2024-01-01'),
      type: 'file'
    })
  })

  it('finds folders matching search query', () => {
    const storageDir = 'storage/users/user-1/files'
    mockFs.existsSync.mockReturnValue(true)

    // Mock readdirSync to return different values based on the directory
    mockFs.readdirSync.mockImplementation((path) => {
      const pathStr = path.toString()
      if (pathStr === storageDir) {
        return ['documents', 'images', 'other'] as any
      } else {
        // Return empty array for subdirectories to prevent infinite recursion
        return [] as any
      }
    })

    // Mock stat for each directory
    mockFs.statSync.mockReturnValue({
      isFile: () => false,
      isDirectory: () => true,
      mtime: new Date('2024-01-01')
    } as any)

    const results = searchFilesForContext('user-1', 'personal', 'files', 'documents')

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('documents')
    expect(results[0].type).toBe('folder')
  })

  it('searches recursively through subdirectories', () => {
    const storageDir = '/storage/users/user-1/files'
    mockFs.existsSync.mockReturnValue(true)

    // Mock root directory contents
    mockFs.readdirSync
      .mockReturnValueOnce(['documents', 'images'] as any)
      .mockReturnValueOnce(['document.txt', 'report.pdf'] as any) // documents subdirectory
      .mockReturnValueOnce(['photo.jpg'] as any) // images subdirectory

    // Mock stat for root items
    mockFs.statSync
      .mockReturnValueOnce({
        isFile: () => false,
        isDirectory: () => true,
        mtime: new Date('2024-01-01')
      } as any)
      .mockReturnValueOnce({
        isFile: () => false,
        isDirectory: () => true,
        mtime: new Date('2024-01-02')
      } as any)
      // Mock stat for documents subdirectory items
      .mockReturnValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date('2024-01-03')
      } as any)
      .mockReturnValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 2048,
        mtime: new Date('2024-01-04')
      } as any)
      // Mock stat for images subdirectory items
      .mockReturnValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 3072,
        mtime: new Date('2024-01-05')
      } as any)

    const results = searchFilesForContext('user-1', 'personal', 'files', 'document')

    expect(results).toHaveLength(2)
    expect(results.some((r) => r.name === 'documents')).toBe(true)
    expect(results.some((r) => r.name === 'document.txt')).toBe(true)
  })

  it('skips .trash directory', () => {
    const storageDir = '/storage/users/user-1/files'
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue(['document.txt', '.trash', 'image.jpg'] as any)

    // Mock stat for each item
    mockFs.statSync.mockImplementation((path) => {
      const pathStr = path.toString()
      if (pathStr.includes('document.txt')) {
        return {
          isFile: () => true,
          isDirectory: () => false,
          size: 1024,
          mtime: new Date('2024-01-01')
        } as any
      } else if (pathStr.includes('.trash')) {
        return {
          isFile: () => false,
          isDirectory: () => true,
          mtime: new Date('2024-01-02')
        } as any
      } else if (pathStr.includes('image.jpg')) {
        return {
          isFile: () => true,
          isDirectory: () => false,
          size: 2048,
          mtime: new Date('2024-01-03')
        } as any
      }
      return {
        isFile: () => false,
        isDirectory: () => true,
        mtime: new Date('2024-01-01')
      } as any
    })

    const results = searchFilesForContext('user-1', 'personal', 'files', 'document')

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('document.txt')
  })

  it('performs case-insensitive search', () => {
    const storageDir = '/storage/users/user-1/files'
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue(['Document.txt', 'DOCUMENT.pdf', 'image.jpg'] as any)

    // Mock stat for each file
    mockFs.statSync
      .mockReturnValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date('2024-01-01')
      } as any)
      .mockReturnValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 2048,
        mtime: new Date('2024-01-02')
      } as any)
      .mockReturnValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 512,
        mtime: new Date('2024-01-03')
      } as any)

    const results = searchFilesForContext('user-1', 'personal', 'files', 'document')

    expect(results).toHaveLength(2)
    expect(results.some((r) => r.name === 'Document.txt')).toBe(true)
    expect(results.some((r) => r.name === 'DOCUMENT.pdf')).toBe(true)
  })

  it('sorts results with folders first, then by name', () => {
    const storageDir = 'storage/users/user-1/files'
    mockFs.existsSync.mockReturnValue(true)

    // Mock readdirSync to return different values based on the directory
    mockFs.readdirSync.mockImplementation((path) => {
      const pathStr = path.toString()
      if (pathStr === storageDir) {
        return ['zebra.txt', 'alpha.txt', 'documents', 'beta.txt'] as any
      } else {
        // Return empty array for subdirectories to prevent infinite recursion
        return [] as any
      }
    })

    // Mock stat to return different types based on the item name
    mockFs.statSync.mockImplementation((path) => {
      const pathStr = path.toString()
      if (pathStr.includes('documents')) {
        return {
          isFile: () => false,
          isDirectory: () => true,
          mtime: new Date('2024-01-03')
        } as any
      } else {
        return {
          isFile: () => true,
          isDirectory: () => false,
          size: 1024,
          mtime: new Date('2024-01-01')
        } as any
      }
    })

    // Use query 'e' to match 'documents', 'beta.txt', and 'zebra.txt'
    const results = searchFilesForContext('user-1', 'personal', 'files', 'e')

    expect(results).toHaveLength(3)
    expect(results[0].name).toBe('documents') // folders first
    expect(results[1].name).toBe('beta.txt') // then files alphabetically
    expect(results[2].name).toBe('zebra.txt') // then files alphabetically
  })

  it('handles special characters in file names', () => {
    const storageDir = '/storage/users/user-1/files'
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue([
      'file-name_123.txt',
      'file@name.txt',
      'file name.txt'
    ] as any)

    // Mock stat for each file
    mockFs.statSync
      .mockReturnValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date('2024-01-01')
      } as any)
      .mockReturnValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 2048,
        mtime: new Date('2024-01-02')
      } as any)
      .mockReturnValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 512,
        mtime: new Date('2024-01-03')
      } as any)

    const results = searchFilesForContext('user-1', 'personal', 'files', 'file-name')

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('file-name_123.txt')
  })

  it('handles deep nested directory structures', () => {
    const storageDir = '/storage/users/user-1/files'
    mockFs.existsSync.mockReturnValue(true)

    // Mock directory structure: root -> documents -> 2024 -> reports
    mockFs.readdirSync
      .mockReturnValueOnce(['documents'] as any) // root
      .mockReturnValueOnce(['2024'] as any) // documents
      .mockReturnValueOnce(['reports'] as any) // 2024
      .mockReturnValueOnce(['annual-report.pdf'] as any) // reports

    // Mock stat for each directory and file
    mockFs.statSync
      .mockReturnValueOnce({
        isFile: () => false,
        isDirectory: () => true,
        mtime: new Date('2024-01-01')
      } as any) // documents
      .mockReturnValueOnce({
        isFile: () => false,
        isDirectory: () => true,
        mtime: new Date('2024-01-02')
      } as any) // 2024
      .mockReturnValueOnce({
        isFile: () => false,
        isDirectory: () => true,
        mtime: new Date('2024-01-03')
      } as any) // reports
      .mockReturnValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
        mtime: new Date('2024-01-04')
      } as any) // annual-report.pdf

    const results = searchFilesForContext('user-1', 'personal', 'files', 'report')

    expect(results).toHaveLength(2)
    expect(results).toEqual([
      {
        name: 'reports',
        path: 'documents/2024/reports',
        size: undefined,
        modified: new Date('2024-01-03'),
        type: 'folder'
      },
      {
        name: 'annual-report.pdf',
        path: 'documents/2024/reports/annual-report.pdf',
        size: 1024,
        modified: new Date('2024-01-04'),
        type: 'file'
      }
    ])
  })

  it('handles filesystem errors gracefully', () => {
    const storageDir = '/storage/users/user-1/files'
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockImplementation(() => {
      throw new Error('Permission denied')
    })

    expect(() => {
      searchFilesForContext('user-1', 'personal', 'files', 'test')
    }).toThrow('Permission denied')
  })

  it('handles stat errors gracefully', () => {
    const storageDir = '/storage/users/user-1/files'
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue(['document.txt'] as any)
    mockFs.statSync.mockImplementation(() => {
      throw new Error('File not found')
    })

    expect(() => {
      searchFilesForContext('user-1', 'personal', 'files', 'document')
    }).toThrow('File not found')
  })

  it('works with workspace storage paths', () => {
    // This test verifies that the function works with different storage contexts
    const workspaceStorageDir = '/storage/workspaces/workspace-1/files'
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue(['workspace-file.txt'] as any)
    mockFs.statSync.mockReturnValue({
      isFile: () => true,
      isDirectory: () => false,
      size: 1024,
      mtime: new Date('2024-01-01')
    } as any)

    const results = searchFilesForContext('user-1', 'workspace-1', 'files', 'workspace')

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('workspace-file.txt')
  })
})
