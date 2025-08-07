export interface PlatformSettings {
  id: string
  title: string
  timezone: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  defaultStorageLimit: number
  maxFileSize: number
  supportEmail: string | null
  companyName: string | null
  updatedAt: string
  createdAt: string
}
