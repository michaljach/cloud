import '@testing-library/jest-dom'
import { searchFiles } from '@repo/api'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { FilesProvider, FilesContext } from '@/features/files/providers/files-context-provider'


// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/files'
}))

// Mock the providers
jest.mock('@repo/providers', () => ({
  useUser: jest.fn(),
  useWorkspace: jest.fn()
}))

// Mock the API functions
jest.mock('@repo/api', () => ({
  listFiles: jest.fn().mockResolvedValue([]),
  searchFiles: jest.fn()
}))

// Mock the utils
jest.mock('@repo/utils', () => ({
  formatFileSize: jest.fn((size) => `${size} B`),
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString())
}))

describe('FilesContext Search Functionality', () => {
  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    fullName: 'Test User',
    email: 'test@example.com'
  }

  const mockWorkspace = {
    id: 'personal',
    name: 'Personal Space',
    type: 'personal' as const
  }

  const mockAccessToken = 'test-access-token'

  const mockSearchResults = [
    {
      name: 'document.txt',
      path: 'documents/document.txt',
      size: 1024,
      modified: new Date('2024-01-01').toISOString(),
      type: 'file' as const
    },
    {
      name: 'images',
      path: 'documents/images',
      size: undefined,
      modified: new Date('2024-01-01').toISOString(),
      type: 'folder' as const
    }
  ]

  const mockUseUser = require('@repo/providers').useUser
  const mockUseWorkspace = require('@repo/providers').useWorkspace
  const mockSearchFiles = searchFiles as jest.MockedFunction<typeof searchFiles>

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    mockUseUser.mockReturnValue({
      user: mockUser,
      accessToken: mockAccessToken,
      loading: false,
      logout: jest.fn(),
      refreshStorageQuota: jest.fn()
    })

    mockUseWorkspace.mockReturnValue({
      currentWorkspace: mockWorkspace
    })

    mockSearchFiles.mockResolvedValue(mockSearchResults)
  })

  // Test component to access context
  function TestComponent() {
    const context = React.useContext(FilesContext)

    return (
      <div>
        <div data-testid="search-query">{context.searchQuery}</div>
        <div data-testid="search-results-count">{context.searchResults.length}</div>
        <div data-testid="is-searching">{context.isSearching.toString()}</div>
        <button data-testid="set-search-query" onClick={() => context.setSearchQuery('test query')}>
          Set Search Query
        </button>
        <button data-testid="perform-search" onClick={() => context.performSearch('manual search')}>
          Perform Search
        </button>
        <button data-testid="clear-search" onClick={() => context.clearSearch()}>
          Clear Search
        </button>
        <div data-testid="search-results">
          {context.searchResults.map((result, index) => (
            <div key={index} data-testid={`search-result-${index}`}>
              {result.filename} - {result.path}
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderWithProviders() {
    return render(
      <FilesProvider>
        <TestComponent />
      </FilesProvider>
    )
  }

  describe('Search State Management', () => {
    it('initializes with empty search state', () => {
      renderWithProviders()

      expect(screen.getByTestId('search-query')).toHaveTextContent('')
      expect(screen.getByTestId('search-results-count')).toHaveTextContent('0')
      expect(screen.getByTestId('is-searching')).toHaveTextContent('false')
    })

    it('updates search query when setSearchQuery is called', async () => {
      renderWithProviders()

      const setSearchButton = screen.getByTestId('set-search-query')
      userEvent.click(setSearchButton)

      await waitFor(() => {
        expect(screen.getByTestId('search-query')).toHaveTextContent('test query')
      })
    })

    it('clears search state when clearSearch is called', async () => {
      renderWithProviders()

      // First set a search query
      const setSearchButton = screen.getByTestId('set-search-query')
      userEvent.click(setSearchButton)

      // Verify search query is set
      await waitFor(() => {
        expect(screen.getByTestId('search-query')).toHaveTextContent('test query')
      })

      // Clear search
      const clearSearchButton = screen.getByTestId('clear-search')
      userEvent.click(clearSearchButton)

      // Verify search is cleared
      await waitFor(() => {
        expect(screen.getByTestId('search-query')).toHaveTextContent('')
        expect(screen.getByTestId('search-results-count')).toHaveTextContent('0')
        expect(screen.getByTestId('is-searching')).toHaveTextContent('false')
      })
    })
  })

  describe('Search API Integration', () => {
    it('calls search API when search query changes', async () => {
      renderWithProviders()

      const setSearchButton = screen.getByTestId('set-search-query')
      userEvent.click(setSearchButton)

      await waitFor(() => {
        expect(mockSearchFiles).toHaveBeenCalledWith(
          mockAccessToken,
          'test query',
          undefined // workspaceId is undefined for personal workspace
        )
      })
    })

    it('debounces search API calls', async () => {
      renderWithProviders()

      // Simulate rapid search query changes
      const setSearchButton = screen.getByTestId('set-search-query')

      // Click multiple times rapidly
      userEvent.click(setSearchButton)
      userEvent.click(setSearchButton)
      userEvent.click(setSearchButton)

      // Wait for debounce
      await waitFor(() => {
        expect(mockSearchFiles).toHaveBeenCalledTimes(1)
      })
    })

    it('does not call search API for empty query', async () => {
      function TestContextComponent() {
        const context = React.useContext(FilesContext)
        return (
          <div>
            <button data-testid="set-empty-query" onClick={() => context.setSearchQuery('   ')}>
              Set Empty Query
            </button>
            <div data-testid="search-query">{context.searchQuery}</div>
          </div>
        )
      }

      render(
        <FilesProvider>
          <TestContextComponent />
        </FilesProvider>
      )

      const setEmptyQueryButton = screen.getByTestId('set-empty-query')
      userEvent.click(setEmptyQueryButton)

      await waitFor(() => {
        expect(mockSearchFiles).not.toHaveBeenCalled()
      })
    })

    it('handles search API errors gracefully', async () => {
      mockSearchFiles.mockRejectedValue(new Error('Search failed'))
      renderWithProviders()

      const setSearchButton = screen.getByTestId('set-search-query')
      userEvent.click(setSearchButton)

      await waitFor(() => {
        expect(mockSearchFiles).toHaveBeenCalled()
      })

      // Should have empty results on error
      await waitFor(() => {
        expect(screen.getByTestId('search-results-count')).toHaveTextContent('0')
      })
    })

    it('shows loading state during search', async () => {
      // Mock a delayed search response
      mockSearchFiles.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSearchResults), 100))
      )

      renderWithProviders()

      const setSearchButton = screen.getByTestId('set-search-query')
      userEvent.click(setSearchButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('is-searching')).toHaveTextContent('true')
      })

      // Wait for search to complete
      await waitFor(() => {
        expect(screen.getByTestId('is-searching')).toHaveTextContent('false')
      })
    })
  })

  describe('Search Results Processing', () => {
    it('transforms search results correctly', async () => {
      renderWithProviders()

      const setSearchButton = screen.getByTestId('set-search-query')
      userEvent.click(setSearchButton)

      await waitFor(() => {
        expect(screen.getByTestId('search-results-count')).toHaveTextContent('2')
      })

      // Check that results are transformed correctly
      expect(screen.getByTestId('search-result-0')).toHaveTextContent(
        'document.txt - documents/document.txt'
      )
      expect(screen.getByTestId('search-result-1')).toHaveTextContent('images - documents/images')
    })

    it('handles empty search results', async () => {
      mockSearchFiles.mockResolvedValue([])
      renderWithProviders()

      const setSearchButton = screen.getByTestId('set-search-query')
      userEvent.click(setSearchButton)

      await waitFor(() => {
        expect(screen.getByTestId('search-results-count')).toHaveTextContent('0')
      })
    })

    it('handles search results with missing fields', async () => {
      const incompleteResults = [
        {
          name: 'incomplete.txt',
          path: 'incomplete.txt',
          type: 'file' as const,
          modified: '2024-01-01T00:00:00.000Z'
          // Missing size
        }
      ]

      mockSearchFiles.mockResolvedValue(incompleteResults)
      renderWithProviders()

      const setSearchButton = screen.getByTestId('set-search-query')
      userEvent.click(setSearchButton)

      await waitFor(() => {
        expect(screen.getByTestId('search-results-count')).toHaveTextContent('1')
      })

      expect(screen.getByTestId('search-result-0')).toHaveTextContent(
        'incomplete.txt - incomplete.txt'
      )
    })
  })

  describe('Manual Search Function', () => {
    it('performs search when performSearch is called directly', async () => {
      renderWithProviders()

      const performSearchButton = screen.getByTestId('perform-search')
      userEvent.click(performSearchButton)

      await waitFor(() => {
        expect(mockSearchFiles).toHaveBeenCalledWith(mockAccessToken, 'manual search', undefined)
      })
    })

    it('does not perform search when query is empty', async () => {
      function TestContextComponent() {
        const context = React.useContext(FilesContext)
        return (
          <div>
            <button data-testid="perform-empty-search" onClick={() => context.performSearch('')}>
              Perform Empty Search
            </button>
            <div data-testid="search-query">{context.searchQuery}</div>
          </div>
        )
      }

      render(
        <FilesProvider>
          <TestContextComponent />
        </FilesProvider>
      )

      const performEmptySearchButton = screen.getByTestId('perform-empty-search')
      userEvent.click(performEmptySearchButton)

      await waitFor(() => {
        expect(mockSearchFiles).not.toHaveBeenCalled()
      })
    })

    it('does not perform search when no access token', async () => {
      mockUseUser.mockReturnValue({
        user: mockUser,
        accessToken: null,
        loading: false,
        logout: jest.fn(),
        refreshStorageQuota: jest.fn()
      })

      renderWithProviders()

      const performSearchButton = screen.getByTestId('perform-search')
      userEvent.click(performSearchButton)

      await waitFor(() => {
        expect(mockSearchFiles).not.toHaveBeenCalled()
      })
    })

    it('does not perform search when no workspace', async () => {
      mockUseWorkspace.mockReturnValue({
        currentWorkspace: null
      })

      renderWithProviders()

      const performSearchButton = screen.getByTestId('perform-search')
      userEvent.click(performSearchButton)

      await waitFor(() => {
        expect(mockSearchFiles).not.toHaveBeenCalled()
      })
    })
  })

  describe('Workspace Context Integration', () => {
    it('passes workspace ID for workspace files', async () => {
      const workspaceWorkspace = {
        id: 'workspace-1',
        name: 'Test Workspace',
        type: 'workspace' as const
      }

      mockUseWorkspace.mockReturnValue({
        currentWorkspace: workspaceWorkspace
      })

      renderWithProviders()

      const setSearchButton = screen.getByTestId('set-search-query')
      userEvent.click(setSearchButton)

      await waitFor(() => {
        expect(mockSearchFiles).toHaveBeenCalledWith(mockAccessToken, 'test query', 'workspace-1')
      })
    })

    it('handles personal workspace correctly', async () => {
      renderWithProviders()

      const setSearchButton = screen.getByTestId('set-search-query')
      userEvent.click(setSearchButton)

      await waitFor(() => {
        expect(mockSearchFiles).toHaveBeenCalledWith(
          mockAccessToken,
          'test query',
          undefined // personal workspace has undefined workspaceId
        )
      })
    })
  })

  describe('Search Query Validation', () => {
    it('trims whitespace from search queries', async () => {
      let contextValue: any = null

      function TestContextComponent() {
        const context = React.useContext(FilesContext)
        contextValue = context
        return (
          <div>
            <button
              data-testid="set-search-query"
              onClick={() => context.setSearchQuery('  test query  ')}
            >
              Set Search Query
            </button>
            <div data-testid="search-query">{context.searchQuery}</div>
          </div>
        )
      }

      render(
        <FilesProvider>
          <TestContextComponent />
        </FilesProvider>
      )

      const setSearchButton = screen.getByTestId('set-search-query')
      userEvent.click(setSearchButton)

      await waitFor(() => {
        expect(mockSearchFiles).toHaveBeenCalledWith(mockAccessToken, 'test query', undefined)
      })
    })

    it('handles special characters in search queries', async () => {
      let contextValue: any = null

      function TestContextComponent() {
        const context = React.useContext(FilesContext)
        contextValue = context
        return (
          <div>
            <button
              data-testid="set-search-query"
              onClick={() => context.setSearchQuery('file-name_123')}
            >
              Set Search Query
            </button>
            <div data-testid="search-query">{context.searchQuery}</div>
          </div>
        )
      }

      render(
        <FilesProvider>
          <TestContextComponent />
        </FilesProvider>
      )

      const setSearchButton = screen.getByTestId('set-search-query')
      userEvent.click(setSearchButton)

      await waitFor(() => {
        expect(mockSearchFiles).toHaveBeenCalledWith(mockAccessToken, 'file-name_123', undefined)
      })
    })
  })
})
