import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { useEffect } from 'react'

import { PageHeaderStatus } from '../features/layout/page-header-status'

import { SaveStatusProvider, useSaveStatus } from '@/features/notes/providers/status-provider'

// Test component to control the save status
function TestWrapper({
  initialStatus = 'idle',
  initialText = 'All changes saved'
}: {
  initialStatus?: 'idle' | 'saving' | 'saved' | 'error'
  initialText?: string
}) {
  const { setSaveStatus, setSaveStatusText } = useSaveStatus()

  useEffect(() => {
    setSaveStatus(initialStatus)
    setSaveStatusText(initialText)
  }, [initialStatus, initialText, setSaveStatus, setSaveStatusText])

  return <PageHeaderStatus />
}

describe('PageHeaderStatus', () => {
  it('renders idle state without icon', () => {
    render(
      <SaveStatusProvider>
        <TestWrapper initialStatus="idle" initialText="All changes saved" />
      </SaveStatusProvider>
    )

    expect(screen.getByText('All changes saved')).toBeInTheDocument()
    // Should not have any icon in idle state
    expect(screen.queryByTestId('saving-icon')).not.toBeInTheDocument()
    expect(screen.queryByTestId('saved-icon')).not.toBeInTheDocument()
    expect(screen.queryByTestId('error-icon')).not.toBeInTheDocument()
  })

  it('renders saving state with spinner icon', () => {
    render(
      <SaveStatusProvider>
        <TestWrapper initialStatus="saving" initialText="Saving..." />
      </SaveStatusProvider>
    )

    expect(screen.getByText('Saving...')).toBeInTheDocument()
    // Check for the Loader2 icon (saving spinner)
    const spinner = screen.getByTestId('saving-icon')
    expect(spinner).toHaveClass('animate-spin', 'text-blue-500')
  })

  it('renders saved state with checkmark icon', () => {
    render(
      <SaveStatusProvider>
        <TestWrapper initialStatus="saved" initialText="Saved" />
      </SaveStatusProvider>
    )

    expect(screen.getByText('Saved')).toBeInTheDocument()
    // Check for the CheckCircle icon
    const checkmark = screen.getByTestId('saved-icon')
    expect(checkmark).toHaveClass('text-green-500')
  })

  it('renders error state with alert icon', () => {
    render(
      <SaveStatusProvider>
        <TestWrapper initialStatus="error" initialText="Save failed" />
      </SaveStatusProvider>
    )

    expect(screen.getByText('Save failed')).toBeInTheDocument()
    // Check for the AlertCircle icon
    const alert = screen.getByTestId('error-icon')
    expect(alert).toHaveClass('text-red-500')
  })

  it('renders unsaved changes text', () => {
    render(
      <SaveStatusProvider>
        <TestWrapper initialStatus="idle" initialText="Unsaved changes" />
      </SaveStatusProvider>
    )

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
  })

  it('has correct styling classes', () => {
    render(
      <SaveStatusProvider>
        <TestWrapper />
      </SaveStatusProvider>
    )

    const container = screen.getByText('All changes saved').parentElement
    expect(container).toHaveClass('flex', 'items-center', 'gap-2', 'text-muted-foreground')
  })
})
