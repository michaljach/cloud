import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavMain } from '../components/nav-main'
import { UserProvider, WorkspaceProvider } from '@repo/contexts'
import { createEmptyNote } from '@repo/api'
import { base64urlEncode } from '@repo/utils'
import { SidebarProvider } from '@repo/ui/components/base/sidebar'
import { waitForStateUpdates, createControllablePromise } from './test-utils'

// Mock the API functions
jest.mock('@repo/api', () => ({
  createEmptyNote: jest.fn()
}))

// Mock the contexts
jest.mock('@repo/contexts', () => ({
  useUser: jest.fn(),
  useWorkspace: jest.fn(),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock the utils
jest.mock('@repo/utils', () => ({
  base64urlEncode: jest.fn()
}))

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
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

const mockCreateEmptyNote = createEmptyNote as jest.MockedFunction<typeof createEmptyNote>
const mockBase64urlEncode = base64urlEncode as jest.MockedFunction<typeof base64urlEncode>

describe('NavMain', () => {
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
  const mockFilename = 'note-2024-01-15T10-30-45.md'
  const mockEncodedFilename = 'bm90ZS0yMDI0LTAxLTE1VDEwLTMwLTQ1Lm1k'

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    const { useUser, useWorkspace } = require('@repo/contexts')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: mockAccessToken,
      loading: false,
      logout: jest.fn()
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

    mockBase64urlEncode.mockReturnValue(mockEncodedFilename)
  })

  function renderNavMain() {
    return render(
      <UserProvider>
        <WorkspaceProvider>
          <SidebarProvider>
            <NavMain items={[]} onNoteCreated={jest.fn()} />
          </SidebarProvider>
        </WorkspaceProvider>
      </UserProvider>
    )
  }

  it('renders create new note button', () => {
    renderNavMain()

    expect(screen.getByText('Create new note')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create new note/i })).toBeInTheDocument()
  })

  it('creates a new note when button is clicked', async () => {
    mockCreateEmptyNote.mockResolvedValue({ filename: mockFilename })

    renderNavMain()

    const createButton = screen.getByRole('button', { name: /create new note/i })

    await act(async () => {
      await userEvent.click(createButton)
    })

    expect(mockCreateEmptyNote).toHaveBeenCalledWith(mockAccessToken, undefined)
  })

  it('shows loading state while creating note', async () => {
    const { promise: createPromise, resolve: resolveCreate } = createControllablePromise<{
      filename: string
    }>()
    mockCreateEmptyNote.mockReturnValue(createPromise)

    renderNavMain()

    const createButton = screen.getByRole('button', { name: /create new note/i })

    await act(async () => {
      await userEvent.click(createButton)
    })

    // Should show loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(createButton).toBeDisabled()

    // Resolve the promise and wait for all updates to complete
    resolveCreate!({ filename: mockFilename })
    await waitForStateUpdates()

    await waitFor(() => {
      expect(screen.getByText('Create new note')).toBeInTheDocument()
    })
  })

  it('navigates to new note after creation', async () => {
    mockCreateEmptyNote.mockResolvedValue({ filename: mockFilename })

    renderNavMain()

    const createButton = screen.getByRole('button', { name: /create new note/i })

    await act(async () => {
      await userEvent.click(createButton)
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/note/${mockEncodedFilename}`)
    })
  })

  it('calls onNoteCreated callback after successful creation', async () => {
    const mockOnNoteCreated = jest.fn()
    mockCreateEmptyNote.mockResolvedValue({ filename: mockFilename })

    render(
      <UserProvider>
        <WorkspaceProvider>
          <SidebarProvider>
            <NavMain items={[]} onNoteCreated={mockOnNoteCreated} />
          </SidebarProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    const createButton = screen.getByRole('button', { name: /create new note/i })

    await act(async () => {
      await userEvent.click(createButton)
    })

    await waitFor(() => {
      expect(mockOnNoteCreated).toHaveBeenCalled()
    })
  })

  it('handles creation errors gracefully', async () => {
    mockCreateEmptyNote.mockRejectedValue(new Error('Failed to create note'))

    const { toast } = require('sonner')

    renderNavMain()

    const createButton = screen.getByRole('button', { name: /create new note/i })

    await act(async () => {
      await userEvent.click(createButton)
    })

    // Should show error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create note')
    })

    // Button should be re-enabled
    await waitFor(() => {
      expect(screen.getByText('Create new note')).toBeInTheDocument()
      expect(createButton).not.toBeDisabled()
    })
  })

  it('works with workspace context', async () => {
    const workspaceWorkspace = {
      id: 'workspace-1',
      workspace: { id: 'workspace-1', name: 'Test Workspace' }
    }

    const { useWorkspace } = require('@repo/contexts')
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

    mockCreateEmptyNote.mockResolvedValue({ filename: mockFilename })

    renderNavMain()

    const createButton = screen.getByRole('button', { name: /create new note/i })

    await act(async () => {
      await userEvent.click(createButton)
    })

    expect(mockCreateEmptyNote).toHaveBeenCalledWith(mockAccessToken, 'workspace-1')
  })

  it('does not create note when no access token', async () => {
    const { useUser } = require('@repo/contexts')
    useUser.mockReturnValue({
      user: mockUser,
      accessToken: null,
      loading: false,
      logout: jest.fn()
    })

    renderNavMain()

    const createButton = screen.getByRole('button', { name: /create new note/i })

    await act(async () => {
      await userEvent.click(createButton)
    })

    expect(mockCreateEmptyNote).not.toHaveBeenCalled()
  })

  it('does not create note when no workspace', async () => {
    const { useWorkspace } = require('@repo/contexts')
    useWorkspace.mockReturnValue({
      currentWorkspace: null,
      availableWorkspaces: [],
      loading: false,
      error: null,
      switchToWorkspace: jest.fn(),
      switchToPersonal: jest.fn(),
      refreshWorkspaces: jest.fn(),
      isPersonalSpace: true
    })

    renderNavMain()

    const createButton = screen.getByRole('button', { name: /create new note/i })

    await act(async () => {
      await userEvent.click(createButton)
    })

    expect(mockCreateEmptyNote).not.toHaveBeenCalled()
  })

  it('prevents multiple simultaneous creation requests', async () => {
    const { promise: createPromise, resolve: resolveCreate } = createControllablePromise<{
      filename: string
    }>()
    mockCreateEmptyNote.mockReturnValue(createPromise)

    renderNavMain()

    const createButton = screen.getByRole('button', { name: /create new note/i })

    // Click multiple times
    await act(async () => {
      await userEvent.click(createButton)
      await userEvent.click(createButton)
      await userEvent.click(createButton)
    })

    // Should only be called once
    expect(mockCreateEmptyNote).toHaveBeenCalledTimes(1)

    // Resolve the promise and wait for all updates to complete
    resolveCreate!({ filename: mockFilename })
    await waitForStateUpdates()
  })
})
