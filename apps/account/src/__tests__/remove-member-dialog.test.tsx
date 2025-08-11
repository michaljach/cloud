import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

import { RemoveMemberDialog } from '../features/workspaces/dialogs/remove-member-dialog'

describe('RemoveMemberDialog', () => {
  const mockProps = {
    open: true,
    onOpenChange: jest.fn(),
    onConfirm: jest.fn(),
    memberName: 'John Doe',
    workspaceName: 'Test Workspace',
    isRemoving: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dialog with member and workspace names', () => {
    render(<RemoveMemberDialog {...mockProps} />)

    expect(screen.getByRole('heading', { name: 'Remove Member' })).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to remove/)).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Test Workspace')).toBeInTheDocument()
  })

  it('shows warning message about removing member', () => {
    render(<RemoveMemberDialog {...mockProps} />)

    expect(screen.getByText('This action will:')).toBeInTheDocument()
    expect(screen.getByText('Remove the user from all workspace activities')).toBeInTheDocument()
    expect(screen.getByText('Revoke their access to workspace resources')).toBeInTheDocument()
    expect(screen.getByText('Cannot be undone immediately')).toBeInTheDocument()
    expect(screen.getByText(/The user will need to be re-invited/)).toBeInTheDocument()
  })

  it('calls onConfirm when remove button is clicked', () => {
    render(<RemoveMemberDialog {...mockProps} />)

    const removeButton = screen.getByRole('button', { name: 'Remove Member' })
    fireEvent.click(removeButton)

    expect(mockProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenChange when cancel button is clicked', () => {
    render(<RemoveMemberDialog {...mockProps} />)

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows loading state when isRemoving is true', () => {
    render(<RemoveMemberDialog {...mockProps} isRemoving={true} />)

    expect(screen.getByText('Removing...')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove Member' })).not.toBeInTheDocument()
  })

  it('disables buttons when isRemoving is true', () => {
    render(<RemoveMemberDialog {...mockProps} isRemoving={true} />)

    const cancelButton = screen.getByText('Cancel')
    const removeButton = screen.getByText('Removing...')

    expect(cancelButton).toBeDisabled()
    expect(removeButton).toBeDisabled()
  })

  it('does not render when open is false', () => {
    render(<RemoveMemberDialog {...mockProps} open={false} />)

    expect(screen.queryByRole('heading', { name: 'Remove Member' })).not.toBeInTheDocument()
  })
})
