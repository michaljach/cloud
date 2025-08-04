import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PageSearch } from '../components/header/page-search'
import { UserProvider, WorkspaceProvider } from '@repo/contexts'
import { FilesProvider } from '../components/providers/files-context'

// Mock the contexts
jest.mock('@repo/contexts', () => ({
  useUser: jest.fn(),
  useWorkspace: jest.fn(),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock the files context
jest.mock('../components/providers/files-context', () => ({
  FilesContext: React.createContext({
    files: [
      { filename: 'test-file.txt', type: 'file' },
      { filename: 'document.pdf', type: 'file' }
    ],
    loading: false,
    refreshFiles: jest.fn(),
    currentPath: '',
    setCurrentPath: jest.fn(),
    trashedFiles: [],
    refreshTrash: jest.fn()
  }),
  FilesProvider: ({ children }: any) => <div data-testid="files-provider">{children}</div>
}))

describe('PageSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(
      <UserProvider>
        <WorkspaceProvider>
          <FilesProvider>
            <PageSearch />
          </FilesProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(
      <UserProvider>
        <WorkspaceProvider>
          <FilesProvider>
            <PageSearch placeholder="Custom search..." />
          </FilesProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    expect(screen.getByPlaceholderText('Custom search...')).toBeInTheDocument()
  })

  it('renders with custom className', () => {
    render(
      <UserProvider>
        <WorkspaceProvider>
          <FilesProvider>
            <PageSearch className="custom-class" />
          </FilesProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    const searchContainer = screen.getByPlaceholderText('Search files...').parentElement
    expect(searchContainer).toHaveClass('custom-class')
  })

  it('handles search input changes', () => {
    render(
      <UserProvider>
        <WorkspaceProvider>
          <FilesProvider>
            <PageSearch />
          </FilesProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    const searchInput = screen.getByPlaceholderText('Search files...')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    expect(searchInput).toHaveValue('test')
  })

  it('filters files based on search term', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    render(
      <UserProvider>
        <WorkspaceProvider>
          <FilesProvider>
            <PageSearch />
          </FilesProvider>
        </WorkspaceProvider>
      </UserProvider>
    )

    const searchInput = screen.getByPlaceholderText('Search files...')
    fireEvent.change(searchInput, { target: { value: 'test' } })

    expect(consoleSpy).toHaveBeenCalledWith('Search results:', [
      { filename: 'test-file.txt', type: 'file' }
    ])

    consoleSpy.mockRestore()
  })
})
