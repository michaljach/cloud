export interface User {
  id: string
  username: string
  fullName?: string
  role: string
  workspaceId?: string
  workspace?: {
    id: string
    name: string
  }
  // Add other public fields as needed
}
