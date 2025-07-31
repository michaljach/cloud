import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PasswordChangeForm } from '../components/password-change-form'
import { UserProvider } from '@repo/contexts'
import { changePassword } from '@repo/api'

// Mock the API
jest.mock('@repo/api', () => ({
  changePassword: jest.fn()
}))

// Mock the contexts
jest.mock('@repo/contexts', () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useUser: () => ({
    accessToken: 'test-token',
    user: {
      id: 'user-id',
      username: 'testuser',
      workspaces: []
    }
  })
}))

describe('PasswordChangeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders password change form', () => {
    render(
      <UserProvider>
        <PasswordChangeForm />
      </UserProvider>
    )

    expect(screen.getByLabelText('Current Password')).toBeInTheDocument()
    expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change Password' })).toBeInTheDocument()
  })

  it('successfully changes password when form is submitted', async () => {
    const mockChangePassword = changePassword as jest.MockedFunction<typeof changePassword>
    mockChangePassword.mockResolvedValueOnce({
      user: { id: 'user-id', username: 'testuser', storageLimit: 1024 }
    })

    render(
      <UserProvider>
        <PasswordChangeForm />
      </UserProvider>
    )

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'currentPassword123' }
    })
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'newPassword123!' }
    })
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'newPassword123!' }
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith(
        'test-token',
        'currentPassword123',
        'newPassword123!'
      )
    })

    // Check for success message
    expect(screen.getByText('Password changed successfully!')).toBeInTheDocument()
  })

  it('shows error message when API call fails', async () => {
    const mockChangePassword = changePassword as jest.MockedFunction<typeof changePassword>
    mockChangePassword.mockRejectedValueOnce(new Error('Current password is incorrect'))

    render(
      <UserProvider>
        <PasswordChangeForm />
      </UserProvider>
    )

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'wrongPassword' }
    })
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'newPassword123!' }
    })
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'newPassword123!' }
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect')).toBeInTheDocument()
    })
  })

  it('validates password confirmation matching', async () => {
    render(
      <UserProvider>
        <PasswordChangeForm />
      </UserProvider>
    )

    // Fill out the form with mismatched passwords
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'currentPassword123' }
    })
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'newPassword123!' }
    })
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'differentPassword123!' }
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))

    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })

    // Verify API was not called
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('validates new password length', async () => {
    render(
      <UserProvider>
        <PasswordChangeForm />
      </UserProvider>
    )

    // Fill out the form with short password
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'currentPassword123' }
    })
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: '123' }
    })
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: '123' }
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))

    await waitFor(() => {
      expect(screen.getByText('New password must be at least 6 characters')).toBeInTheDocument()
    })

    // Verify API was not called
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('validates required fields', async () => {
    render(
      <UserProvider>
        <PasswordChangeForm />
      </UserProvider>
    )

    // Submit the form without filling it out
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))

    await waitFor(() => {
      expect(screen.getByText('Current password is required')).toBeInTheDocument()
      expect(screen.getByText('Please confirm your new password')).toBeInTheDocument()
    })

    // Verify API was not called
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('resets form after successful password change', async () => {
    const mockChangePassword = changePassword as jest.MockedFunction<typeof changePassword>
    mockChangePassword.mockResolvedValueOnce({
      user: { id: 'user-id', username: 'testuser', storageLimit: 1024 }
    })

    render(
      <UserProvider>
        <PasswordChangeForm />
      </UserProvider>
    )

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'currentPassword123' }
    })
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'newPassword123!' }
    })
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'newPassword123!' }
    })

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))

    await waitFor(() => {
      expect(screen.getByText('Password changed successfully!')).toBeInTheDocument()
    })

    // Check that form fields are cleared
    const currentPasswordInput = screen.getByLabelText('Current Password') as HTMLInputElement
    const newPasswordInput = screen.getByLabelText('New Password') as HTMLInputElement
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password') as HTMLInputElement

    expect(currentPasswordInput.value).toBe('')
    expect(newPasswordInput.value).toBe('')
    expect(confirmPasswordInput.value).toBe('')
  })
})
