import type { UserWorkspace, Workspace } from './workspace'

export interface User {
  id: string
  username: string
  fullName?: string
  storageLimit: number // Storage limit in MB
  workspaces?: UserWorkspace[]
  // Add other public fields as needed
}

// Re-export workspace types for convenience
export type { UserWorkspace, Workspace } from './workspace'
