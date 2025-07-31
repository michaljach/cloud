import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import NotePage from '../app/(home)/note/[filename]/page'

// Mock the NoteEditorContainer component
jest.mock('@/components/note-editor-container', () => ({
  NoteEditorContainer: ({ filename }: { filename: string }) => (
    <div data-testid="note-editor-container">
      <span>Note Editor for: {filename}</span>
    </div>
  )
}))

describe('NotePage', () => {
  it('renders note editor container with correct filename', async () => {
    const mockParams = Promise.resolve({ filename: 'test-note.md' })

    render(await NotePage({ params: mockParams }))

    expect(screen.getByTestId('note-editor-container')).toBeInTheDocument()
    expect(screen.getByText('Note Editor for: test-note.md')).toBeInTheDocument()
  })

  it('handles different filenames', async () => {
    const mockParams = Promise.resolve({ filename: 'another-note.md' })

    render(await NotePage({ params: mockParams }))

    expect(screen.getByText('Note Editor for: another-note.md')).toBeInTheDocument()
  })
})
