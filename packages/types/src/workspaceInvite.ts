export interface WorkspaceInvite {
  id: string
  workspaceId: string
  invitedByUserId: string
  invitedUserId?: string
  invitedUsername: string
  role: 'owner' | 'admin' | 'member'
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'
  expiresAt: string
  createdAt: string
  workspace?: {
    id: string
    name: string
  }
  invitedBy?: {
    id: string
    username: string
    fullName?: string
  }
  invitedUser?: {
    id: string
    username: string
    fullName?: string
  }
}
