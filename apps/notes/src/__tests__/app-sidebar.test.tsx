import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AppSidebar } from '../components/app-sidebar'
import { UserProvider } from '@repo/auth'
import { SidebarProvider } from '@repo/ui/components/base/sidebar'

// Mock useUser to provide a fake accessToken
jest.mock('@repo/auth', () => ({
  ...jest.requireActual('@repo/auth'),
  useUser: () => ({ accessToken: 'test-token' }),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock useSidebar to provide a selectedNote
jest.mock('@repo/ui/components/base/sidebar', () => {
  const actual = jest.requireActual('@repo/ui/components/base/sidebar')
  return {
    ...actual,
    useSidebar: () => ({ selectedNote: 'note1' })
  }
})

// Mock listUserNotes to control notes fetching
jest.mock('@repo/api', () => ({
  ...jest.requireActual('@repo/api'),
  listUserNotes: jest.fn()
}))

import { listUserNotes } from '@repo/api'

describe('AppSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderSidebar() {
    return render(
      <UserProvider>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </UserProvider>
    )
  }

  it('renders without crashing', async () => {
    ;(listUserNotes as jest.Mock).mockResolvedValue([])
    await act(async () => {
      renderSidebar()
    })
    expect(screen.getByText('Acme Inc.')).toBeInTheDocument()
    expect(screen.getByText('Notes')).toBeInTheDocument()
  })

  it('shows loading state', async () => {
    let resolve: (notes: string[]) => void
    ;(listUserNotes as jest.Mock).mockImplementation(
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
    ;(listUserNotes as jest.Mock).mockRejectedValue(new Error('Failed to fetch'))
    await act(async () => {
      renderSidebar()
    })
    await waitFor(() => expect(screen.getByText('Failed to fetch')).toBeInTheDocument())
  })

  it('renders notes list and highlights selected note', async () => {
    ;(listUserNotes as jest.Mock).mockResolvedValue(['note1', 'note2'])
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
    ;(listUserNotes as jest.Mock).mockResolvedValue([])
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
