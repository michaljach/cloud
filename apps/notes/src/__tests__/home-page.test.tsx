import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import HomePage from '../app/(home)/page'

describe('HomePage', () => {
  it('renders welcome message', () => {
    render(<HomePage />)

    expect(screen.getByText('Welcome to Notes')).toBeInTheDocument()
    expect(
      screen.getByText(/Select a note from the sidebar or create a new one to get started/)
    ).toBeInTheDocument()
  })

  it('has correct styling classes', () => {
    render(<HomePage />)

    const container = screen.getByText('Welcome to Notes').parentElement?.parentElement
    expect(container).toHaveClass('w-full', 'h-full', 'flex', 'items-center', 'justify-center')
  })
})
