# Testing Next.js Pages Guide

This guide covers how to test Next.js pages in the account app, including different types of pages and testing patterns.

## Table of Contents

1. [Basic Page Testing](#basic-page-testing)
2. [Complex Page Testing](#complex-page-testing)
3. [Dynamic Route Testing](#dynamic-route-testing)
4. [Testing Patterns](#testing-patterns)
5. [Mocking Strategies](#mocking-strategies)
6. [Best Practices](#best-practices)

## Basic Page Testing

### Simple Static Pages

For simple pages like the home page:

```typescript
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from '../../app/(home)/page'

describe('Home Page', () => {
  it('renders the home page content', () => {
    render(<Home />)
    expect(screen.getByText('hi')).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    expect(() => render(<Home />)).not.toThrow()
  })
})
```

## Complex Page Testing

### Pages with API Calls and State Management

For pages that fetch data and manage state:

```typescript
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { UserProvider } from '@repo/auth'
import WorkspacesPage from '../../app/(home)/workspaces/page'

// Mock dependencies
jest.mock('@repo/api', () => ({
  getMyWorkspaces: jest.fn()
}))

jest.mock('@repo/auth', () => ({
  useUser: jest.fn(),
  UserProvider: ({ children }) => <>{children}</>
}))

jest.mock('next/link', () => {
  return ({ children, href, ...props }) => {
    return React.createElement('a', { href, ...props }, children)
  }
})

describe('Workspaces Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Test different states
  describe('Loading State', () => {
    it('shows loading state when user is loading', () => {
      // Mock loading state
      ;(useUser as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
        accessToken: null
      })

      render(
        <UserProvider>
          <WorkspacesPage />
        </UserProvider>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error message when API call fails', async () => {
      // Mock error state
      ;(useUser as jest.Mock).mockReturnValue({
        user: mockUser,
        loading: false,
        accessToken: 'test-token'
      })
      ;(getMyWorkspaces as jest.Mock).mockRejectedValue(new Error('API Error'))

      await act(async () => {
        render(
          <UserProvider>
            <WorkspacesPage />
          </UserProvider>
        )
      })

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument()
      })
    })
  })
})
```

## Dynamic Route Testing

### Pages with URL Parameters

For pages that use dynamic routes like `[id]`:

```typescript
import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { UserProvider } from '@repo/auth'
import WorkspaceDetailsPage from '../../app/(home)/workspaces/[id]/page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'workspace-1' })
}))

// Mock other dependencies
jest.mock('@repo/api', () => ({
  getMyWorkspaces: jest.fn(),
  getWorkspaceMembers: jest.fn()
}))

jest.mock('@repo/auth', () => ({
  useUser: jest.fn(),
  UserProvider: ({ children }) => <>{children}</>
}))

describe('Workspace Details Page', () => {
  it('uses workspace ID from URL params', async () => {
    ;(useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
      accessToken: 'test-token'
    })
    ;(getMyWorkspaces as jest.Mock).mockResolvedValue([mockWorkspaceMembership])
    ;(getWorkspaceMembers as jest.Mock).mockResolvedValue(mockWorkspaceMembers)

    await act(async () => {
      render(
        <UserProvider>
          <WorkspaceDetailsPage />
        </UserProvider>
      )
    })

    await waitFor(() => {
      expect(getWorkspaceMembers).toHaveBeenCalledWith('test-token', 'workspace-1')
    })
  })
})
```

## Testing Patterns

### 1. State Testing Pattern

Test different component states:

```typescript
describe('Component States', () => {
  describe('Loading State', () => {
    it('shows loading indicator', () => {
      // Mock loading state
      render(<Component loading={true} />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('shows error message', () => {
      // Mock error state
      render(<Component error="Something went wrong" />)
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  describe('Success State', () => {
    it('shows data when loaded', () => {
      // Mock success state
      render(<Component data={mockData} />)
      expect(screen.getByText('Expected Content')).toBeInTheDocument()
    })
  })
})
```

### 2. User Interaction Testing Pattern

Test user interactions:

```typescript
describe('User Interactions', () => {
  it('handles button clicks', async () => {
    const mockHandler = jest.fn()
    render(<Component onButtonClick={mockHandler} />)

    const button = screen.getByRole('button', { name: 'Click Me' })
    fireEvent.click(button)

    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  it('handles form submissions', async () => {
    const mockSubmit = jest.fn()
    render(<Component onSubmit={mockSubmit} />)

    const form = screen.getByRole('form')
    fireEvent.submit(form)

    expect(mockSubmit).toHaveBeenCalled()
  })
})
```

### 3. API Integration Testing Pattern

Test API integrations:

```typescript
describe('API Integration', () => {
  it('calls API with correct parameters', async () => {
    const mockApiCall = jest.fn().mockResolvedValue(mockData)

    await act(async () => {
      render(<Component apiCall={mockApiCall} />)
    })

    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith(expectedParams)
    })
  })

  it('handles API errors gracefully', async () => {
    const mockApiCall = jest.fn().mockRejectedValue(new Error('API Error'))

    await act(async () => {
      render(<Component apiCall={mockApiCall} />)
    })

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument()
    })
  })
})
```

## Mocking Strategies

### 1. Mocking Next.js Components

```typescript
// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, ...props }) => {
    return React.createElement('a', { href, ...props }, children)
  }
})

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-id' }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })
}))
```

### 2. Mocking API Calls

```typescript
// Mock API functions
jest.mock('@repo/api', () => ({
  ...jest.requireActual('@repo/api'),
  getMyWorkspaces: jest.fn(),
  createWorkspace: jest.fn(),
  updateWorkspace: jest.fn()
}))

// Use in tests
;(getMyWorkspaces as jest.Mock).mockResolvedValue(mockData)
;(createWorkspace as jest.Mock).mockRejectedValue(new Error('Creation failed'))
```

### 3. Mocking Hooks

```typescript
// Mock custom hooks
jest.mock('@repo/auth', () => ({
  ...jest.requireActual('@repo/auth'),
  useUser: jest.fn(),
  UserProvider: ({ children }) => <>{children}</>
}))

// Use in tests
;(useUser as jest.Mock).mockReturnValue({
  user: mockUser,
  loading: false,
  accessToken: 'test-token'
})
```

### 4. Mocking Complex Components

```typescript
// Mock modal components
jest.mock('@/components/workspace-edit-modal', () => ({
  WorkspaceEditModal: ({ open, onOpenChange }) =>
    open ? <div data-testid="workspace-edit-modal">Edit Modal</div> : null
}))

// Mock dialog components
jest.mock('@/components/leave-workspace-dialog', () => ({
  LeaveWorkspaceDialog: ({ open, onOpenChange, onConfirm }) =>
    open ? <div data-testid="leave-workspace-dialog">Leave Dialog</div> : null
}))
```

## Best Practices

### 1. Test Structure

- **Group related tests** using `describe` blocks
- **Test one thing at a time** in each test
- **Use descriptive test names** that explain the behavior
- **Follow the Arrange-Act-Assert pattern**

### 2. Async Testing

```typescript
// Always wrap async operations in act()
await act(async () => {
  render(<Component />)
})

// Use waitFor for async assertions
await waitFor(() => {
  expect(screen.getByText('Expected Content')).toBeInTheDocument()
})
```

### 3. Cleanup

```typescript
beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  cleanup()
})
```

### 4. Accessibility Testing

```typescript
// Test for accessibility
it('has proper ARIA labels', () => {
  render(<Component />)
  expect(screen.getByLabelText('Search')).toBeInTheDocument()
})

it('has proper heading structure', () => {
  render(<Component />)
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
})
```

### 5. Error Boundary Testing

```typescript
it('handles component errors gracefully', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

  expect(() => render(<Component />)).not.toThrow()

  consoleSpy.mockRestore()
})
```

## Common Testing Scenarios

### 1. Form Testing

```typescript
it('validates form inputs', async () => {
  render(<FormComponent />)

  const submitButton = screen.getByRole('button', { name: 'Submit' })
  fireEvent.click(submitButton)

  await waitFor(() => {
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })
})
```

### 2. Navigation Testing

```typescript
it('navigates to correct route', () => {
  const mockPush = jest.fn()
  jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
    push: mockPush
  })

  render(<Component />)
  const link = screen.getByRole('link', { name: 'Go to Details' })
  fireEvent.click(link)

  expect(mockPush).toHaveBeenCalledWith('/details')
})
```

### 3. Data Fetching Testing

```typescript
it('fetches data on mount', async () => {
  const mockFetch = jest.fn().mockResolvedValue(mockData)

  await act(async () => {
    render(<Component fetchData={mockFetch} />)
  })

  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- pages/workspaces.test.tsx

# Run tests in watch mode
npm test -- --watch
```

## Coverage Goals

- **Statements**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+

Focus on testing:

- ✅ User interactions
- ✅ Error handling
- ✅ Loading states
- ✅ API integrations
- ✅ Navigation flows
- ✅ Form validations
