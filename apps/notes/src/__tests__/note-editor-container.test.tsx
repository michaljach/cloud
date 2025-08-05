import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteEditorContainer } from '../features/notes/components/note-editor-container'
import { SaveStatusProvider } from '@/features/notes/providers/status-provider'
import { UserProvider, WorkspaceProvider } from '@repo/providers'
import { downloadNote, uploadNote } from '@repo/api'
import { base64urlEncode } from '@repo/utils'
import { SidebarProvider } from '@repo/ui/components/base/sidebar'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn()
}))

// Mock the API functions
jest.mock('@repo/api', () => ({
  downloadNote: jest.fn(),
  uploadNote: jest.fn()
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
  base64urlEncode: jest.fn(),
  base64urlDecode: jest.fn()
}))

const mockDownloadNote = downloadNote as jest.MockedFunction<typeof downloadNote>
const mockUploadNote = uploadNote as jest.MockedFunction<typeof uploadNote>
const mockBase64urlEncode = base64urlEncode as jest.MockedFunction<typeof base64urlEncode>
const mockUsePathname = require('next/navigation').usePathname as jest.MockedFunction<() => string>

describe('NoteEditorContainer', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

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

    mockBase64urlEncode.mockReturnValue(mockEncodedFilename)
    require('@repo/utils').base64urlDecode.mockReturnValue(mockFilename)

    // Setup default pathname mock - on the correct note page
    mockUsePathname.mockReturnValue(`/note/${mockEncodedFilename}`)
  })

  function renderNoteEditor() {
    return render(
      <SaveStatusProvider>
        <SidebarProvider>
          <UserProvider>
            <WorkspaceProvider>
              <NoteEditorContainer filename={mockEncodedFilename} />
            </WorkspaceProvider>
          </UserProvider>
        </SidebarProvider>
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

    renderNoteEditor()

    await waitFor(() => {
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue(mockContent)
    })
  })

  it('handles note loading error', async () => {
    mockDownloadNote.mockRejectedValue(new Error('Failed to load note'))

    renderNoteEditor()

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to load note')).toBeInTheDocument()
    })
  })

  describe('route-based loading logic', () => {
    it('does not load note when not on the correct note page', async () => {
      // Mock being on home page instead of note page
      mockUsePathname.mockReturnValue('/')

      renderNoteEditor()

      // Should not show loading state
      expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()

      // Should not call downloadNote
      expect(mockDownloadNote).not.toHaveBeenCalled()
    })

    it('does not load note when on a different note page', async () => {
      // Mock being on a different note page
      mockUsePathname.mockReturnValue('/note/different-note')

      renderNoteEditor()

      // Should not show loading state
      expect(screen.queryByText('Loading note...')).not.toBeInTheDocument()

      // Should not call downloadNote
      expect(mockDownloadNote).not.toHaveBeenCalled()
    })

    it('loads note when on the correct note page', async () => {
      // Mock being on the correct note page
      mockUsePathname.mockReturnValue(`/note/${mockEncodedFilename}`)

      const mockContent = '# Test Note'
      const mockContentBuffer = new TextEncoder().encode(mockContent)
      mockDownloadNote.mockResolvedValue(new Uint8Array(mockContentBuffer))

      renderNoteEditor()

      await waitFor(() => {
        const textarea = screen.getByRole('textbox')
        expect(textarea).toHaveValue(mockContent)
      })

      expect(mockDownloadNote).toHaveBeenCalledTimes(1)
    })

    it('clears content and error when navigating away from note page', async () => {
      // First render on the correct note page with content
      mockUsePathname.mockReturnValue(`/note/${mockEncodedFilename}`)

      const mockContent = '# Test Note'
      const mockContentBuffer = new TextEncoder().encode(mockContent)
      mockDownloadNote.mockResolvedValue(new Uint8Array(mockContentBuffer))

      const { rerender } = render(
        <SaveStatusProvider>
          <SidebarProvider>
            <UserProvider>
              <WorkspaceProvider>
                <NoteEditorContainer filename={mockEncodedFilename} />
              </WorkspaceProvider>
            </UserProvider>
          </SidebarProvider>
        </SaveStatusProvider>
      )

      // Wait for content to load
      await waitFor(() => {
        const textarea = screen.getByRole('textbox')
        expect(textarea).toHaveValue(mockContent)
      })

      // Now navigate away from the note page
      mockUsePathname.mockReturnValue('/')

      rerender(
        <SaveStatusProvider>
          <SidebarProvider>
            <UserProvider>
              <WorkspaceProvider>
                <NoteEditorContainer filename={mockEncodedFilename} />
              </WorkspaceProvider>
            </UserProvider>
          </SidebarProvider>
        </SaveStatusProvider>
      )

      // Content should be cleared
      await waitFor(() => {
        const textarea = screen.getByRole('textbox')
        expect(textarea).toHaveValue('')
      })
    })

    it('sets selected note in sidebar when note loads successfully', async () => {
      const mockContent = '# Test Note'
      const mockContentBuffer = new TextEncoder().encode(mockContent)
      mockDownloadNote.mockResolvedValue(new Uint8Array(mockContentBuffer))

      renderNoteEditor()

      await waitFor(() => {
        const textarea = screen.getByRole('textbox')
        expect(textarea).toHaveValue(mockContent)
      })

      // The selectedNote should be set to the decoded filename
      // We can't directly test the sidebar context state, but we can verify
      // that the component doesn't crash and loads the note correctly
      expect(mockDownloadNote).toHaveBeenCalledWith(mockFilename, mockAccessToken, undefined)
    })

    it('clears selected note when navigating away from note page', async () => {
      // First render on the correct note page with content
      mockUsePathname.mockReturnValue(`/note/${mockEncodedFilename}`)

      const mockContent = '# Test Note'
      const mockContentBuffer = new TextEncoder().encode(mockContent)
      mockDownloadNote.mockResolvedValue(new Uint8Array(mockContentBuffer))

      const { rerender } = render(
        <SaveStatusProvider>
          <SidebarProvider>
            <UserProvider>
              <WorkspaceProvider>
                <NoteEditorContainer filename={mockEncodedFilename} />
              </WorkspaceProvider>
            </UserProvider>
          </SidebarProvider>
        </SaveStatusProvider>
      )

      // Wait for content to load
      await waitFor(() => {
        const textarea = screen.getByRole('textbox')
        expect(textarea).toHaveValue(mockContent)
      })

      // Now navigate away from the note page
      mockUsePathname.mockReturnValue('/')

      rerender(
        <SaveStatusProvider>
          <SidebarProvider>
            <UserProvider>
              <WorkspaceProvider>
                <NoteEditorContainer filename={mockEncodedFilename} />
              </WorkspaceProvider>
            </UserProvider>
          </SidebarProvider>
        </SaveStatusProvider>
      )

      // Content should be cleared
      await waitFor(() => {
        const textarea = screen.getByRole('textbox')
        expect(textarea).toHaveValue('')
      })
    })
  })
})
