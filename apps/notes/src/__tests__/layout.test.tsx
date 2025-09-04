import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'

import RootLayout from '../app/(home)/layout'

// Mock the components used in the layout
jest.mock('@/features/layout/page-sidebar', () => ({
  PageSidebar: () => <div data-testid="page-sidebar">Page Sidebar</div>
}))

jest.mock('@/features/layout/page-header', () => ({
  NotesPageHeader: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div data-testid="page-header">
      <span>Header: {title}</span>
      {children}
    </div>
  )
}))

jest.mock('@/features/notes/providers/status-provider', () => ({
  SaveStatusProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

jest.mock('@/features/notes/providers/notes-provider', () => ({
  NotesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

describe('RootLayout', () => {
  it('renders layout with sidebar and header', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('page-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('page-header')).toBeInTheDocument()
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
