import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import RootLayout from '../app/(home)/layout'

// Mock the components used in the layout
jest.mock('@/components/app-sidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar">App Sidebar</div>
}))

jest.mock('@/components/header-user-provider', () => ({
  HeaderUserProvider: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div data-testid="header-user-provider">
      <span>Header: {title}</span>
      {children}
    </div>
  )
}))

jest.mock('@/components/save-status-context', () => ({
  SaveStatusProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

describe('RootLayout', () => {
  it('renders layout with sidebar and header', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('header-user-provider')).toBeInTheDocument()
    expect(screen.getByText('Header: Notes')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders children in main content area', () => {
    render(
      <RootLayout>
        <div data-testid="main-content">Main Content</div>
      </RootLayout>
    )

    const mainContent = screen.getByTestId('main-content')
    expect(mainContent).toBeInTheDocument()
    expect(mainContent.closest('main')).toHaveClass(
      'h-[calc(100vh-4rem)]',
      'overflow-x-auto',
      'max-w-full',
      'break-all'
    )
  })
})
