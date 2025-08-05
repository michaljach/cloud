import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { LeaveWorkspaceDialog } from '../features/workspaces/dialogs/leave-workspace-dialog'

describe('LeaveWorkspaceDialog', () => {
  const mockProps = {
    open: true,
    onOpenChange: jest.fn(),
    onConfirm: jest.fn(),
    workspaceName: 'Test Workspace',
    isLeaving: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dialog with workspace name', () => {
    render(<LeaveWorkspaceDialog {...mockProps} />)

    expect(screen.getByRole('heading', { name: 'Leave Workspace' })).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to leave the workspace/)).toBeInTheDocument()
    expect(screen.getByText('"Test Workspace"')).toBeInTheDocument()
  })

  it('shows warning message about leaving workspace', () => {
    render(<LeaveWorkspaceDialog {...mockProps} />)

    expect(screen.getByText('This action cannot be undone')).toBeInTheDocument()
    expect(screen.getByText('You will lose access to all workspace content')).toBeInTheDocument()
    expect(
      screen.getByText('You will be removed from all workspace discussions')
    ).toBeInTheDocument()
    expect(screen.getByText('You will need to be re-invited to rejoin')).toBeInTheDocument()
  })

  it('calls onConfirm when leave button is clicked', () => {
    render(<LeaveWorkspaceDialog {...mockProps} />)

    const leaveButton = screen.getByRole('button', { name: 'Leave Workspace' })
    fireEvent.click(leaveButton)

    expect(mockProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenChange when cancel button is clicked', () => {
    render(<LeaveWorkspaceDialog {...mockProps} />)

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows loading state when isLeaving is true', () => {
    render(<LeaveWorkspaceDialog {...mockProps} isLeaving={true} />)

    expect(screen.getByText('Leaving...')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Leave Workspace' })).not.toBeInTheDocument()
  })

  it('disables buttons when isLeaving is true', () => {
    render(<LeaveWorkspaceDialog {...mockProps} isLeaving={true} />)

    const cancelButton = screen.getByText('Cancel')
    const leaveButton = screen.getByText('Leaving...')

    expect(cancelButton).toBeDisabled()
    expect(leaveButton).toBeDisabled()
  })

  it('does not render when open is false', () => {
    render(<LeaveWorkspaceDialog {...mockProps} open={false} />)

    expect(screen.queryByRole('heading', { name: 'Leave Workspace' })).not.toBeInTheDocument()
  })
})
