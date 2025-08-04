import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { StorageQuota } from '../components/sidebar/storage-quota'
import { UserProvider } from '@repo/contexts'

// Mock the contexts
jest.mock('@repo/contexts', () => ({
  useUser: jest.fn(),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock the API functions
jest.mock('@repo/api', () => ({
  getCurrentUser: jest.fn()
}))

// Mock the utils functions
jest.mock('@repo/utils', () => ({
  formatFileSize: jest.fn((bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`
    return `${Math.round(bytes / (1024 * 1024 * 1024))} GB`
  })
}))

describe('StorageQuota', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default useUser mock
    const { useUser } = require('@repo/contexts')
    useUser.mockReturnValue({
      accessToken: 'test-token',
      refreshStorageQuota: jest.fn()
    })
  })

  it('renders storage information', async () => {
    const mockUserData = {
      storageQuota: {
        totalUsage: {
          bytes: 512 * 1024 * 1024 // 512MB
        }
      }
    }

    const { getCurrentUser } = require('@repo/api')
    getCurrentUser.mockResolvedValue(mockUserData)

    render(
      <UserProvider>
        <StorageQuota />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Storage')).toBeInTheDocument()
      expect(screen.getByText('512 MB / 1 GB')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    render(
      <UserProvider>
        <StorageQuota />
      </UserProvider>
    )

    // Should show loading skeleton
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('displays storage usage percentage', async () => {
    const mockUserData = {
      storageQuota: {
        totalUsage: {
          bytes: 750 * 1024 * 1024 // 750MB (73%)
        }
      }
    }

    const { getCurrentUser } = require('@repo/api')
    getCurrentUser.mockResolvedValue(mockUserData)

    render(
      <UserProvider>
        <StorageQuota />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('73% used')).toBeInTheDocument()
    })
  })

  it('shows available storage', async () => {
    const mockUserData = {
      storageQuota: {
        totalUsage: {
          bytes: 256 * 1024 * 1024 // 256MB
        }
      }
    }

    const { getCurrentUser } = require('@repo/api')
    getCurrentUser.mockResolvedValue(mockUserData)

    render(
      <UserProvider>
        <StorageQuota />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('768 MB available')).toBeInTheDocument()
    })
  })

  it('handles error state', async () => {
    const { getCurrentUser } = require('@repo/api')
    getCurrentUser.mockRejectedValue(new Error('API Error'))

    render(
      <UserProvider>
        <StorageQuota />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Failed to load storage information')).toBeInTheDocument()
    })
  })

  it('renders with custom className', async () => {
    const mockUserData = {
      storageQuota: {
        totalUsage: {
          bytes: 100 * 1024 * 1024
        }
      }
    }

    const { getCurrentUser } = require('@repo/api')
    getCurrentUser.mockResolvedValue(mockUserData)

    render(
      <UserProvider>
        <StorageQuota className="custom-class" />
      </UserProvider>
    )

    await waitFor(() => {
      const container = screen.getByText('Storage').closest('.custom-class')
      expect(container).toBeInTheDocument()
    })
  })

  it('shows critical status for high usage', async () => {
    const highUsageData = {
      storageQuota: {
        totalUsage: {
          bytes: 950 * 1024 * 1024 // 95%
        }
      }
    }

    const { getCurrentUser } = require('@repo/api')
    getCurrentUser.mockResolvedValue(highUsageData)

    render(
      <UserProvider>
        <StorageQuota />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Critical')).toBeInTheDocument()
    })
  })

  it('shows warning status for medium usage', async () => {
    const mediumUsageData = {
      storageQuota: {
        totalUsage: {
          bytes: 800 * 1024 * 1024 // 80%
        }
      }
    }

    const { getCurrentUser } = require('@repo/api')
    getCurrentUser.mockResolvedValue(mediumUsageData)

    render(
      <UserProvider>
        <StorageQuota />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Warning')).toBeInTheDocument()
    })
  })

  it('shows good status for low usage', async () => {
    const lowUsageData = {
      storageQuota: {
        totalUsage: {
          bytes: 200 * 1024 * 1024 // 20%
        }
      }
    }

    const { getCurrentUser } = require('@repo/api')
    getCurrentUser.mockResolvedValue(lowUsageData)

    render(
      <UserProvider>
        <StorageQuota />
      </UserProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Good')).toBeInTheDocument()
    })
  })
})
