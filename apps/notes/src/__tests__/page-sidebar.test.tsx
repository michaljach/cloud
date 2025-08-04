import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { PageSidebar } from '../components/layout/page-sidebar'
import { UserProvider, WorkspaceProvider } from '@repo/contexts'
import { SidebarProvider } from '@repo/ui/components/base/sidebar'

// Mock Next.js router
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

// Mock useUser and useWorkspace to provide fake data
jest.mock('@repo/contexts', () => {
  const mockUseUser = jest.fn()
  const mockUseWorkspace = jest.fn()

  return {
    ...jest.requireActual('@repo/contexts'),
    useUser: mockUseUser,
    useWorkspace: mockUseWorkspace,
    UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    __mockUseUser: mockUseUser,
    __mockUseWorkspace: mockUseWorkspace
  }
})

// Mock useNotes context
jest.mock('@/providers/notes-provider', () => ({
  useNotes: jest.fn(),
  NotesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock listNotes to control notes fetching
jest.mock('@repo/api', () => ({
  ...jest.requireActual('@repo/api'),
  listNotes: jest.fn().mockResolvedValue([])
}))

import { useNotes } from '@/providers/notes-provider'

describe('PageSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set default mocks
    const authModule = require('@repo/contexts')
    authModule.__mockUseUser.mockReturnValue({ accessToken: null })
    authModule.__mockUseWorkspace.mockReturnValue({
      currentWorkspace: null,
      availableWorkspaces: [],
      loading: false,
      error: null,
      switchToWorkspace: jest.fn(),
      switchToPersonal: jest.fn(),
      refreshWorkspaces: jest.fn(),
      isPersonalSpace: true
    })

    // Set default useNotes mock
    ;(useNotes as jest.Mock).mockReturnValue({
      notes: [],
      loading: false,
      error: null,
      refreshNotes: jest.fn()
    })
  })

  function renderSidebar() {
    return render(
      <UserProvider>
        <WorkspaceProvider>
          <SidebarProvider>
            <PageSidebar />
          </SidebarProvider>
        </WorkspaceProvider>
      </UserProvider>
    )
  }

  // Helper to update mocks for different scenarios
  function setupMocks(accessToken: string | null, currentWorkspace: any) {
    const authModule = require('@repo/contexts')
    authModule.__mockUseUser.mockReturnValue({ accessToken })
    authModule.__mockUseWorkspace.mockReturnValue({
      currentWorkspace,
      availableWorkspaces: [],
      loading: false,
      error: null,
      switchToWorkspace: jest.fn(),
      switchToPersonal: jest.fn(),
      refreshWorkspaces: jest.fn(),
      isPersonalSpace: true
    })
  }

  it('renders basic structure', async () => {
    await act(async () => {
      renderSidebar()
    })
    // Look for the specific Notes header text
    expect(
      screen.getByText('Notes', { selector: 'span.text-base.font-semibold' })
    ).toBeInTheDocument()
  })

  it('renders without crashing', async () => {
    setupMocks('test-token', { id: 'personal', name: 'Personal Space', type: 'personal' })
    ;(useNotes as jest.Mock).mockReturnValue({
      notes: [],
      loading: false,
      error: null,
      refreshNotes: jest.fn()
    })
    await act(async () => {
      renderSidebar()
    })
    expect(
      screen.getByText('Notes', { selector: 'span.text-base.font-semibold' })
    ).toBeInTheDocument()
  })

  it('shows loading state', async () => {
    setupMocks('test-token', { id: 'personal', name: 'Personal Space', type: 'personal' })
    ;(useNotes as jest.Mock).mockReturnValue({
      notes: [],
      loading: true,
      error: null,
      refreshNotes: jest.fn()
    })
    await act(async () => {
      renderSidebar()
    })
    // Check for skeleton elements using data-slot attribute
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons).toHaveLength(3) // There should be 3 skeleton elements
  })

  it('shows error state', async () => {
    setupMocks('test-token', { id: 'personal', name: 'Personal Space', type: 'personal' })
    ;(useNotes as jest.Mock).mockReturnValue({
      notes: [],
      loading: false,
      error: 'Failed to fetch',
      refreshNotes: jest.fn()
    })
    await act(async () => {
      renderSidebar()
    })
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
  })

  it('renders notes list', async () => {
    setupMocks('test-token', { id: 'personal', name: 'Personal Space', type: 'personal' })
    ;(useNotes as jest.Mock).mockReturnValue({
      notes: ['note1', 'note2'],
      loading: false,
      error: null,
      refreshNotes: jest.fn()
    })
    await act(async () => {
      renderSidebar()
    })
    expect(screen.getByText('note1')).toBeInTheDocument()
    expect(screen.getByText('note2')).toBeInTheDocument()
  })

  it('renders settings link', async () => {
    setupMocks('test-token', { id: 'personal', name: 'Personal Space', type: 'personal' })
    ;(useNotes as jest.Mock).mockReturnValue({
      notes: [],
      loading: false,
      error: null,
      refreshNotes: jest.fn()
    })
    await act(async () => {
      renderSidebar()
    })
    // Find all sidebar menu buttons by data-sidebar attribute
    const menuButtons = Array.from(document.querySelectorAll('[data-sidebar="menu-button"]'))
    // Find the one that contains 'Settings' and a link to /settings
    const settingsButton = menuButtons.find((btn) => btn.textContent?.includes('Settings'))
    expect(settingsButton).toBeInTheDocument()
  })
})
