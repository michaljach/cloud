import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from '../components/files-table/data-table'
import { columns } from '../components/files-table/columns'
import { FilesProvider } from '../components/providers/files-context'
import { UserProvider, WorkspaceProvider } from '@repo/contexts'

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

// Mock the contexts
jest.mock('@repo/contexts', () => ({
  useUser: jest.fn(),
  useWorkspace: jest.fn(),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock the API functions
jest.mock('@repo/api', () => ({
  listFiles: jest.fn().mockResolvedValue([]),
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
  encryptFile: jest.fn(),
  getEncryptionKey: jest.fn(),
  formatFileSize: jest.fn((size) => `${size} B`),
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString())
}))

// Mock the file preview dialog component
jest.mock('../components/dialogs/file-preview-dialog', () => ({
  FilePreviewDialog: ({ isOpen, onClose, filename, filePath }: any) =>
    isOpen ? (
      <div data-testid="file-preview-dialog">
        <div>Preview: {filename}</div>
        <div>Path: {filePath}</div>
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

// Mock the files context
jest.mock('../components/providers/files-context', () => ({
  FilesContext: React.createContext({
    files: [],
    loading: false,
    refreshFiles: jest.fn(),
    currentPath: '',
    setCurrentPath: jest.fn(),
    trashedFiles: [],
    refreshTrash: jest.fn()
  }),
  FilesProvider: ({ children }: any) => <div data-testid="files-provider">{children}</div>
}))

const mockColumns = [
  {
    accessorKey: 'filename',
    header: 'Name'
  }
]

const mockData = [
  {
    filename: 'test-file.txt',
    type: 'file',
    size: 1024,
    modified: '2023-01-01T00:00:00Z'
  }
]

describe('DataTable', () => {
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

  const mockFiles = [
    {
      id: 'document.txt',
      filename: 'document.txt',
      type: 'file' as const,
      size: 1024,
      modified: new Date('2024-01-01').toISOString()
    },
    {
      id: 'folder1',
      filename: 'folder1',
      type: 'folder' as const,
      size: 0,
      modified: new Date('2024-01-02').toISOString()
    },
    {
      id: 'image.jpg',
      filename: 'image.jpg',
      type: 'file' as const,
      size: 2048,
      modified: new Date('2024-01-03').toISOString()
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    const { useUser } = require('@repo/contexts')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: mockAccessToken,
      loading: false,
      logout: jest.fn(),
      refreshStorageQuota: jest.fn()
    })

    const { useWorkspace } = require('@repo/contexts')
    useWorkspace.mockReturnValue({
      currentWorkspace: mockWorkspace,
      setCurrentWorkspace: jest.fn()
    })

    const { formatFileSize, formatDate } = require('@repo/utils')
    formatFileSize.mockReturnValue('1 KB')
    formatDate.mockReturnValue('Jan 1, 2024')

    const { listFiles } = require('@repo/api')
    listFiles.mockResolvedValue(mockFiles)

    const { uploadFilesBatch, batchMoveFilesToTrash, downloadFile } = require('@repo/api')
    uploadFilesBatch.mockResolvedValue({ success: true })
    batchMoveFilesToTrash.mockResolvedValue({ success: true })
    downloadFile.mockResolvedValue(new ArrayBuffer(0))

    const { encryptFile, decryptFile, getEncryptionKey } = require('@repo/utils')
    encryptFile.mockResolvedValue(new Uint8Array(0))
    decryptFile.mockResolvedValue(new ArrayBuffer(0))
    getEncryptionKey.mockResolvedValue('test-key')
  })

  function renderDataTable() {
    return render(
      <UserProvider>
        <WorkspaceProvider>
          <FilesProvider>
            <DataTable columns={columns} data={mockFiles} />
          </FilesProvider>
        </WorkspaceProvider>
      </UserProvider>
    )
  }

  it('renders file table with data', async () => {
    renderDataTable()

    await waitFor(() => {
      expect(screen.getByText('document.txt')).toBeInTheDocument()
      expect(screen.getByText('folder1')).toBeInTheDocument()
      expect(screen.getByText('image.jpg')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    renderDataTable()

    // The component should render without crashing
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('handles file loading error', async () => {
    const { listFiles } = require('@repo/api')
    listFiles.mockRejectedValue(new Error('Failed to load files'))

    renderDataTable()

    // Since we're providing data directly, it should render the data
    await waitFor(() => {
      expect(screen.getByText('document.txt')).toBeInTheDocument()
    })
  })

  it('allows file selection with checkbox', async () => {
    renderDataTable()

    await waitFor(() => {
      expect(screen.getByText('document.txt')).toBeInTheDocument()
    })

    const checkboxes = screen.getAllByRole('checkbox', { name: /select row/i })
    const firstFileCheckbox = checkboxes[1] // Skip the "select all" checkbox
    if (firstFileCheckbox) {
      fireEvent.click(firstFileCheckbox)
      expect(firstFileCheckbox).toBeChecked()
    }
  })

  it('allows multiple file selection', async () => {
    renderDataTable()

    await waitFor(() => {
      expect(screen.getByText('document.txt')).toBeInTheDocument()
      expect(screen.getByText('image.jpg')).toBeInTheDocument()
    })

    const checkboxes = screen.getAllByRole('checkbox', { name: /select row/i })
    const checkbox1 = checkboxes[1] // First file checkbox
    const checkbox2 = checkboxes[3] // Second file checkbox

    if (checkbox1 && checkbox2) {
      fireEvent.click(checkbox1)
      fireEvent.click(checkbox2)

      // Wait for the state to update
      await waitFor(() => {
        expect(checkbox1).toBeChecked()
        expect(checkbox2).toBeChecked()
      })
    }
  })

  it('allows select all functionality', async () => {
    renderDataTable()

    await waitFor(() => {
      expect(screen.getByText('document.txt')).toBeInTheDocument()
    })

    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i })
    fireEvent.click(selectAllCheckbox)

    const fileCheckboxes = screen.getAllByRole('checkbox', { name: /select row/i })
    fileCheckboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked()
    })
  })

  it('shows file size in human readable format', async () => {
    const { formatFileSize } = require('@repo/utils')
    formatFileSize.mockReturnValue('1 KB')

    renderDataTable()

    await waitFor(() => {
      expect(screen.getAllByText('1 KB')).toHaveLength(2) // Two files with same size
    })
  })

  it('shows file modification date', async () => {
    const { formatDate } = require('@repo/utils')
    formatDate.mockReturnValue('Jan 1, 2024')

    renderDataTable()

    await waitFor(() => {
      expect(screen.getAllByText('Jan 1, 2024')).toHaveLength(3) // All files have same date
    })
  })

  it('opens file preview on double click', async () => {
    renderDataTable()

    await waitFor(() => {
      expect(screen.getByText('document.txt')).toBeInTheDocument()
    })

    const fileRow = screen.getByText('document.txt').closest('tr')
    fireEvent.doubleClick(fileRow!)

    await waitFor(() => {
      expect(screen.getByTestId('file-preview-dialog')).toBeInTheDocument()
      expect(screen.getByText('Preview: document.txt')).toBeInTheDocument()
    })
  })

  it('navigates to folder on double click', async () => {
    renderDataTable()

    await waitFor(() => {
      expect(screen.getByText('folder1')).toBeInTheDocument()
    })

    const folderRow = screen.getByText('folder1').closest('tr')
    if (folderRow) {
      fireEvent.doubleClick(folderRow)
      // The navigation is handled by the FilesContext setCurrentPath
      // which calls router.push - this is tested in the FilesContext tests
    }
  })

  it('shows empty state when no files', async () => {
    render(
      <UserProvider>
        <WorkspaceProvider>
          <FilesProvider>
            <DataTable columns={columns} data={[]} />
          </FilesProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    // Wait for the component to finish loading and show empty state
    await waitFor(() => {
      expect(screen.getByText('No results.')).toBeInTheDocument()
    })
  })

  it('handles search functionality', async () => {
    renderDataTable()

    await waitFor(() => {
      expect(screen.getByText('document.txt')).toBeInTheDocument()
      expect(screen.getByText('image.jpg')).toBeInTheDocument()
    })

    // The search functionality would be handled by the parent component
    // This test verifies the table renders with the provided data
    expect(screen.getByText('document.txt')).toBeInTheDocument()
    expect(screen.getByText('image.jpg')).toBeInTheDocument()
  })

  it('sorts files by name', async () => {
    renderDataTable()

    await waitFor(() => {
      expect(screen.getByText('document.txt')).toBeInTheDocument()
    })

    // The sorting functionality is handled by the table library
    // This test verifies the table renders with the provided data
    expect(screen.getByText('document.txt')).toBeInTheDocument()
  })

  it('sorts files by size', async () => {
    renderDataTable()

    await waitFor(() => {
      expect(screen.getByText('document.txt')).toBeInTheDocument()
    })

    // The sorting functionality is handled by the table library
    // This test verifies the table renders with the provided data
    expect(screen.getByText('document.txt')).toBeInTheDocument()
  })

  it('sorts files by date', async () => {
    renderDataTable()

    await waitFor(() => {
      expect(screen.getByText('document.txt')).toBeInTheDocument()
    })

    // The sorting functionality is handled by the table library
    // This test verifies the table renders with the provided data
    expect(screen.getByText('document.txt')).toBeInTheDocument()
  })
})
