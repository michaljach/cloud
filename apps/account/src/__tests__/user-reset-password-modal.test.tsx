import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserResetPasswordDialog } from '../features/admin/dialogs/user-reset-password-dialog'
import { UserProvider } from '@repo/providers'
import { resetUserPassword } from '@repo/api'

// Mock the API
jest.mock('@repo/api', () => ({
  resetUserPassword: jest.fn()
}))

// Mock the contexts
jest.mock('@repo/providers', () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useUser: () => ({
    accessToken: 'test-token',
    user: { id: 'admin-id', username: 'admin' }
  })
}))

const mockUser = {
  id: 'target-user-id',
  username: 'targetuser',
  fullName: 'Target User',
  storageLimit: 1024,
  userWorkspaces: []
}

const defaultProps = {
  user: mockUser,
  open: true,
  onOpenChange: jest.fn(),
  onSuccess: jest.fn()
}

describe('UserResetPasswordDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dialog when open', () => {
    render(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} />
      </UserProvider>
    )

    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument()
    expect(screen.getByText(/Reset password for user/)).toBeInTheDocument()
    expect(screen.getByText('targetuser')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} open={false} />
      </UserProvider>
    )

    expect(screen.queryByRole('heading', { name: 'Reset Password' })).not.toBeInTheDocument()
  })

  it('does not render when user is null', () => {
    render(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} user={null} />
      </UserProvider>
    )

    expect(screen.queryByRole('heading', { name: 'Reset Password' })).not.toBeInTheDocument()
  })

  it('auto-generates password when dialog opens', () => {
    render(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} />
      </UserProvider>
    )

    const passwordInput = screen.getByDisplayValue(/[A-Za-z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{12}/)
    expect(passwordInput).toBeInTheDocument()
  })

  it('generates new password when refresh button is clicked', async () => {
    render(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} />
      </UserProvider>
    )

    const refreshButton = screen.getByTitle('Generate new secure password')
    const initialPasswordInput = screen.getByDisplayValue(
      /[A-Za-z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{12}/
    ) as HTMLInputElement
    const initialPassword = initialPasswordInput.value

    fireEvent.click(refreshButton)

    await waitFor(() => {
      const newPasswordInput = screen.getByDisplayValue(
        /[A-Za-z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{12}/
      ) as HTMLInputElement
      expect(newPasswordInput.value).not.toBe(initialPassword)
    })
  })

  it('shows warning message about saving password', () => {
    render(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} />
      </UserProvider>
    )

    expect(screen.getByText(/Important:/)).toBeInTheDocument()
    expect(screen.getByText(/Save this generated password securely/)).toBeInTheDocument()
    expect(screen.getByText(/It cannot be recovered later/)).toBeInTheDocument()
  })

  it('resets form when dialog closes', () => {
    const { rerender } = render(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} />
      </UserProvider>
    )

    // Close dialog
    rerender(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} open={false} />
      </UserProvider>
    )

    // Reopen dialog
    rerender(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} open={true} />
      </UserProvider>
    )

    // Form should be reset with a new generated password
    const passwordInput = screen.getByDisplayValue(/[A-Za-z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{12}/)
    expect(passwordInput).toBeInTheDocument()
  })

  it('calls onOpenChange when cancel button is clicked', () => {
    render(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} />
      </UserProvider>
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('successfully resets password when form is submitted', async () => {
    const mockResetUserPassword = resetUserPassword as jest.MockedFunction<typeof resetUserPassword>
    mockResetUserPassword.mockResolvedValueOnce({
      user: { ...mockUser }
    })

    render(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} />
      </UserProvider>
    )

    const submitButton = screen.getByRole('button', { name: 'Reset Password' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockResetUserPassword).toHaveBeenCalledWith(
        'test-token',
        'target-user-id',
        expect.stringMatching(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{12}$/)
      )
    })

    expect(defaultProps.onSuccess).toHaveBeenCalled()
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows error message when API call fails', async () => {
    const mockResetUserPassword = resetUserPassword as jest.MockedFunction<typeof resetUserPassword>
    mockResetUserPassword.mockRejectedValueOnce(new Error('Failed to reset password'))

    render(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} />
      </UserProvider>
    )

    const submitButton = screen.getByRole('button', { name: 'Reset Password' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to reset password')).toBeInTheDocument()
    })

    expect(defaultProps.onSuccess).not.toHaveBeenCalled()
    expect(defaultProps.onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('validates password length', async () => {
    render(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} />
      </UserProvider>
    )

    const passwordInput = screen.getByPlaceholderText('Enter password')
    fireEvent.change(passwordInput, { target: { value: '123' } })

    const submitButton = screen.getByRole('button', { name: 'Reset Password' })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })

    expect(resetUserPassword).not.toHaveBeenCalled()
  })

  it('clears error when dialog is reopened', () => {
    const { rerender } = render(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} />
      </UserProvider>
    )

    // Close dialog
    rerender(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} open={false} />
      </UserProvider>
    )

    // Reopen dialog
    rerender(
      <UserProvider>
        <UserResetPasswordDialog {...defaultProps} open={true} />
      </UserProvider>
    )

    expect(screen.queryByText('Failed to reset password')).not.toBeInTheDocument()
  })
})
