import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { act } from '@testing-library/react'
import { UserProvider, WorkspaceProvider } from '@repo/contexts'
import { SidebarProvider } from '@repo/ui/components/base/sidebar'
import { SaveStatusProvider } from '../providers/save-status-context'

// Helper function to wait for all pending state updates
export const waitForStateUpdates = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

// Helper function to wait for async operations to complete
export const waitForAsync = async (fn: () => Promise<any>) => {
  await act(async () => {
    await fn()
  })
}

// Custom render function that includes all necessary providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <UserProvider>
        <WorkspaceProvider>
          <SidebarProvider>
            <SaveStatusProvider>{children}</SaveStatusProvider>
          </SidebarProvider>
        </WorkspaceProvider>
      </UserProvider>
    )
  }

  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Helper to create a promise that can be resolved externally
export const createControllablePromise = function <T>() {
  let resolve: (value: T) => void
  let reject: (reason?: any) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return {
    promise,
    resolve: resolve!,
    reject: reject!
  }
}
