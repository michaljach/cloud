import '@testing-library/jest-dom'
import { render, screen, act } from '@testing-library/react'
import React from 'react'

import { SaveStatusProvider, useSaveStatus } from '@/features/notes/providers/status-provider'

// Test component to access the context
function TestComponent() {
  const { saveStatus, setSaveStatus, saveStatusText, setSaveStatusText } = useSaveStatus()

  return (
    <div>
      <div data-testid="save-status">{saveStatus}</div>
      <div data-testid="save-status-text">{saveStatusText}</div>
      <button data-testid="set-saving" onClick={() => setSaveStatus('saving')}>
        Set Saving
      </button>
      <button data-testid="set-saved" onClick={() => setSaveStatus('saved')}>
        Set Saved
      </button>
      <button data-testid="set-error" onClick={() => setSaveStatus('error')}>
        Set Error
      </button>
      <button data-testid="set-idle" onClick={() => setSaveStatus('idle')}>
        Set Idle
      </button>
      <button data-testid="set-custom-text" onClick={() => setSaveStatusText('Custom text')}>
        Set Custom Text
      </button>
    </div>
  )
}

describe('SaveStatusContext', () => {
  it('provides default values', () => {
    render(
      <SaveStatusProvider>
        <TestComponent />
      </SaveStatusProvider>
    )

    expect(screen.getByTestId('save-status')).toHaveTextContent('idle')
    expect(screen.getByTestId('save-status-text')).toHaveTextContent('All changes saved')
  })

  it('allows updating save status', () => {
    render(
      <SaveStatusProvider>
        <TestComponent />
      </SaveStatusProvider>
    )

    act(() => {
      screen.getByTestId('set-saving').click()
    })
    expect(screen.getByTestId('save-status')).toHaveTextContent('saving')

    act(() => {
      screen.getByTestId('set-saved').click()
    })
    expect(screen.getByTestId('save-status')).toHaveTextContent('saved')

    act(() => {
      screen.getByTestId('set-error').click()
    })
    expect(screen.getByTestId('save-status')).toHaveTextContent('error')

    act(() => {
      screen.getByTestId('set-idle').click()
    })
    expect(screen.getByTestId('save-status')).toHaveTextContent('idle')
  })

  it('allows updating save status text', () => {
    render(
      <SaveStatusProvider>
        <TestComponent />
      </SaveStatusProvider>
    )

    act(() => {
      screen.getByTestId('set-custom-text').click()
    })
    expect(screen.getByTestId('save-status-text')).toHaveTextContent('Custom text')
  })

  it('throws error when used outside provider', () => {
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useSaveStatus must be used within a SaveStatusProvider')
  })
})
