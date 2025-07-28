export interface User {
  id: string
  username: string
  fullName?: string
  role: string
  storageLimit: number // Storage limit in MB
  workspaceId?: string
  workspace?: {
    id: string
    name: string
  }
  // Add other public fields as needed
}
