import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AppSidebar } from '../components/app-sidebar'
import { UserProvider, WorkspaceProvider } from '@repo/contexts'
import { SidebarProvider } from '@repo/ui/components/base/sidebar'

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

// Mock useSidebar to provide a selectedNote
jest.mock('@repo/ui/components/base/sidebar', () => {
  const actual = jest.requireActual('@repo/ui/components/base/sidebar')
  return {
    ...actual,
    useSidebar: () => ({ selectedNote: 'note1' })
  }
})

// Mock listNotes to control notes fetching
jest.mock('@repo/api', () => ({
  ...jest.requireActual('@repo/api'),
  listNotes: jest.fn().mockResolvedValue([])
}))

import { listNotes } from '@repo/api'

describe('AppSidebar', () => {
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
  })

  function renderSidebar() {
    return render(
      <UserProvider>
        <WorkspaceProvider>
          <SidebarProvider>
            <AppSidebar />
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
    ;(listNotes as jest.Mock).mockResolvedValue([])
    await act(async () => {
      renderSidebar()
    })
    expect(
      screen.getByText('Notes', { selector: 'span.text-base.font-semibold' })
    ).toBeInTheDocument()
  })

  it('shows loading state', async () => {
    setupMocks('test-token', { id: 'personal', name: 'Personal Space', type: 'personal' })
    let resolve: (notes: string[]) => void
    ;(listNotes as jest.Mock).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r
        })
    )
    await act(async () => {
      renderSidebar()
    })
    // Check for skeleton elements using data-slot attribute
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons).toHaveLength(3) // There should be 3 skeleton elements
    // Resolve the promise to finish loading
    await act(async () => {
      resolve!([])
    })
    await waitFor(() => expect(screen.queryAllByTestId('skeleton')).toHaveLength(0))
  })

  it('shows error state', async () => {
    setupMocks('test-token', { id: 'personal', name: 'Personal Space', type: 'personal' })
    ;(listNotes as jest.Mock).mockRejectedValue(new Error('Failed to fetch'))
    await act(async () => {
      renderSidebar()
    })
    await waitFor(() => expect(screen.getByText('Failed to fetch')).toBeInTheDocument())
  })

  it('renders notes list and highlights selected note', async () => {
    setupMocks('test-token', { id: 'personal', name: 'Personal Space', type: 'personal' })
    ;(listNotes as jest.Mock).mockResolvedValue(['note1', 'note2'])
    await act(async () => {
      renderSidebar()
    })
    await waitFor(() => expect(screen.getByText('note1')).toBeInTheDocument())
    expect(screen.getByText('note2')).toBeInTheDocument()
    // Selected note should have special class
    const selected = screen.getByText('note1').closest('button, a, div')
    expect(selected?.className).toMatch(/bg-primary/)
  })

  it('renders settings link', async () => {
    setupMocks('test-token', { id: 'personal', name: 'Personal Space', type: 'personal' })
    ;(listNotes as jest.Mock).mockResolvedValue([])
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
