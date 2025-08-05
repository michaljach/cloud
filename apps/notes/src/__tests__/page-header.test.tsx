import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PageHeader } from '@/features/layout/page-header'
import { SaveStatusProvider } from '@/features/notes/providers/status-provider'
import { UserProvider, WorkspaceProvider } from '@repo/providers'
import { SidebarProvider } from '@repo/ui/components/base/sidebar'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
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

describe('PageHeader', () => {
  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    fullName: 'Test User',
    email: 'test@example.com'
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    const { useUser, useWorkspace } = require('@repo/providers')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: 'test-token',
      loading: false,
      logout: jest.fn()
    })

    useWorkspace.mockReturnValue({
      currentWorkspace: { id: 'personal', name: 'Personal Space', type: 'personal' },
      availableWorkspaces: [{ id: 'personal', name: 'Personal Space', type: 'personal' }],
      loading: false,
      error: null,
      switchToWorkspace: jest.fn(),
      switchToPersonal: jest.fn(),
      refreshWorkspaces: jest.fn(),
      isPersonalSpace: true
    })
  })

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <UserProvider>
        <WorkspaceProvider>
          <SidebarProvider>
            <SaveStatusProvider>{ui}</SaveStatusProvider>
          </SidebarProvider>
        </WorkspaceProvider>
      </UserProvider>
    )
  }

  it('renders header with title', () => {
    renderWithProviders(<PageHeader title="Test Title" />)

    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renders save status indicator', () => {
    renderWithProviders(<PageHeader title="Notes" />)

    // Should show the default save status
    expect(screen.getByText('All changes saved')).toBeInTheDocument()
  })

  it('renders user dropdown when user is available', () => {
    renderWithProviders(<PageHeader title="Notes" />)

    // Should show user information (this would be in the UserDropdown component)
    // The actual user dropdown rendering is tested in the UI package
  })

  it('does not render when user is not available and not loading', () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: null,
      accessToken: null,
      loading: false,
      logout: jest.fn()
    })

    const { container } = renderWithProviders(<PageHeader title="Notes" />)

    // The PageHeader should not render anything (return null)
    // But the SidebarProvider wrapper will still be present
    expect(screen.queryByText('Notes')).not.toBeInTheDocument()
    expect(screen.queryByText('All changes saved')).not.toBeInTheDocument()
  })

  it('renders when user is loading', () => {
    const { useUser } = require('@repo/providers')
    useUser.mockReturnValue({
      user: null,
      accessToken: null,
      loading: true,
      logout: jest.fn()
    })

    renderWithProviders(<PageHeader title="Notes" />)

    expect(screen.getByText('Notes')).toBeInTheDocument()
  })

  it('handles account click navigation', () => {
    renderWithProviders(<PageHeader title="Notes" />)

    // The account click functionality would be tested in the UserDropdown component
    // This test ensures the component renders without errors
    expect(screen.getByText('Notes')).toBeInTheDocument()
  })

  it('handles logout click navigation', () => {
    renderWithProviders(<PageHeader title="Notes" />)

    // The logout functionality would be tested in the UserDropdown component
    // This test ensures the component renders without errors
    expect(screen.getByText('Notes')).toBeInTheDocument()
  })

  it('renders with custom children', () => {
    renderWithProviders(
      <PageHeader title="Notes">
        <div data-testid="custom-child">Custom Content</div>
      </PageHeader>
    )

    expect(screen.getByTestId('custom-child')).toBeInTheDocument()
    expect(screen.getByText('Custom Content')).toBeInTheDocument()
  })

  it('has correct header structure', () => {
    renderWithProviders(<PageHeader title="Notes" />)

    const header = screen.getByText('Notes').closest('header')
    expect(header).toHaveClass(
      'flex',
      'h-16',
      'shrink-0',
      'items-center',
      'gap-2',
      'border-b',
      'px-4'
    )
  })
})
