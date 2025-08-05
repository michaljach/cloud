import React from 'react'
import { render, screen } from '@testing-library/react'
import PasswordChangePage from '../app/(home)/account/password/page'
import { UserProvider } from '@repo/providers'

// Mock the contexts
jest.mock('@repo/providers', () => ({
  getServerUser: jest.fn(() => ({
    id: 'user-id',
    username: 'testuser',
    fullName: 'Test User',
    storageLimit: 1024,
    workspaces: []
  })),
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

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({}))
}))

// Mock the API
jest.mock('@repo/api', () => ({
  changePassword: jest.fn()
}))

describe('PasswordChangePage', () => {
  it('renders password change page with correct title and description', async () => {
    const page = await PasswordChangePage()
    render(<UserProvider>{page}</UserProvider>)

    expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument()
    expect(
      screen.getByText('Update your account password to keep your account secure')
    ).toBeInTheDocument()
  })

  it('renders the password change form', async () => {
    const page = await PasswordChangePage()
    render(<UserProvider>{page}</UserProvider>)

    // Check that the form components are rendered
    expect(screen.getByLabelText('Current Password')).toBeInTheDocument()
    expect(screen.getByLabelText('New Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change Password' })).toBeInTheDocument()
  })

  it('shows not authenticated message when user is not found', async () => {
    // Mock getServerUser to return null
    const { getServerUser } = require('@repo/providers')
    getServerUser.mockReturnValueOnce(null)

    const page = await PasswordChangePage()
    render(page)

    expect(screen.getByText('Not authenticated')).toBeInTheDocument()
  })
})
