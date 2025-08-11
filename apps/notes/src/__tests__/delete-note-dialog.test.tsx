import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteNoteDialog } from '@/features/notes/dialogs/delete-note-dialog'
import { NotesProvider } from '@/features/notes/providers/notes-provider'
import { UserProvider, WorkspaceProvider } from '@repo/providers'

// Mock the API functions
jest.mock('@repo/api', () => ({
  deleteNote: jest.fn()
}))

// Mock the contexts
jest.mock('@repo/providers', () => ({
  useUser: jest.fn(),
  useWorkspace: jest.fn(),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

const mockDeleteNote = require('@repo/api').deleteNote as jest.MockedFunction<any>

describe('DeleteNoteDialog', () => {
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

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    const { useUser, useWorkspace } = require('@repo/providers')
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

    mockDeleteNote.mockResolvedValue({ filename: 'test-note.md' })
  })

  function renderDeleteDialog() {
    return render(
      <UserProvider>
        <WorkspaceProvider>
          <NotesProvider>
            <DeleteNoteDialog filename="test-note.md" title="Test Note" onDeleted={jest.fn()} />
          </NotesProvider>
        </WorkspaceProvider>
      </UserProvider>
    )
  }

  it('renders delete button', () => {
    renderDeleteDialog()
    expect(screen.getByRole('button', { name: /delete note/i })).toBeInTheDocument()
  })

  it('opens dialog when delete button is clicked', async () => {
    const user = userEvent.setup()
    renderDeleteDialog()

    const deleteButton = screen.getByRole('button', { name: /delete note/i })
    await user.click(deleteButton)

    expect(screen.getByText('Delete Note')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete "Test Note"/)).toBeInTheDocument()
  })

  it('shows confirmation dialog with correct note title', async () => {
    const user = userEvent.setup()
    renderDeleteDialog()

    const deleteButton = screen.getByRole('button', { name: /delete note/i })
    await user.click(deleteButton)

    expect(screen.getByText('Delete Note')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete "Test Note"/)).toBeInTheDocument()
  })

  it('calls deleteNoteFile when delete is confirmed', async () => {
    const user = userEvent.setup()
    const onDeleted = jest.fn()

    render(
      <UserProvider>
        <WorkspaceProvider>
          <NotesProvider>
            <DeleteNoteDialog filename="test-note.md" title="Test Note" onDeleted={onDeleted} />
          </NotesProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    const deleteButton = screen.getByRole('button', { name: /delete note/i })
    await user.click(deleteButton)

    const confirmDeleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(confirmDeleteButton)

    await waitFor(() => {
      expect(mockDeleteNote).toHaveBeenCalledWith('test-note.md', mockAccessToken, undefined)
    })
  })

  it('shows success toast when deletion succeeds', async () => {
    const user = userEvent.setup()
    const { toast } = require('sonner')

    renderDeleteDialog()

    const deleteButton = screen.getByRole('button', { name: /delete note/i })
    await user.click(deleteButton)

    const confirmDeleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(confirmDeleteButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Note deleted successfully')
    })
  })

  it('shows error toast when deletion fails', async () => {
    const user = userEvent.setup()
    const { toast } = require('sonner')

    mockDeleteNote.mockRejectedValue(new Error('Delete failed'))

    renderDeleteDialog()

    const deleteButton = screen.getByRole('button', { name: /delete note/i })
    await user.click(deleteButton)

    const confirmDeleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(confirmDeleteButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Delete failed')
    })
  })

  it('closes dialog after successful deletion', async () => {
    const user = userEvent.setup()
    renderDeleteDialog()

    const deleteButton = screen.getByRole('button', { name: /delete note/i })
    await user.click(deleteButton)

    const confirmDeleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(confirmDeleteButton)

    await waitFor(() => {
      expect(screen.queryByText('Delete Note')).not.toBeInTheDocument()
    })
  })

  it('calls onDeleted callback after successful deletion', async () => {
    const user = userEvent.setup()
    const onDeleted = jest.fn()

    render(
      <UserProvider>
        <WorkspaceProvider>
          <NotesProvider>
            <DeleteNoteDialog filename="test-note.md" title="Test Note" onDeleted={onDeleted} />
          </NotesProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    const deleteButton = screen.getByRole('button', { name: /delete note/i })
    await user.click(deleteButton)

    const confirmDeleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(confirmDeleteButton)

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalled()
    })
  })

  it('disables buttons during deletion', async () => {
    const user = userEvent.setup()
    renderDeleteDialog()

    const deleteButton = screen.getByRole('button', { name: /delete note/i })
    await user.click(deleteButton)

    const confirmDeleteButton = screen.getByRole('button', { name: /delete/i })
    const cancelButton = screen.getByRole('button', { name: /cancel/i })

    // Mock a slow deletion to test the disabled state
    mockDeleteNote.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

    await user.click(confirmDeleteButton)

    // Check that buttons are disabled during deletion
    expect(confirmDeleteButton).toHaveTextContent('Deleting...')
    expect(confirmDeleteButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()
  })
})
