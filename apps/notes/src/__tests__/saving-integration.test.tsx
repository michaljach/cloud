import '@testing-library/jest-dom'
import { downloadNote, uploadNote, renameNote } from '@repo/api'
import { UserProvider, WorkspaceProvider } from '@repo/providers'
import { SidebarProvider } from '@repo/ui/components/base/sidebar'
import { base64urlDecode } from '@repo/utils'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { NoteEditorContainer } from '../features/notes/components/note-editor-container'

import { NotesProvider } from '@/features/notes/providers/notes-provider'
import { SaveStatusProvider, useSaveStatus } from '@/features/notes/providers/status-provider'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn()
}))

// Mock the API functions
jest.mock('@repo/api', () => ({
  downloadNote: jest.fn(),
  uploadNote: jest.fn(),
  renameNote: jest.fn()
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
const mockRenameNote = renameNote as jest.MockedFunction<typeof renameNote>
const mockUsePathname = require('next/navigation').usePathname as jest.MockedFunction<() => string>
const mockUseRouter = require('next/navigation').useRouter as jest.MockedFunction<() => any>

// Test component to check save status
function SaveStatusChecker() {
  const { saveStatus, saveStatusText } = useSaveStatus()
  return (
    <div data-testid="save-status">
      <span data-testid="status">{saveStatus}</span>
      <span data-testid="status-text">{saveStatusText}</span>
    </div>
  )
}

describe('Saving Integration', () => {
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

    require('@repo/utils').base64urlDecode.mockReturnValue(mockFilename)

    // Setup default pathname mock - on the correct note page
    mockUsePathname.mockReturnValue(`/note/${mockEncodedFilename}`)

    // Setup default router mock
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn()
    })
  })

  function renderWithSaveStatus() {
    return render(
      <SaveStatusProvider>
        <NotesProvider>
          <SidebarProvider>
            <UserProvider>
              <WorkspaceProvider>
                <SaveStatusChecker />
                <NoteEditorContainer filename={mockEncodedFilename} />
              </WorkspaceProvider>
            </UserProvider>
          </SidebarProvider>
        </NotesProvider>
      </SaveStatusProvider>
    )
  }

  it('works with workspace context', async () => {
    const workspaceWorkspace = {
      id: 'workspace-1',
      workspace: { id: 'workspace-1', name: 'Test Workspace' }
    }

    const { useWorkspace } = require('@repo/providers')
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
    mockRenameNote.mockResolvedValue({ filename: mockFilename })

    await act(async () => {
      renderWithSaveStatus()
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue(mockContent)).toBeInTheDocument()
    })

    const textarea = screen.getByDisplayValue(mockContent)

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

  it('handles loading errors gracefully', async () => {
    mockDownloadNote.mockRejectedValue(new Error('Failed to load'))

    await act(async () => {
      renderWithSaveStatus()
    })

    // Should show error status
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error')
      expect(screen.getByTestId('status-text')).toHaveTextContent('Failed to load note')
    })

    // Should show error message in the main display area
    expect(screen.getByText('Failed to load note', { selector: 'div' })).toBeInTheDocument()
  })
})
