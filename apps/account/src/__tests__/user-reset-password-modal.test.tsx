import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserResetPasswordModal } from '../components/user-reset-password-modal'
import { UserProvider } from '@repo/contexts'
import { resetUserPassword } from '@repo/api'

// Mock the API
jest.mock('@repo/api', () => ({
  resetUserPassword: jest.fn()
}))

// Mock the contexts
jest.mock('@repo/contexts', () => ({
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

describe('UserResetPasswordModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders modal when open', () => {
    render(
      <UserProvider>
        <UserResetPasswordModal {...defaultProps} />
      </UserProvider>
    )

    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument()
    expect(screen.getByText(/Reset password for user/)).toBeInTheDocument()
    expect(screen.getByText('targetuser')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <UserProvider>
        <UserResetPasswordModal {...defaultProps} open={false} />
      </UserProvider>
    )

    expect(screen.queryByText('Reset Password')).not.toBeInTheDocument()
  })

  it('does not render when user is null', () => {
    render(
      <UserProvider>
        <UserResetPasswordModal {...defaultProps} user={null} />
      </UserProvider>
    )

    expect(screen.queryByText('Reset Password')).not.toBeInTheDocument()
  })

  it('auto-generates password when modal opens', () => {
    render(
      <UserProvider>
        <UserResetPasswordModal {...defaultProps} />
      </UserProvider>
    )

    const passwordInput = screen.getByPlaceholderText('Enter password') as HTMLInputElement
    expect(passwordInput.value).toMatch(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{12}$/)
  })

  it('generates new password when refresh button is clicked', () => {
    render(
      <UserProvider>
        <UserResetPasswordModal {...defaultProps} />
      </UserProvider>
    )

    const passwordInput = screen.getByPlaceholderText('Enter password') as HTMLInputElement
    const initialPassword = passwordInput.value

    const refreshButton = screen.getByRole('button', { name: 'Generate new secure password' })
    fireEvent.click(refreshButton)

    expect(passwordInput.value).not.toBe(initialPassword)
    expect(passwordInput.value).toMatch(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]{12}$/)
  })

  it('shows warning message about saving password', () => {
    render(
      <UserProvider>
        <UserResetPasswordModal {...defaultProps} />
      </UserProvider>
    )

    expect(screen.getByText(/Important:/)).toBeInTheDocument()
    expect(screen.getByText(/Save this generated password securely/)).toBeInTheDocument()
    expect(screen.getByText(/It cannot be recovered later/)).toBeInTheDocument()
  })

  it('resets form when modal closes', () => {
    const { rerender } = render(
      <UserProvider>
        <UserResetPasswordModal {...defaultProps} />
      </UserProvider>
    )

    const passwordInput = screen.getByPlaceholderText('Enter password') as HTMLInputElement
    const initialPassword = passwordInput.value

    // Close modal
    rerender(
      <UserProvider>
        <UserResetPasswordModal {...defaultProps} open={false} />
      </UserProvider>
    )

    // Reopen modal
    rerender(
      <UserProvider>
        <UserResetPasswordModal {...defaultProps} open={true} />
      </UserProvider>
    )

    const newPasswordInput = screen.getByPlaceholderText('Enter password') as HTMLInputElement
    expect(newPasswordInput.value).not.toBe(initialPassword)
  })

  it('calls onOpenChange when cancel button is clicked', () => {
    render(
      <UserProvider>
        <UserResetPasswordModal {...defaultProps} />
      </UserProvider>
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
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
        <UserResetPasswordModal {...defaultProps} />
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
        <UserResetPasswordModal {...defaultProps} />
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
        <UserResetPasswordModal {...defaultProps} />
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

  it('clears error when modal is reopened', () => {
    const { rerender } = render(
      <UserProvider>
        <UserResetPasswordModal {...defaultProps} />
      </UserProvider>
    )

    // Close modal
    rerender(
      <UserProvider>
        <UserResetPasswordModal {...defaultProps} open={false} />
      </UserProvider>
    )

    // Reopen modal
    rerender(
      <UserProvider>
        <UserResetPasswordModal {...defaultProps} open={true} />
      </UserProvider>
    )

    expect(screen.queryByText('Failed to reset password')).not.toBeInTheDocument()
  })
})
