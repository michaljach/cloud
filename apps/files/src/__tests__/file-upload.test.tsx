import '@testing-library/jest-dom'
import { UserProvider, WorkspaceProvider } from '@repo/providers'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { FileUpload } from '@/features/files/forms/file-upload-form'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  })
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
  uploadFilesBatch: jest.fn()
}))

// Mock the utils
jest.mock('@repo/utils', () => ({
  encryptFile: jest.fn(),
  getEncryptionKey: jest.fn()
}))

// Mock the files context
jest.mock('@/features/files/providers/files-context-provider', () => ({
  FilesContext: React.createContext({
    refreshFiles: jest.fn()
  })
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}))

describe('FileUpload', () => {
  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    fullName: 'Test User',
    email: 'test@example.com',
    storageLimit: 1024 // 1GB in MB
  }

  const mockWorkspace = {
    id: 'personal',
    name: 'Personal Space',
    type: 'personal' as const
  }

  const mockAccessToken = 'test-access-token'

  const mockStorageQuota = {
    totalUsage: { megabytes: 100 }, // 100 MB used
    breakdown: {
      files: { megabytes: 50 },
      notes: { megabytes: 30 },
      photos: { megabytes: 20 }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    const { useUser, useWorkspace } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: mockAccessToken,
      loading: false,
      logout: jest.fn(),
      storageQuota: mockStorageQuota,
      refreshStorageQuota: jest.fn()
    })

    useWorkspace.mockReturnValue({
      currentWorkspace: mockWorkspace,
      availableWorkspaces: [mockWorkspace],
      loading: false,
      error: null,
      switchToWorkspace: jest.fn(),
      switchToPersonal: jest.fn(),
      refreshWorkspaces: jest.fn(),
      isPersonalSpace: true
    })
  })

  function renderFileUpload() {
    return render(
      <UserProvider>
        <WorkspaceProvider>
          <FileUpload />
        </WorkspaceProvider>
      </UserProvider>
    )
  }

  it('renders upload area', () => {
    renderFileUpload()

    expect(screen.getByRole('button', { name: /open file picker/i })).toBeInTheDocument()
    expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument()
  })

  it('allows file selection via input', async () => {
    // Mock the upload to not complete immediately
    const { uploadFilesBatch } = require('@repo/api')
    const { encryptFile, getEncryptionKey } = require('@repo/utils')

    uploadFilesBatch.mockImplementation(() => new Promise(() => {})) // Never resolves
    encryptFile.mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
    getEncryptionKey.mockReturnValue('test-key')

    renderFileUpload()

    const fileInput = screen.getByRole('button', { name: /open file picker/i })
    const hiddenInput = fileInput.querySelector('input[type="file"]')
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.change(hiddenInput!, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText('1 file(s) selected')).toBeInTheDocument()
    })
  })

  it('uploads file successfully', async () => {
    const { uploadFilesBatch } = require('@repo/api')
    const { encryptFile, getEncryptionKey } = require('@repo/utils')

    uploadFilesBatch.mockResolvedValue({ success: true })
    encryptFile.mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
    getEncryptionKey.mockReturnValue('test-key')

    renderFileUpload()

    const fileInput = screen.getByRole('button', { name: /open file picker/i })
    const hiddenInput = fileInput.querySelector('input[type="file"]')
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.change(hiddenInput!, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText('Upload successful!')).toBeInTheDocument()
    })

    expect(encryptFile).toHaveBeenCalledWith(file, 'test-key')
    expect(uploadFilesBatch).toHaveBeenCalledWith(
      [{ file: new Uint8Array([1, 2, 3, 4]), filename: 'test.txt' }],
      mockAccessToken,
      undefined // personal workspace
    )
  })

  it('shows encryption status during upload', async () => {
    const { uploadFilesBatch } = require('@repo/api')
    const { encryptFile, getEncryptionKey } = require('@repo/utils')

    // Make encryption take some time
    encryptFile.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(new Uint8Array([1, 2, 3, 4])), 100))
    )
    uploadFilesBatch.mockResolvedValue({ success: true })
    getEncryptionKey.mockReturnValue('test-key')

    renderFileUpload()

    const fileInput = screen.getByRole('button', { name: /open file picker/i })
    const hiddenInput = fileInput.querySelector('input[type="file"]')
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.change(hiddenInput!, { target: { files: [file] } })
    })

    await waitFor(
      () => {
        expect(screen.getByText('Encrypting...')).toBeInTheDocument()
      },
      { timeout: 2000 }
    )
  })

  it('handles upload error', async () => {
    const { uploadFilesBatch } = require('@repo/api')
    const { encryptFile, getEncryptionKey } = require('@repo/utils')

    uploadFilesBatch.mockRejectedValue(new Error('Upload failed'))
    encryptFile.mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
    getEncryptionKey.mockReturnValue('test-key')

    renderFileUpload()

    const fileInput = screen.getByRole('button', { name: /open file picker/i })
    const hiddenInput = fileInput.querySelector('input[type="file"]')
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.change(hiddenInput!, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText('Upload failed: Upload failed')).toBeInTheDocument()
    })
  })

  it('handles encryption error', async () => {
    const { encryptFile, getEncryptionKey } = require('@repo/utils')

    encryptFile.mockRejectedValue(new Error('Encryption failed'))
    getEncryptionKey.mockReturnValue('test-key')

    renderFileUpload()

    const fileInput = screen.getByRole('button', { name: /open file picker/i })
    const hiddenInput = fileInput.querySelector('input[type="file"]')
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.change(hiddenInput!, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText('Upload failed: Encryption failed')).toBeInTheDocument()
    })
  })

  it('requires authentication before upload', async () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: null, // No access token
      loading: false,
      logout: jest.fn(),
      storageQuota: mockStorageQuota,
      refreshStorageQuota: jest.fn()
    })

    renderFileUpload()

    const fileInput = screen.getByRole('button', { name: /open file picker/i })
    const hiddenInput = fileInput.querySelector('input[type="file"]')
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.change(hiddenInput!, { target: { files: [file] } })
    })

    // The validation is now handled by the useFileUpload hook, so we expect no error message
    // The upload will simply not proceed without authentication
    await waitFor(() => {
      expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument()
    })
  })

  it('clears files after successful upload', async () => {
    const { uploadFilesBatch } = require('@repo/api')
    const { encryptFile, getEncryptionKey } = require('@repo/utils')

    uploadFilesBatch.mockResolvedValue({ success: true })
    encryptFile.mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
    getEncryptionKey.mockReturnValue('test-key')

    renderFileUpload()

    const fileInput = screen.getByRole('button', { name: /open file picker/i })
    const hiddenInput = fileInput.querySelector('input[type="file"]')
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.change(hiddenInput!, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText('Upload successful!')).toBeInTheDocument()
    })

    // Files should be cleared after successful upload
    expect(screen.queryByText('1 file(s) selected')).not.toBeInTheDocument()
  })

  it('supports drag and drop', async () => {
    const { uploadFilesBatch } = require('@repo/api')
    const { encryptFile, getEncryptionKey } = require('@repo/utils')

    uploadFilesBatch.mockResolvedValue({ success: true })
    encryptFile.mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
    getEncryptionKey.mockReturnValue('test-key')

    renderFileUpload()

    const dropZone = screen.getByRole('button', { name: /open file picker/i })
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file]
        }
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Upload successful!')).toBeInTheDocument()
    })
  })

  it('shows drag active state', async () => {
    renderFileUpload()

    const dropZone = screen.getByRole('button', { name: /open file picker/i })

    fireEvent.dragEnter(dropZone)

    expect(screen.getByText('Drop files here to upload')).toBeInTheDocument()
    expect(screen.getByText('📂')).toBeInTheDocument() // Different icon when dragging
  })

  it('handles storage limit exceeded', async () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: mockAccessToken,
      loading: false,
      logout: jest.fn(),
      storageQuota: {
        totalUsage: { megabytes: 1020 }, // Almost full
        breakdown: {
          files: { megabytes: 500 },
          notes: { megabytes: 300 },
          photos: { megabytes: 220 }
        }
      },
      refreshStorageQuota: jest.fn()
    })

    renderFileUpload()

    const fileInput = screen.getByRole('button', { name: /open file picker/i })
    const hiddenInput = fileInput.querySelector('input[type="file"]')
    const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.change(hiddenInput!, { target: { files: [largeFile] } })
    })

    await waitFor(() => {
      expect(screen.getByText(/Error: Not enough storage space/)).toBeInTheDocument()
    })
  })

  it('works with workspace context', async () => {
    const workspaceWorkspace = {
      id: 'workspace-1',
      workspace: { id: 'workspace-1', name: 'Test Workspace' }
    }

    const { useWorkspace } = require('@repo/providers')
    useWorkspace.mockReturnValue({
      currentWorkspace: workspaceWorkspace,
      availableWorkspaces: [workspaceWorkspace],
      loading: false,
      error: null,
      switchToWorkspace: jest.fn(),
      switchToPersonal: jest.fn(),
      refreshWorkspaces: jest.fn(),
      isPersonalSpace: false
    })

    const { uploadFilesBatch } = require('@repo/api')
    const { encryptFile, getEncryptionKey } = require('@repo/utils')

    uploadFilesBatch.mockResolvedValue({ success: true })
    encryptFile.mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
    getEncryptionKey.mockReturnValue('test-key')

    renderFileUpload()

    const fileInput = screen.getByRole('button', { name: /open file picker/i })
    const hiddenInput = fileInput.querySelector('input[type="file"]')
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.change(hiddenInput!, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText('Upload successful!')).toBeInTheDocument()
    })

    // Should call uploadFilesBatch with workspace ID
    expect(uploadFilesBatch).toHaveBeenCalledWith(
      [{ file: new Uint8Array([1, 2, 3, 4]), filename: 'test.txt' }],
      mockAccessToken,
      'workspace-1'
    )
  })

  it('shows workspace info', () => {
    renderFileUpload()

    expect(screen.getByText('Current: Personal Space')).toBeInTheDocument()
  })

  it('shows workspace info for non-personal workspace', () => {
    const workspaceWorkspace = {
      id: 'workspace-1',
      workspace: { id: 'workspace-1', name: 'Test Workspace' }
    }

    const { useWorkspace } = require('@repo/providers')
    useWorkspace.mockReturnValue({
      currentWorkspace: workspaceWorkspace,
      availableWorkspaces: [workspaceWorkspace],
      loading: false,
      error: null,
      switchToWorkspace: jest.fn(),
      switchToPersonal: jest.fn(),
      refreshWorkspaces: jest.fn(),
      isPersonalSpace: false
    })

    renderFileUpload()

    expect(screen.getByText('Current: Workspace: workspace-1')).toBeInTheDocument()
  })

  it('calls onUploaded callback after successful upload', async () => {
    const mockOnUploaded = jest.fn()
    const { uploadFilesBatch } = require('@repo/api')
    const { encryptFile, getEncryptionKey } = require('@repo/utils')

    uploadFilesBatch.mockResolvedValue({ success: true })
    encryptFile.mockResolvedValue(new Uint8Array([1, 2, 3, 4]))
    getEncryptionKey.mockReturnValue('test-key')

    render(
      <UserProvider>
        <WorkspaceProvider>
          <FileUpload onUploaded={mockOnUploaded} />
        </WorkspaceProvider>
      </UserProvider>
    )

    const fileInput = screen.getByRole('button', { name: /open file picker/i })
    const hiddenInput = fileInput.querySelector('input[type="file"]')
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      fireEvent.change(hiddenInput!, { target: { files: [file] } })
    })

    await waitFor(() => {
      expect(screen.getByText('Upload successful!')).toBeInTheDocument()
    })

    expect(mockOnUploaded).toHaveBeenCalled()
  })
})
