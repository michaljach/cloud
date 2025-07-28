export interface User {
  id: string
  username: string
  fullName?: string
  storageLimit: number // Storage limit in MB
  workspaces?: UserWorkspace[]
  // Add other public fields as needed
}

export interface UserWorkspace {
  id: string
  userId: string
  workspaceId: string
  role: string // 'owner', 'admin', 'member'
  joinedAt: Date
  user?: {
    id: string
    username: string
    fullName?: string
  }
  workspace: {
    id: string
    name: string
  }
}

export interface Workspace {
  id: string
  name: string
  userWorkspaces?: UserWorkspace[]
}
