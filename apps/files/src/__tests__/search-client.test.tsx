import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchClient } from '@/components/layout/page-search'

describe('SearchClient', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderSearchClient(props = {}) {
    return render(<SearchClient onChange={mockOnChange} {...props} />)
  }

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
    renderSearchClient()

    const searchInput = screen.getByPlaceholderText('Search files...')
    await user.type(searchInput, 'test')

    expect(mockOnChange).toHaveBeenCalledWith('test')
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

    expect(searchInput).toHaveValue('uncontrolled value')
  })

  it('handles special characters', async () => {
    const user = userEvent.setup()
    renderSearchClient()

    const searchInput = screen.getByPlaceholderText('Search files...')
    await user.type(searchInput, 'file-name_123')

    expect(mockOnChange).toHaveBeenCalledWith('file-name_123')
  })

  it('handles spaces', async () => {
    const user = userEvent.setup()
    renderSearchClient()

    const searchInput = screen.getByPlaceholderText('Search files...')
    await user.type(searchInput, 'my file')

    expect(mockOnChange).toHaveBeenCalledWith('my file')
  })

  it('handles empty string', async () => {
    const user = userEvent.setup()
    renderSearchClient()

    const searchInput = screen.getByPlaceholderText('Search files...')
    await user.type(searchInput, 'test')
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
    renderSearchClient()

    const searchInput = screen.getByPlaceholderText('Search files...')

    // Type rapidly
    await user.type(searchInput, 'a')
    await user.type(searchInput, 'b')
    await user.type(searchInput, 'c')

    expect(mockOnChange).toHaveBeenCalledWith('a')
    expect(mockOnChange).toHaveBeenCalledWith('ab')
    expect(mockOnChange).toHaveBeenCalledWith('abc')
  })

  it('handles backspace', async () => {
    const user = userEvent.setup()
    renderSearchClient()

    const searchInput = screen.getByPlaceholderText('Search files...')
    await user.type(searchInput, 'test')
    await user.type(searchInput, '{backspace}')

    expect(mockOnChange).toHaveBeenCalledWith('tes')
  })

  it('handles paste events', async () => {
    const user = userEvent.setup()
    renderSearchClient()

    const searchInput = screen.getByPlaceholderText('Search files...')

    // Simulate paste using userEvent
    await user.click(searchInput)
    await user.paste('pasted text')

    expect(mockOnChange).toHaveBeenCalledWith('pasted text')
  })

  it('handles keyboard events', async () => {
    const user = userEvent.setup()
    renderSearchClient()

    const searchInput = screen.getByPlaceholderText('Search files...')

    // Focus the input
    await user.click(searchInput)
    expect(searchInput).toHaveFocus()

    // Type and press Enter
    await user.type(searchInput, 'test{enter}')
    expect(mockOnChange).toHaveBeenCalledWith('test')
  })
})
