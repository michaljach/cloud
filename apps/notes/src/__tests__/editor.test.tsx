import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '../features/notes/components/editor'

// Mock the markdown parser
jest.mock('../utils/markdown', () => ({
  parseMarkdown: jest.fn((content: string) => {
    // Simple mock that returns the content as text elements
    const lines = content.split(/\r?\n/)
    const elements: React.ReactNode[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? ''

      if (line.startsWith('# ')) {
        elements.push(<h1 key={i}>{line.slice(2)}</h1>)
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i}>{line.slice(3)}</h2>)
      } else if (line.trim() !== '') {
        // For lines with bold/italic, just return the text content
        const cleanText = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
        elements.push(<p key={i}>{cleanText}</p>)
      }
    }

    return elements
  })
}))

describe('Editor', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with default value', () => {
    render(<Editor value="# Test Note" onChange={mockOnChange} />)

    expect(screen.getByDisplayValue('# Test Note')).toBeInTheDocument()
  })

  it('renders with placeholder when no value', () => {
    render(<Editor onChange={mockOnChange} />)

    expect(screen.getByPlaceholderText('Write your markdown here...')).toBeInTheDocument()
  })

  it('calls onChange when user types', async () => {
    render(<Editor onChange={mockOnChange} />)

    const textarea = screen.getByPlaceholderText('Write your markdown here...')
    await userEvent.type(textarea, 'Hello World')

    expect(mockOnChange).toHaveBeenCalledWith('Hello World')
  })

  it('updates value when controlled value changes', () => {
    const { rerender } = render(<Editor value="Initial" onChange={mockOnChange} />)

    expect(screen.getByDisplayValue('Initial')).toBeInTheDocument()

    rerender(<Editor value="Updated" onChange={mockOnChange} />)

    expect(screen.getByDisplayValue('Updated')).toBeInTheDocument()
  })

  it('shows preview by default', () => {
    render(<Editor value="# Test Heading" onChange={mockOnChange} />)

    // Should show both editor and preview
    expect(screen.getByDisplayValue('# Test Heading')).toBeInTheDocument()
    expect(screen.getByText('Test Heading')).toBeInTheDocument()
  })

  it('toggles preview when button is clicked', async () => {
    render(<Editor value="# Test Heading" onChange={mockOnChange} />)

    const toggleButton = screen.getByRole('button', { name: /hide preview/i })

    await userEvent.click(toggleButton)

    // Preview should be hidden (check for CSS classes that hide it)
    const previewDiv = screen.getByText('Test Heading').closest('div')
    expect(previewDiv).toHaveClass('w-0', 'opacity-0', 'pointer-events-none')
    expect(screen.getByDisplayValue('# Test Heading')).toBeInTheDocument()

    // Button should now say "Show Preview"
    expect(screen.getByRole('button', { name: /show preview/i })).toBeInTheDocument()

    // Click again to show preview
    await userEvent.click(toggleButton)

    // Preview should be visible again
    expect(previewDiv).toHaveClass('w-1/2', 'opacity-100')
    expect(screen.getByRole('button', { name: /hide preview/i })).toBeInTheDocument()
  })

  it('renders markdown in preview', () => {
    const markdownContent = `# Main Heading
## Sub Heading
This is **bold** and *italic* text.`

    render(<Editor value={markdownContent} onChange={mockOnChange} />)

    // Check that markdown is rendered in preview
    expect(screen.getByText('Main Heading')).toBeInTheDocument()
    expect(screen.getByText('Sub Heading')).toBeInTheDocument()
    expect(screen.getByText('This is bold and italic text.')).toBeInTheDocument()
  })

  it('has correct styling classes', () => {
    render(<Editor value="Test" onChange={mockOnChange} />)

    const textarea = screen.getByDisplayValue('Test')
    expect(textarea).toHaveClass(
      'h-full',
      'min-h-0',
      'p-4',
      'border-r',
      'resize-none',
      'outline-none',
      'font-mono',
      'text-base',
      'bg-background'
    )
  })

  it('handles empty content', () => {
    render(<Editor value="" onChange={mockOnChange} />)

    const textarea = screen.getByDisplayValue('')
    expect(textarea).toBeInTheDocument()
  })

  it('maintains focus when typing', async () => {
    render(<Editor onChange={mockOnChange} />)

    const textarea = screen.getByPlaceholderText('Write your markdown here...')
    textarea.focus()

    await userEvent.type(textarea, 'Test content')

    expect(textarea).toHaveFocus()
  })

  it('updates preview in real-time', async () => {
    render(<Editor onChange={mockOnChange} />)

    const textarea = screen.getByPlaceholderText('Write your markdown here...')
    await userEvent.type(textarea, '# New Heading')

    // The preview should update with the new content
    expect(screen.getByText('New Heading')).toBeInTheDocument()
  })

  it('handles special characters in markdown', () => {
    const specialContent = `# Heading with "quotes"
## Sub-heading with 'apostrophes'
**Bold text** and *italic text*`

    render(<Editor value={specialContent} onChange={mockOnChange} />)

    // Check that the content is rendered in the preview
    expect(screen.getByText('Heading with "quotes"')).toBeInTheDocument()
    expect(screen.getByText("Sub-heading with 'apostrophes'")).toBeInTheDocument()
    expect(screen.getByText('Bold text and italic text')).toBeInTheDocument()
  })

  it('works without onChange prop', () => {
    render(<Editor value="Test content" />)

    const textarea = screen.getByDisplayValue('Test content')
    expect(textarea).toBeInTheDocument()

    // Should not crash when typing without onChange
    fireEvent.change(textarea, { target: { value: 'New content' } })
  })

  it('has correct accessibility attributes', () => {
    render(<Editor value="Test" onChange={mockOnChange} />)

    const textarea = screen.getByDisplayValue('Test')
    expect(textarea).toHaveAttribute('spellCheck', 'false')

    const toggleButton = screen.getByRole('button', { name: /hide preview/i })
    expect(toggleButton).toHaveAttribute('aria-label')
  })
})
