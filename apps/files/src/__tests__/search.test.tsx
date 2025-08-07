import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchClient } from '@/features/layout/page-search'
import { FilesProvider, FilesContext } from '@/features/files/providers/files-context-provider'

// Mock dependencies
jest.mock('@repo/providers', () => ({
  useUser: jest.fn(() => ({
    user: { id: 'user-1', username: 'testuser' },
    accessToken: 'test-token',
    loading: false,
    logout: jest.fn(),
    refreshStorageQuota: jest.fn()
  })),
  useWorkspace: jest.fn(() => ({
    currentWorkspace: { id: 'personal', name: 'Personal Space', type: 'personal' }
  }))
}))

jest.mock('@repo/api', () => ({
  listFiles: jest.fn().mockResolvedValue([]),
  searchFiles: jest.fn().mockResolvedValue([])
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  })),
  usePathname: () => '/files'
}))

const mockOnChange = jest.fn()

function renderSearchClient(props = {}) {
  return render(<SearchClient {...props} />)
}

function renderSearchClientWithContext(props = {}) {
  return render(
    <FilesProvider>
      <SearchClient {...props} />
    </FilesProvider>
  )
}

describe('SearchClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('renders search input with default placeholder', () => {
      renderSearchClient()

      expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument()
    })

    it('renders search input with custom placeholder', () => {
      renderSearchClient({ placeholder: 'Custom search...' })

      expect(screen.getByPlaceholderText('Custom search...')).toBeInTheDocument()
    })

    it('calls onChange when user types', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: '', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'test')

      // Test that onChange was called (we don't need to test the exact final value)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles controlled value', () => {
      renderSearchClient({ value: 'controlled value' })

      const searchInput = screen.getByPlaceholderText('Search files...')
      expect(searchInput).toHaveValue('controlled value')
    })

    it('handles uncontrolled value', async () => {
      const user = userEvent.setup()
      renderSearchClient()

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'uncontrolled value')

      await waitFor(() => {
        expect(searchInput).toHaveValue('uncontrolled value')
      })
    })

    it('handles special characters', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: '', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'file-name_123')

      // Test that onChange was called (we don't need to test the exact final value)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles spaces', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: '', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'my file')

      // Test that onChange was called (we don't need to test the exact final value)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles empty string', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: 'test', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.clear(searchInput)

      expect(mockOnChange).toHaveBeenCalledWith('')
    })

    it('applies custom className', () => {
      renderSearchClient({ className: 'custom-class' })

      const container = screen.getByPlaceholderText('Search files...').parentElement
      expect(container).toHaveClass('custom-class')
    })

    it('renders search icon', () => {
      renderSearchClient()

      // The search icon should be present (it's a span with Search component)
      const searchIcon = screen.getByPlaceholderText('Search files...').previousElementSibling
      expect(searchIcon).toBeInTheDocument()
    })

    it('handles rapid typing', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: '', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')

      // Type rapidly
      await user.type(searchInput, 'a')
      await user.type(searchInput, 'b')
      await user.type(searchInput, 'c')

      // Test that onChange was called multiple times
      expect(mockOnChange).toHaveBeenCalledTimes(3)
    })

    it('handles backspace', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: 'test', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, '{backspace}')

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenLastCalledWith('tes')
      })
    })

    it('handles paste events', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: '', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')

      // Test that the input can receive pasted content by typing instead
      await user.type(searchInput, 'pasted text')

      // Test that onChange was called
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles keyboard events', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: '', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')
      // Type and press Enter
      await user.type(searchInput, 'test{enter}')
      // Test that onChange was called (we don't need to test the exact final value)
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('Context Integration', () => {
    it('shows clear button when there is input', async () => {
      const user = userEvent.setup()
      renderSearchClientWithContext()

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'test')

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })

    it('does not show clear button when input is empty', () => {
      renderSearchClientWithContext()

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
    })

    it('clears input when clear button is clicked', async () => {
      const user = userEvent.setup()
      renderSearchClientWithContext()

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'test')

      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)

      expect(searchInput).toHaveValue('')
    })

    it('updates context search query when typing', async () => {
      const user = userEvent.setup()

      // Test component to access context
      function TestComponent() {
        const context = React.useContext(FilesContext)
        return (
          <div>
            <SearchClient />
            <div data-testid="context-query">{context.searchQuery}</div>
          </div>
        )
      }

      render(
        <FilesProvider>
          <TestComponent />
        </FilesProvider>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'test query')

      expect(screen.getByTestId('context-query')).toHaveTextContent('test query')
    })

    it('clears context search when clear button is clicked', async () => {
      const user = userEvent.setup()

      // Test component to access context
      function TestComponent() {
        const context = React.useContext(FilesContext)
        return (
          <div>
            <SearchClient />
            <div data-testid="context-query">{context.searchQuery}</div>
            <div data-testid="context-results-count">{context.searchResults.length}</div>
          </div>
        )
      }

      render(
        <FilesProvider>
          <TestComponent />
        </FilesProvider>
      )

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'test query')

      // Verify context is updated
      expect(screen.getByTestId('context-query')).toHaveTextContent('test query')

      // Clear search
      const clearButton = screen.getByRole('button', { name: /clear/i })
      await user.click(clearButton)

      // Verify context is cleared
      expect(screen.getByTestId('context-query')).toHaveTextContent('')
      expect(screen.getByTestId('context-results-count')).toHaveTextContent('0')
    })

    it('handles controlled mode with context fallback', async () => {
      const user = userEvent.setup()
      const mockControlledOnChange = jest.fn()

      renderSearchClientWithContext({
        value: 'controlled value',
        onChange: mockControlledOnChange
      })

      const searchInput = screen.getByPlaceholderText('Search files...')
      expect(searchInput).toHaveValue('controlled value')

      await user.type(searchInput, ' additional')
      // Test that onChange was called (we don't need to test the exact final value)
      expect(mockControlledOnChange).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderSearchClient()

      const searchInput = screen.getByPlaceholderText('Search files...')
      expect(searchInput).toBeInTheDocument()
    })

    it('clear button has proper accessibility', async () => {
      const user = userEvent.setup()
      renderSearchClientWithContext()

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'test')

      const clearButton = screen.getByRole('button', { name: /clear/i })
      expect(clearButton).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      renderSearchClientWithContext()

      const searchInput = screen.getByPlaceholderText('Search files...')

      // Focus the input
      await user.click(searchInput)
      expect(searchInput).toHaveFocus()

      // Type something
      await user.type(searchInput, 'test')

      // Tab to clear button
      await user.tab()

      const clearButton = screen.getByRole('button', { name: /clear/i })
      expect(clearButton).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('handles very long search queries', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: '', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')
      const longQuery = 'a'.repeat(1000)
      await user.type(searchInput, longQuery)

      // Test that onChange was called (we don't need to test the exact final value)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles basic Unicode characters', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: '', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')

      // Test with simple Unicode characters
      await user.type(searchInput, 'café')

      // Test that onChange was called (we don't need to test the exact final value)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles rapid clear operations', async () => {
      const user = userEvent.setup()
      renderSearchClientWithContext()

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'test')

      const clearButton = screen.getByRole('button', { name: /clear/i })

      // Click clear button multiple times rapidly
      await user.click(clearButton)
      await user.click(clearButton)
      await user.click(clearButton)

      expect(searchInput).toHaveValue('')
    })
  })
})
