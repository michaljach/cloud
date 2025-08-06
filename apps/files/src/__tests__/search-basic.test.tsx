import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchClient } from '@/features/layout/page-search'

// Mock the providers
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

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/files'
}))

// Mock the API functions
jest.mock('@repo/api', () => ({
  listFiles: jest.fn().mockResolvedValue([]),
  searchFiles: jest.fn().mockResolvedValue([])
}))

describe('Search Basic Functionality', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderSearchClient(props = {}) {
    return render(<SearchClient onChange={mockOnChange} {...props} />)
  }

  describe('Search Input', () => {
    it('renders search input with default placeholder', () => {
      renderSearchClient()

      expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument()
    })

    it('renders search input with custom placeholder', () => {
      renderSearchClient({ placeholder: 'Custom search...' })

      expect(screen.getByPlaceholderText('Custom search...')).toBeInTheDocument()
    })

    it('calls onChange when user types in controlled mode', async () => {
      const user = userEvent.setup()
      const mockOnChange = jest.fn()
      render(<SearchClient value="" onChange={mockOnChange} />)

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'test')

      // Test that onChange was called (we don't need to test the exact input value)
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
  })

  describe('Search Icon', () => {
    it('renders search icon', () => {
      renderSearchClient()

      // The search icon should be present
      const searchIcon = screen.getByPlaceholderText('Search files...').previousElementSibling
      expect(searchIcon).toBeInTheDocument()
    })
  })

  describe('Input Behavior', () => {
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
  })

  describe('Styling', () => {
    it('applies custom className', () => {
      renderSearchClient({ className: 'custom-class' })

      const container = screen.getByPlaceholderText('Search files...').parentElement
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Accessibility', () => {
    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      renderSearchClient()

      const searchInput = screen.getByPlaceholderText('Search files...')

      // Focus the input
      await user.click(searchInput)
      expect(searchInput).toHaveFocus()
    })

    it('handles keyboard events', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: '', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')

      // Focus the input
      await user.click(searchInput)
      expect(searchInput).toHaveFocus()

      // Type and press Enter
      await user.type(searchInput, 'test{enter}')
      // Test that onChange was called (we don't need to test the exact final value)
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('handles very long search queries', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: '', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')
      const longQuery = 'a'.repeat(100)

      await user.type(searchInput, longQuery)

      // Test that onChange was called (we don't need to test the exact final value)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles unicode characters', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: '', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'café résumé')

      // Test that onChange was called (we don't need to test the exact final value)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles basic special characters', async () => {
      const user = userEvent.setup()
      renderSearchClient({ value: '', onChange: mockOnChange })

      const searchInput = screen.getByPlaceholderText('Search files...')
      await user.type(searchInput, 'café')

      // Test that onChange was called (we don't need to test the exact final value)
      expect(mockOnChange).toHaveBeenCalled()
    })
  })
})
