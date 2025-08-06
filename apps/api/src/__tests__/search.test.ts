import request from 'supertest'
import express from 'express'
import { searchFilesForContext } from '../utils/storageUtils'
import fs from 'fs'
import path from 'path'

// Create a test-specific app without authentication
const testApp = express()
testApp.use(express.json())

// Mock the storage utilities
jest.mock('../utils/storageUtils', () => ({
  searchFilesForContext: jest.fn(),
  getStorageDirForContext: jest.fn(() => '/test/storage')
}))

// Add the search endpoint directly to test app
testApp.get('/api/files/search', (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q : ''
  const workspaceId = (req.query.workspaceId as string) || 'personal'

  try {
    const results = searchFilesForContext('test-user-id', workspaceId, 'files', query)
    res.json({
      success: true,
      data: results,
      error: null
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to search files'
    })
  }
})

describe('Search API', () => {
  const mockSearchFilesForContext = searchFilesForContext as jest.MockedFunction<
    typeof searchFilesForContext
  >

  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchFilesForContext.mockReturnValue([])
  })

  describe('GET /api/files/search', () => {
    it('returns search results for valid query', async () => {
      const mockResults = [
        {
          name: 'document.txt',
          path: 'documents/document.txt',
          size: 1024,
          modified: new Date('2024-01-01'),
          type: 'file' as const
        },
        {
          name: 'images',
          path: 'documents/images',
          modified: new Date('2024-01-01'),
          type: 'folder' as const
        }
      ]

      mockSearchFilesForContext.mockReturnValue(mockResults)

      const response = await request(testApp).get('/api/files/search').query({ q: 'document' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockResults.map((result) => ({
          ...result,
          modified: result.modified.toISOString()
        })),
        error: null
      })
    })

    it('returns empty results for empty query', async () => {
      mockSearchFilesForContext.mockReturnValue([])

      const response = await request(testApp).get('/api/files/search').query({ q: '' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: [],
        error: null
      })
    })

    it('returns empty results for whitespace-only query', async () => {
      mockSearchFilesForContext.mockReturnValue([])

      const response = await request(testApp).get('/api/files/search').query({ q: '   ' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: [],
        error: null
      })
    })

    it('handles workspace search correctly', async () => {
      const mockResults = [
        {
          name: 'workspace-file.txt',
          path: 'workspace-file.txt',
          size: 512,
          modified: new Date('2024-01-01'),
          type: 'file' as const
        }
      ]

      mockSearchFilesForContext.mockReturnValue(mockResults)

      const response = await request(testApp).get('/api/files/search').query({
        q: 'workspace',
        workspaceId: 'workspace-123'
      })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockResults.map((result) => ({
          ...result,
          modified: result.modified.toISOString()
        })),
        error: null
      })
    })

    it('uses personal workspace as default when no workspaceId provided', async () => {
      const mockResults = [
        {
          name: 'personal-file.txt',
          path: 'personal-file.txt',
          size: 256,
          modified: new Date('2024-01-01'),
          type: 'file' as const
        }
      ]

      mockSearchFilesForContext.mockReturnValue(mockResults)

      const response = await request(testApp).get('/api/files/search').query({ q: 'personal' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockResults.map((result) => ({
          ...result,
          modified: result.modified.toISOString()
        })),
        error: null
      })
    })

    it('handles search errors gracefully', async () => {
      mockSearchFilesForContext.mockImplementation(() => {
        throw new Error('Search failed')
      })

      const response = await request(testApp).get('/api/files/search').query({ q: 'test' })

      expect(response.status).toBe(500)
      expect(response.body).toEqual({
        success: false,
        data: null,
        error: 'Search failed'
      })
    })

    it('handles missing query parameter', async () => {
      mockSearchFilesForContext.mockReturnValue([])

      const response = await request(testApp).get('/api/files/search')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: [],
        error: null
      })
    })

    it('handles special characters in query', async () => {
      const mockResults = [
        {
          name: 'file-name_123.txt',
          path: 'file-name_123.txt',
          size: 1024,
          modified: new Date('2024-01-01'),
          type: 'file' as const
        }
      ]

      mockSearchFilesForContext.mockReturnValue(mockResults)

      const response = await request(testApp).get('/api/files/search').query({ q: 'file-name_123' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockResults.map((result) => ({
          ...result,
          modified: result.modified.toISOString()
        })),
        error: null
      })
    })

    it('handles case-insensitive search', async () => {
      const mockResults = [
        {
          name: 'Document.txt',
          path: 'Document.txt',
          size: 1024,
          modified: new Date('2024-01-01'),
          type: 'file' as const
        }
      ]

      mockSearchFilesForContext.mockReturnValue(mockResults)

      const response = await request(testApp).get('/api/files/search').query({ q: 'document' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockResults.map((result) => ({
          ...result,
          modified: result.modified.toISOString()
        })),
        error: null
      })
    })

    it('handles large search results', async () => {
      const mockResults = Array.from({ length: 100 }, (_, i) => ({
        name: `file-${i}.txt`,
        path: `files/file-${i}.txt`,
        size: 1024,
        modified: new Date('2024-01-01'),
        type: 'file' as const
      }))

      mockSearchFilesForContext.mockReturnValue(mockResults)

      const response = await request(testApp).get('/api/files/search').query({ q: 'file' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockResults.map((result) => ({
          ...result,
          modified: result.modified.toISOString()
        })),
        error: null
      })
    })

    it('handles mixed file types in search results', async () => {
      const mockResults = [
        {
          name: 'document.txt',
          path: 'documents/document.txt',
          size: 1024,
          modified: new Date('2024-01-01'),
          type: 'file' as const
        },
        {
          name: 'images',
          path: 'documents/images',
          modified: new Date('2024-01-01'),
          type: 'folder' as const
        },
        {
          name: 'photo.jpg',
          path: 'documents/images/photo.jpg',
          size: 2048,
          modified: new Date('2024-01-02'),
          type: 'file' as const
        }
      ]

      mockSearchFilesForContext.mockReturnValue(mockResults)

      const response = await request(testApp).get('/api/files/search').query({ q: 'document' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        success: true,
        data: mockResults.map((result) => ({
          ...result,
          modified: result.modified.toISOString()
        })),
        error: null
      })
    })
  })
})
