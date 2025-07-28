export interface Workspace {
  id: string
  name: string
  userWorkspaces?: UserWorkspace[]
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

export interface WorkspaceMember {
  id: string
  userId: string
  workspaceId: string
  role: string
  joinedAt: string
  user: {
    id: string
    username: string
    fullName?: string
  }
  workspace: {
    id: string
    name: string
  }
}

export interface WorkspaceMembership {
  id: string
  userId: string
  workspaceId: string
  role: string
  joinedAt: string
  workspace: {
    id: string
    name: string
  }
}
