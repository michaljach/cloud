import '@testing-library/jest-dom'
import { UserProvider, WorkspaceProvider } from '@repo/providers'
import { StorageQuota } from '@repo/ui/components/storage-quota'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

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

// Mock the utils
jest.mock('@repo/utils', () => ({
  formatFileSize: jest.fn((bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  })
}))

describe('StorageQuota', () => {
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

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    const { useUser, useWorkspace } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      loading: false,
      logout: jest.fn(),
      storageQuota: null,
      error: null
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

  function renderStorageQuota() {
    return render(
      <UserProvider>
        <WorkspaceProvider>
          <StorageQuota />
        </WorkspaceProvider>
      </UserProvider>
    )
  }

  it('renders loading state initially', () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      loading: true,
      logout: jest.fn(),
      storageQuota: null,
      error: null
    })

    renderStorageQuota()

    // Should show skeleton loading state
    expect(screen.getAllByTestId('skeleton')).toHaveLength(5)
  })

  it('renders storage quota when data is available', async () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      loading: false,
      logout: jest.fn(),
      storageQuota: {
        totalUsage: { megabytes: 512 }, // 512 MB
        breakdown: {
          files: { megabytes: 256 },
          notes: { megabytes: 128 },
          photos: { megabytes: 128 }
        }
      },
      error: null
    })

    renderStorageQuota()

    await waitFor(() => {
      expect(screen.getByText('Total Used')).toBeInTheDocument()
      expect(screen.getByText('Files')).toBeInTheDocument()
      expect(screen.getByText('Notes')).toBeInTheDocument()
      expect(screen.getByText('Photos')).toBeInTheDocument()
    })
  })

  it('handles storage quota error', async () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      loading: false,
      logout: jest.fn(),
      storageQuota: null,
      error: 'Failed to load storage info'
    })

    renderStorageQuota()

    await waitFor(() => {
      expect(screen.getByText('Storage Usage')).toBeInTheDocument()
      expect(screen.getByText('Unable to load storage info')).toBeInTheDocument()
    })
  })

  it('shows warning when storage usage is high', async () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      loading: false,
      logout: jest.fn(),
      storageQuota: {
        totalUsage: { megabytes: 900 }, // 90% usage
        breakdown: {
          files: { megabytes: 600 },
          notes: { megabytes: 200 },
          photos: { megabytes: 100 }
        }
      },
      error: null
    })

    renderStorageQuota()

    await waitFor(() => {
      expect(screen.getByText(/Storage usage is high/)).toBeInTheDocument()
      expect(screen.getByText(/87\.9%/)).toBeInTheDocument()
    })
  })

  it('shows critical warning when storage limit is exceeded', async () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      loading: false,
      logout: jest.fn(),
      storageQuota: {
        totalUsage: { megabytes: 1100 }, // 110% usage
        breakdown: {
          files: { megabytes: 700 },
          notes: { megabytes: 250 },
          photos: { megabytes: 150 }
        }
      },
      error: null
    })

    renderStorageQuota()

    await waitFor(() => {
      expect(screen.getByText(/Storage limit exceeded/)).toBeInTheDocument()
      expect(screen.getByText(/107\.4%/)).toBeInTheDocument()
    })
  })

  it('shows normal status when storage usage is low', async () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      loading: false,
      logout: jest.fn(),
      storageQuota: {
        totalUsage: { megabytes: 100 }, // 10% usage
        breakdown: {
          files: { megabytes: 50 },
          notes: { megabytes: 30 },
          photos: { megabytes: 20 }
        }
      },
      error: null
    })

    renderStorageQuota()

    await waitFor(() => {
      expect(screen.getByText('Total Used')).toBeInTheDocument()
      expect(screen.getByText('Files')).toBeInTheDocument()
      expect(screen.getByText('Notes')).toBeInTheDocument()
      expect(screen.getByText('Photos')).toBeInTheDocument()
    })

    // Should not show any warnings
    expect(screen.queryByText(/Storage usage is high/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Storage limit exceeded/)).not.toBeInTheDocument()
  })

  it('formats storage values correctly', async () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      loading: false,
      logout: jest.fn(),
      storageQuota: {
        totalUsage: { megabytes: 512 },
        breakdown: {
          files: { megabytes: 256 },
          notes: { megabytes: 128 },
          photos: { megabytes: 128 }
        }
      },
      error: null
    })

    renderStorageQuota()

    await waitFor(() => {
      expect(screen.getByText('Total Used')).toBeInTheDocument()
    })

    // The formatFileSize function should be called with the correct values
    const { formatFileSize } = require('@repo/utils')
    expect(formatFileSize).toHaveBeenCalledWith(512 * 1024 * 1024) // total usage in bytes
    expect(formatFileSize).toHaveBeenCalledWith(1024 * 1024 * 1024) // storage limit in bytes
  })

  it('handles missing storage quota data', async () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      loading: false,
      logout: jest.fn(),
      storageQuota: null,
      error: null
    })

    renderStorageQuota()

    // Should render nothing when no storage quota data
    expect(screen.queryByText('Storage Usage')).not.toBeInTheDocument()
  })

  it('handles missing user storage limit', async () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: { ...mockUser, storageLimit: null },
      accessToken: 'test-token',
      loading: false,
      logout: jest.fn(),
      storageQuota: {
        totalUsage: { megabytes: 512 },
        breakdown: {
          files: { megabytes: 256 },
          notes: { megabytes: 128 },
          photos: { megabytes: 128 }
        }
      },
      error: null
    })

    renderStorageQuota()

    // Should render nothing when no storage limit
    expect(screen.queryByText('Storage Usage')).not.toBeInTheDocument()
  })

  it('handles zero storage usage', async () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      loading: false,
      logout: jest.fn(),
      storageQuota: {
        totalUsage: { megabytes: 0 },
        breakdown: {
          files: { megabytes: 0 },
          notes: { megabytes: 0 },
          photos: { megabytes: 0 }
        }
      },
      error: null
    })

    renderStorageQuota()

    await waitFor(() => {
      expect(screen.getByText('Total Used')).toBeInTheDocument()
      expect(screen.getByText('Files')).toBeInTheDocument()
      expect(screen.getByText('Notes')).toBeInTheDocument()
      expect(screen.getByText('Photos')).toBeInTheDocument()
    })
  })

  it('handles very small storage usage', async () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      loading: false,
      logout: jest.fn(),
      storageQuota: {
        totalUsage: { megabytes: 1 }, // 1 MB
        breakdown: {
          files: { megabytes: 0.5 },
          notes: { megabytes: 0.3 },
          photos: { megabytes: 0.2 }
        }
      },
      error: null
    })

    renderStorageQuota()

    await waitFor(() => {
      expect(screen.getByText('Total Used')).toBeInTheDocument()
    })
  })

  it('handles large storage usage', async () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: { ...mockUser, storageLimit: 10000 }, // 10GB
      accessToken: 'test-token',
      loading: false,
      logout: jest.fn(),
      storageQuota: {
        totalUsage: { megabytes: 5000 }, // 5GB
        breakdown: {
          files: { megabytes: 3000 },
          notes: { megabytes: 1000 },
          photos: { megabytes: 1000 }
        }
      },
      error: null
    })

    renderStorageQuota()

    await waitFor(() => {
      expect(screen.getByText('Total Used')).toBeInTheDocument()
    })
  })
})
