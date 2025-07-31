import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteEditorContainer } from '../components/note-editor-container'
import { SaveStatusProvider } from '../components/save-status-context'
import { UserProvider, WorkspaceProvider } from '@repo/contexts'
import { downloadNote, uploadNote } from '@repo/api'
import { base64urlEncode } from '@repo/utils'

// Mock the API functions
jest.mock('@repo/api', () => ({
  downloadNote: jest.fn(),
  uploadNote: jest.fn()
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
  base64urlEncode: jest.fn(),
  base64urlDecode: jest.fn()
}))

const mockDownloadNote = downloadNote as jest.MockedFunction<typeof downloadNote>
const mockUploadNote = uploadNote as jest.MockedFunction<typeof uploadNote>
const mockBase64urlEncode = base64urlEncode as jest.MockedFunction<typeof base64urlEncode>

describe('NoteEditorContainer', () => {
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
  const mockFilename = 'test-note.md'
  const mockEncodedFilename = 'dGVzdC1ub3RlLm1k'

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
    require('@repo/utils').base64urlDecode.mockReturnValue(mockFilename)
  })

  function renderNoteEditor() {
    return render(
      <SaveStatusProvider>
        <UserProvider>
          <WorkspaceProvider>
            <NoteEditorContainer filename={mockEncodedFilename} />
          </WorkspaceProvider>
        </UserProvider>
      </SaveStatusProvider>
    )
  }

  it('renders loading state initially', () => {
    mockDownloadNote.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderNoteEditor()

    expect(screen.getByText('Loading note...')).toBeInTheDocument()
  })

  it('loads and displays note content', async () => {
    const mockContent = '# Test Note\n\nThis is test content.'
    const mockContentBuffer = new TextEncoder().encode(mockContent)
    mockDownloadNote.mockResolvedValue(new Uint8Array(mockContentBuffer))

    await act(async () => {
      renderNoteEditor()
    })

    await waitFor(() => {
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue(mockContent)
    })
  })

  it('handles note loading error', async () => {
    mockDownloadNote.mockRejectedValue(new Error('Failed to load note'))

    await act(async () => {
      renderNoteEditor()
    })

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load note')).toBeInTheDocument()
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

    const mockContent = '# Test Note'
    const mockContentBuffer = new TextEncoder().encode(mockContent)
    mockDownloadNote.mockResolvedValue(new Uint8Array(mockContentBuffer))
    mockUploadNote.mockResolvedValue({ filename: mockFilename })

    await act(async () => {
      renderNoteEditor()
    })

    await waitFor(() => {
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue(mockContent)
    })

    const textarea = screen.getByRole('textbox')

    // Type to trigger save
    await act(async () => {
      await userEvent.type(textarea, ' updated')
    })

    // Wait for save
    await waitFor(
      () => {
        expect(mockUploadNote).toHaveBeenCalledTimes(1)
        const firstArg = mockUploadNote.mock.calls[0]?.[0]
        expect(firstArg).toBeDefined()
        expect(ArrayBuffer.isView(firstArg!)).toBe(true)
        expect(firstArg!.constructor.name).toBe('Uint8Array')
      },
      { timeout: 2000 }
    )
  })
})
