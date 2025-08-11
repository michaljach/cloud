import '@testing-library/jest-dom'
import { searchFiles } from '@repo/api'
import { UserProvider, WorkspaceProvider } from '@repo/providers'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { FilesProvider } from '@/features/files/providers/files-context-provider'
import { columns } from '@/features/files/tables/files-table/files-columns-config'
import { DataTable } from '@/features/files/tables/files-table/files-table'
import { SearchClient } from '@/features/layout/page-search'


// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  })),
  usePathname: () => '/files'
}))

// Mock the contexts
jest.mock('@repo/providers', () => ({
  useUser: jest.fn(),
  useWorkspace: jest.fn(),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock the API functions
jest.mock('@repo/api', () => ({
  listFiles: jest.fn().mockResolvedValue([]),
  searchFiles: jest.fn(),
  downloadEncryptedUserFile: jest.fn(),
  deleteFile: jest.fn(),
  moveToTrash: jest.fn(),
  uploadFilesBatch: jest.fn(),
  batchMoveFilesToTrash: jest.fn(),
  downloadFile: jest.fn()
}))

// Mock the utils
jest.mock('@repo/utils', () => ({
  decryptFile: jest.fn(),
  getEncryptionKey: jest.fn(),
  formatFileSize: jest.fn((size) => `${size} B`),
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString())
}))

// Mock the file preview component
jest.mock('@/features/files/dialogs/file-preview-dialog', () => ({
  FilePreview: ({ isOpen, onClose, filename, filePath }: any) =>
    isOpen ? (
      <div data-testid="file-preview">
        <div>Preview: {filename}</div>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}))

// Mock JSZip
jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => ({
    file: jest.fn(),
    generateAsync: jest.fn().mockResolvedValue(new Blob())
  }))
})

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    loading: jest.fn(() => 'toast-id'),
    success: jest.fn(),
    error: jest.fn()
  }
}))

describe('Search Integration', () => {
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
    },
    {
      name: 'photo.jpg',
      path: 'documents/images/photo.jpg',
      size: 2048,
      modified: new Date('2024-01-02').toISOString(),
      type: 'file' as const
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

  function renderWithProviders(children: React.ReactNode) {
    return render(
      <UserProvider>
        <WorkspaceProvider>
          <FilesProvider>{children}</FilesProvider>
        </WorkspaceProvider>
      </UserProvider>
    )
  }

  describe('Search API Integration', () => {
    it('calls search API when user types in search box', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'document')

      await waitFor(() => {
        expect(mockSearchFiles).toHaveBeenCalledWith(
          mockAccessToken,
          'document',
          undefined // workspaceId is undefined for personal workspace
        )
      })
    })

    it('debounces search API calls', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')

      // Type rapidly
      await user.type(searchInput, 'd')
      await user.type(searchInput, 'o')
      await user.type(searchInput, 'c')

      // Wait for debounce
      await waitFor(() => {
        expect(mockSearchFiles).toHaveBeenCalledTimes(1)
        expect(mockSearchFiles).toHaveBeenCalledWith(mockAccessToken, 'doc', undefined)
      })
    })

    it('does not call search API for empty query', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, '   ') // Only spaces

      await waitFor(() => {
        expect(mockSearchFiles).not.toHaveBeenCalled()
      })
    })

    it('handles search API errors gracefully', async () => {
      mockSearchFiles.mockRejectedValue(new Error('Search failed'))
      const user = userEvent.setup()

      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(mockSearchFiles).toHaveBeenCalled()
      })

      // Should show empty results on error
      await waitFor(() => {
        expect(screen.getByText('No search results found.')).toBeInTheDocument()
      })
    })
  })

  describe('Search Results Display', () => {
    it('displays search results in table', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'document')

      await waitFor(() => {
        expect(screen.getByText('document.txt')).toBeInTheDocument()
        expect(screen.getByText('images')).toBeInTheDocument()
        expect(screen.getByText('photo.jpg')).toBeInTheDocument()
      })
    })

    it('shows search status in breadcrumb', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'document')

      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument()
        expect(screen.getByText('for "document"')).toBeInTheDocument()
        expect(screen.getByText('(3 results)')).toBeInTheDocument()
      })
    })

    it('shows file paths for search results', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'document')

      await waitFor(() => {
        // Should show paths for files that are not in root
        expect(screen.getByText('documents/document.txt')).toBeInTheDocument()
        expect(screen.getByText('documents/images')).toBeInTheDocument()
        expect(screen.getByText('documents/images/photo.jpg')).toBeInTheDocument()
      })
    })

    it('shows clear search button when searching', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'document')

      await waitFor(() => {
        expect(screen.getByText('Clear Search')).toBeInTheDocument()
      })
    })

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'document')

      await waitFor(() => {
        expect(screen.getByText('Clear Search')).toBeInTheDocument()
      })

      // Use the clear button in the search input (the one with aria-label="Clear search")
      const clearButton = screen.getByRole('button', { name: 'Clear search' })
      await user.click(clearButton)

      await waitFor(() => {
        expect(screen.queryByText('Clear Search')).not.toBeInTheDocument()
        expect(screen.queryByText('Search Results')).not.toBeInTheDocument()
        expect(searchInput).toHaveValue('')
      })
    })
  })

  describe('Search Navigation', () => {
    it('navigates to folder when double-clicking folder in search results', async () => {
      const user = userEvent.setup()
      const mockPush = jest.fn()
      const mockUseRouter = require('next/navigation').useRouter as jest.Mock
      mockUseRouter.mockReturnValue({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        prefetch: jest.fn()
      })

      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'document')

      await waitFor(() => {
        expect(screen.getByText('images')).toBeInTheDocument()
      })

      const folderRow = screen.getByText('images').closest('tr')
      if (folderRow) {
        await user.dblClick(folderRow)
      }

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/documents/images')
      })
    })

    it('opens file preview when double-clicking file in search results', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'document')

      await waitFor(() => {
        expect(screen.getByText('document.txt')).toBeInTheDocument()
      })

      const fileRow = screen.getByText('document.txt').closest('tr')
      if (fileRow) {
        await user.dblClick(fileRow)
      }

      await waitFor(() => {
        expect(screen.getByTestId('file-preview')).toBeInTheDocument()
        expect(screen.getByText('Preview: document.txt')).toBeInTheDocument()
      })
    })
  })

  describe('Search Loading States', () => {
    it('shows loading spinner while searching', async () => {
      // Mock a delayed search response
      mockSearchFiles.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSearchResults), 100))
      )

      const user = userEvent.setup()
      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'document')

      // Should show loading spinner
      await waitFor(() => {
        const spinner = document.querySelector('.animate-spin')
        expect(spinner).toBeInTheDocument()
      })

      // Wait for search to complete
      await waitFor(() => {
        expect(screen.getByText('document.txt')).toBeInTheDocument()
      })
    })

    it('shows skeleton loading for table during search', async () => {
      // Mock a delayed search response
      mockSearchFiles.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockSearchResults), 100))
      )

      const user = userEvent.setup()
      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'document')

      // Should show skeleton loading
      await waitFor(() => {
        const skeletons = screen.getAllByTestId('skeleton')
        expect(skeletons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Search with Workspace Context', () => {
    it('passes workspace ID to search API for workspace files', async () => {
      const workspaceWorkspace = {
        id: 'workspace-1',
        name: 'Test Workspace',
        type: 'workspace' as const
      }

      mockUseWorkspace.mockReturnValue({
        currentWorkspace: workspaceWorkspace
      })

      const user = userEvent.setup()
      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'document')

      await waitFor(() => {
        expect(mockSearchFiles).toHaveBeenCalledWith(mockAccessToken, 'document', 'workspace-1')
      })
    })
  })

  describe('Search Error Handling', () => {
    it('shows no results message when search returns empty results', async () => {
      mockSearchFiles.mockResolvedValue([])
      const user = userEvent.setup()

      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText('No search results found.')).toBeInTheDocument()
      })
    })

    it('handles network errors gracefully', async () => {
      mockSearchFiles.mockRejectedValue(new Error('Network error'))
      const user = userEvent.setup()

      renderWithProviders(
        <>
          <SearchClient />
          <DataTable columns={columns} />
        </>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'test')

      await waitFor(() => {
        expect(screen.getByText('No search results found.')).toBeInTheDocument()
      })
    })
  })
})
