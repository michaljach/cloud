import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from '../../app/(home)/page'

describe('Home Page', () => {
  it('renders the home page content', () => {
    render(<Home />)

    expect(screen.getByText('Welcome to Cloud Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Workspaces')).toBeInTheDocument()
    expect(screen.getByText('Account Settings')).toBeInTheDocument()
    expect(screen.getByText('Invitations')).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    expect(() => render(<Home />)).not.toThrow()
  })
})
